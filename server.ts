import 'dotenv/config';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, setDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore';

const app = express();
const PORT = 3000;

// Enable CORS for external webhook clients (n8n, Postman, etc.)
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-api-key');
  if (_req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Default Firebase configuration connecting to the existing project and Firestore database
const DEFAULT_FIREBASE_CONFIG = {
  projectId: 'maximal-lantern-qcjpc',
  appId: '1:79800028498:web:66ee64ca69935d7f427e8b',
  apiKey: 'AIzaSyB9Bya7PVkCv_EyzcL7S_SXhYmsZFFf0gI',
  authDomain: 'maximal-lantern-qcjpc.firebaseapp.com',
  firestoreDatabaseId: 'ai-studio-pickneatdailysal-62da1a33-957f-4db0-8083-7507c8f5a50c',
  storageBucket: 'maximal-lantern-qcjpc.firebasestorage.app',
  messagingSenderId: '79800028498',
};

// Load configuration from file if available, or fall back to DEFAULT_FIREBASE_CONFIG
let firebaseConfig: any = DEFAULT_FIREBASE_CONFIG;
try {
  const possiblePaths = [
    path.join(process.cwd(), 'firebase-applet-config.json'),
    path.join(__dirname, 'firebase-applet-config.json'),
    path.join(__dirname, '..', 'firebase-applet-config.json'),
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      firebaseConfig = { ...DEFAULT_FIREBASE_CONFIG, ...JSON.parse(fs.readFileSync(p, 'utf8')) };
      break;
    }
  }
} catch (err) {
  console.warn('Using default Firebase configuration:', err);
}

// Initialize Firestore client
let firestoreDb: any = null;
try {
  const fbApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  const dbId = firebaseConfig.firestoreDatabaseId;
  firestoreDb = dbId ? getFirestore(fbApp, dbId) : getFirestore(fbApp);
} catch (err) {
  console.error('Failed to initialize Firebase SDK on server:', err);
}

interface SalesRecord {
  id: string;
  date: string; // YYYY-MM-DD format
  cash: number;
  online: number;
  total: number;
  profit: number; // 20%
  cogs: number; // 80%
  notes?: string;
  createdAt: string;
  updatedAt: string;
  eventId?: string;
  messageId?: string;
}

// In-memory idempotency cache for duplicate webhook event protection
const processedEvents = new Map<string, { timestamp: number; record: SalesRecord }>();

// Clean up events older than 24 hours
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of processedEvents.entries()) {
    if (now - v.timestamp > 24 * 60 * 60 * 1000) {
      processedEvents.delete(k);
    }
  }
}, 60 * 60 * 1000);

/**
 * Check if a duplicate sale already exists for this eventId, or identical date/amounts
 */
async function findExistingDuplicateSale(
  date: string,
  cash: number,
  online: number,
  eventId?: string
): Promise<SalesRecord | null> {
  // 1. Check in-memory cache
  if (eventId && processedEvents.has(eventId)) {
    return processedEvents.get(eventId)!.record;
  }
  const contentKey = `${date}_${cash}_${online}`;
  if (processedEvents.has(contentKey)) {
    return processedEvents.get(contentKey)!.record;
  }

  // 2. Query Firestore collection
  if (firestoreDb) {
    try {
      const salesCol = collection(firestoreDb, 'sales');

      // Check by specific ID if eventId provided
      if (eventId) {
        const cleanId = eventId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 48);
        const specificDoc = await getDoc(doc(firestoreDb, 'sales', `rec_${date}_${cleanId}`));
        if (specificDoc.exists()) {
          const d = specificDoc.data() as SalesRecord;
          return { ...d, id: specificDoc.id };
        }
      }

      // Query by date
      const q = query(salesCol, where('date', '==', date));
      const snap = await getDocs(q);
      if (!snap.empty) {
        for (const docSnap of snap.docs) {
          const d = docSnap.data() as any;
          // Check eventId match
          if (eventId && (d.eventId === eventId || d.messageId === eventId || docSnap.id.includes(eventId))) {
            return { ...d, id: docSnap.id };
          }
          // Check identical numbers for the same date
          if (
            Math.abs(Number(d.cash) - cash) < 0.01 &&
            Math.abs(Number(d.online) - online) < 0.01
          ) {
            return { ...d, id: docSnap.id };
          }
        }
      }
    } catch (err) {
      console.warn('Error checking existing duplicate sale in Firestore:', err);
    }
  }

  return null;
}

/**
 * Write a sales record to the existing Firestore "sales" collection.
 * Uses Firebase Web SDK with automatic fallback to Firestore REST API.
 */
async function writeSaleRecord(record: SalesRecord): Promise<void> {
  // Requirement 1, 3, 4, 5: NEVER save a sales record when Cash = 0 AND Online = 0 AND Total = 0
  if (record.cash <= 0 && record.online <= 0 && record.total <= 0) {
    throw new Error('Validation failed: Attempted to save sales record with zero cash, online, and total.');
  }

  // Method 1: Firebase JS SDK
  if (firestoreDb) {
    try {
      const docRef = doc(firestoreDb, 'sales', record.id);
      await setDoc(docRef, {
        id: record.id,
        date: record.date,
        cash: record.cash,
        online: record.online,
        total: record.total,
        profit: record.profit,
        cogs: record.cogs,
        notes: record.notes || '',
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        ...(record.eventId ? { eventId: record.eventId } : {}),
      }, { merge: true });
      return;
    } catch (sdkErr) {
      console.warn('Firebase SDK write failed, attempting REST API fallback:', sdkErr);
    }
  }

  // Method 2: Firestore REST API fallback
  if (firebaseConfig && firebaseConfig.projectId && firebaseConfig.apiKey) {
    const projectId = firebaseConfig.projectId;
    const dbId = firebaseConfig.firestoreDatabaseId || '(default)';
    const apiKey = firebaseConfig.apiKey;
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${dbId}/documents/sales?documentId=${encodeURIComponent(record.id)}&key=${apiKey}`;

    const body = {
      fields: {
        id: { stringValue: record.id },
        date: { stringValue: record.date },
        cash: { doubleValue: record.cash },
        online: { doubleValue: record.online },
        total: { doubleValue: record.total },
        profit: { doubleValue: record.profit },
        cogs: { doubleValue: record.cogs },
        notes: { stringValue: record.notes || '' },
        createdAt: { stringValue: record.createdAt },
        updatedAt: { stringValue: record.updatedAt },
        ...(record.eventId ? { eventId: { stringValue: record.eventId } } : {}),
      },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Firestore write returned ${res.status}: ${errText}`);
    }
    return;
  }

  throw new Error('Firestore is not configured. Could not save record.');
}

/**
 * Robust numeric parser supporting numbers, strings with commas, currencies, etc.
 */
function parseNumeric(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).replace(/[^0-9.-]/g, '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Robust date parser supporting WhatsApp formats:
 * e.g. "9th Sep", "10th Sep", "11th Sep", "1st Sep", "9 Sep 2026", "2026-09-09", "09/09/2026", etc.
 * Normalizes output to YYYY-MM-DD.
 * Default year is strictly 2026; does NOT use current server date.
 */
function parseDateInput(inputDate?: any): { formattedDate: string | null; rawDate: string; isValid: boolean } {
  if (inputDate === undefined || inputDate === null) {
    return { formattedDate: null, rawDate: '', isValid: false };
  }

  const raw = String(inputDate)
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ')
    .trim()
    .replace(/^["']+|["']+$/g, '');

  if (!raw || raw === '=' || raw === '-' || !/[a-zA-Z0-9]/.test(raw)) {
    return { formattedDate: null, rawDate: raw, isValid: false };
  }

  // 1) Standard ISO: YYYY-MM-DD
  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = String(isoMatch[2]).padStart(2, '0');
    const d = String(isoMatch[3]).padStart(2, '0');
    return { formattedDate: `${y}-${m}-${d}`, rawDate: raw, isValid: true };
  }

  // 2) DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (dmyMatch) {
    const d = String(dmyMatch[1]).padStart(2, '0');
    const m = String(dmyMatch[2]).padStart(2, '0');
    let y = dmyMatch[3];
    if (y.length === 2) y = `20${y}`;
    return { formattedDate: `${y}-${m}-${d}`, rawDate: raw, isValid: true };
  }

  const monthMap: Record<string, string> = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', sept: '09', september: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12',
  };

  // Strip ordinal suffixes (9th -> 9, 10th -> 10, 11th -> 11, 1st -> 1, 2nd -> 2, 3rd -> 3)
  const cleaned = raw
    .replace(/(\d+)(st|nd|rd|th)\b/gi, '$1')
    .replace(/(\d+)(st|nd|rd|th)/gi, '$1')
    .replace(/[,;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Find month keyword in cleaned text
  const lower = cleaned.toLowerCase();
  let foundMonthKey: string | null = null;
  for (const key of Object.keys(monthMap)) {
    const reg = new RegExp(`\\b${key}\\b`, 'i');
    if (reg.test(lower)) {
      foundMonthKey = key;
      break;
    }
  }

  if (foundMonthKey) {
    const mon = monthMap[foundMonthKey];
    const numbers = cleaned.match(/\d+/g);
    if (numbers && numbers.length > 0) {
      let day = '';
      let year = '2026'; // Explicit target year

      for (const num of numbers) {
        if (num.length === 4) {
          year = num;
        } else if (!day && parseInt(num, 10) >= 1 && parseInt(num, 10) <= 31) {
          day = String(parseInt(num, 10)).padStart(2, '0');
        } else if (day && (num.length === 2 || num.length === 4)) {
          year = num.length === 2 ? `20${num}` : num;
        }
      }

      if (day) {
        return { formattedDate: `${year}-${mon}-${day}`, rawDate: raw, isValid: true };
      }
    }
  }

  // 3) Standard JS Date parser if valid
  const parsed = new Date(cleaned);
  if (!isNaN(parsed.getTime()) && /[0-9]/.test(cleaned) && cleaned.length >= 6) {
    const y = parsed.getFullYear() >= 2000 ? String(parsed.getFullYear()) : '2026';
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return { formattedDate: `${y}-${m}-${d}`, rawDate: raw, isValid: true };
  }

  return { formattedDate: null, rawDate: raw, isValid: false };
}

/**
 * Extract API key from x-api-key header, Authorization: Bearer, query string, or body
 */
function extractApiKey(req: Request): string | null {
  const xApiKey = req.headers['x-api-key'];
  if (typeof xApiKey === 'string' && xApiKey.trim()) {
    return xApiKey.trim();
  }

  const authHeader = req.headers['authorization'];
  if (typeof authHeader === 'string') {
    const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
    if (bearerMatch) return bearerMatch[1].trim();
    if (authHeader.trim()) return authHeader.trim();
  }

  if (typeof req.query.api_key === 'string' && req.query.api_key.trim()) {
    return req.query.api_key.trim();
  }
  if (typeof req.query.key === 'string' && req.query.key.trim()) {
    return req.query.key.trim();
  }

  if (req.body && typeof req.body.api_key === 'string' && req.body.api_key.trim()) {
    return req.body.api_key.trim();
  }
  if (req.body && typeof req.body.apiKey === 'string' && req.body.apiKey.trim()) {
    return req.body.apiKey.trim();
  }

  return null;
}

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: "Pick 'N' Eat Daily Sales Server",
    time: new Date().toISOString(),
    whatsappEndpoint: '/api/whatsapp-sale',
    apiKeyConfigured: Boolean(process.env.WHATSAPP_SALE_API_KEY),
  });
});

// Helper for accidental GET requests
app.get('/api/whatsapp-sale', (_req: Request, res: Response) => {
  res.status(405).json({
    error: 'Method Not Allowed. Send a POST request with JSON body { date, cash, online, total_collection } and x-api-key header.',
  });
});

/**
 * POST /api/whatsapp-sale
 * Receives daily sales data from n8n WhatsApp webhook
 */
app.post('/api/whatsapp-sale', async (req: Request, res: Response) => {
  try {
    const expectedApiKey = process.env.WHATSAPP_SALE_API_KEY;

    if (!expectedApiKey) {
      return res.status(500).json({
        success: false,
        error: 'Server configuration error: WHATSAPP_SALE_API_KEY is not configured in server environment variables.',
      });
    }

    const providedApiKey = extractApiKey(req);
    if (!providedApiKey || providedApiKey !== expectedApiKey) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid or missing API key. Provide WHATSAPP_SALE_API_KEY via x-api-key header, Authorization: Bearer, or ?api_key= query parameter.',
      });
    }

    let payload = req.body;
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload);
      } catch {
        // keep string if not parseable
      }
    }
    if (payload && typeof payload === 'object') {
      if (payload.body && typeof payload.body === 'object') {
        payload = payload.body;
      } else if (payload.data && typeof payload.data === 'object' && !Array.isArray(payload.data)) {
        payload = payload.data;
      }
    }
    payload = payload || {};

    // Extract idempotency / message ID if provided by n8n or WhatsApp webhook
    const rawEventId =
      payload.message_id ??
      payload.messageId ??
      payload.msg_id ??
      payload.msgId ??
      payload.event_id ??
      payload.eventId ??
      payload.idempotency_key ??
      payload.idempotencyKey ??
      payload.wamid ??
      payload.wam_id ??
      payload.id ??
      req.headers['x-idempotency-key'] ??
      req.headers['x-message-id'] ??
      req.headers['x-event-id'] ??
      '';
    const eventId = String(rawEventId).trim();

    const rawDateInput = payload.date ?? payload.Date ?? payload.sale_date ?? payload.saleDate;
    const rawCash = payload.cash ?? payload.Cash ?? payload.cash_amount ?? payload.cashAmount;
    const rawOnline = payload.online ?? payload.Online ?? payload.online_amount ?? payload.onlineAmount ?? payload.upi;
    const rawTotalCollection = payload.total_collection ?? payload.totalCollection ?? payload.total ?? payload.Total ?? payload.collection;
    const userNotes = payload.notes ?? payload.Notes ?? payload.note;

    // Requirement 1, 3, 4, 10: Validate Cash and Online
    const cash = parseNumeric(rawCash);
    const online = parseNumeric(rawOnline);

    if (cash <= 0 && online <= 0) {
      return res.status(400).json({
        success: false,
        ignored: true,
        error: 'Invalid or empty sales values: cash or online must be greater than 0. No sales record created.',
      });
    }

    // Requirement 2 & 7: Parse date into YYYY-MM-DD for year 2026. Do NOT use current server date.
    const parsedDate = parseDateInput(rawDateInput);
    if (!parsedDate.isValid || !parsedDate.formattedDate) {
      return res.status(400).json({
        success: false,
        ignored: true,
        error: 'Invalid or missing sale date. No sales record created.',
      });
    }
    const formattedDate = parsedDate.formattedDate;

    // Requirement 3: Preserve numeric values exactly: cash 1490, online 3567, total 5057
    let total: number;
    if (rawTotalCollection !== undefined && rawTotalCollection !== null && String(rawTotalCollection).trim() !== '') {
      total = parseNumeric(rawTotalCollection);
    } else {
      total = Math.round((cash + online) * 100) / 100;
    }

    // Requirement 4 & 5: Calculate profit = total * 0.20 and cogs = total * 0.80
    const profit = Math.round(total * 0.20 * 100) / 100;
    const cogs = Math.round(total * 0.80 * 100) / 100;

    // Requirement 6: Duplicate protection - check if same webhook/sale event was already processed
    const existingDuplicate = await findExistingDuplicateSale(formattedDate, cash, online, eventId || undefined);
    if (existingDuplicate) {
      return res.status(200).json({
        success: true,
        message: 'Sale already recorded (duplicate webhook event ignored)',
        documentId: existingDuplicate.id,
        data: existingDuplicate,
        isDuplicate: true,
      });
    }

    // Document ID: Use deterministic idempotency key or eventId
    const safeEventKey = eventId
      ? eventId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 48)
      : `c${cash}_o${online}`;
    const documentId = `rec_${formattedDate}_${safeEventKey}`;
    const nowIso = new Date().toISOString();
    const notes = userNotes || (parsedDate.rawDate && parsedDate.rawDate !== formattedDate ? `WhatsApp Sale (${parsedDate.rawDate})` : 'WhatsApp Sale');

    const saleRecord: SalesRecord = {
      id: documentId,
      date: formattedDate,
      cash,
      online,
      total,
      profit,
      cogs,
      notes,
      createdAt: nowIso,
      updatedAt: nowIso,
      ...(eventId ? { eventId, messageId: eventId } : {}),
    };

    // 4. Write into the existing Firestore "sales" collection
    await writeSaleRecord(saleRecord);

    // Record in in-memory idempotency cache
    const contentKey = `${formattedDate}_${cash}_${online}`;
    processedEvents.set(contentKey, { timestamp: Date.now(), record: saleRecord });
    if (eventId) {
      processedEvents.set(eventId, { timestamp: Date.now(), record: saleRecord });
    }

    // Return JSON confirming success and the created Firestore document ID
    return res.status(201).json({
      success: true,
      message: 'Sale recorded successfully in Firestore',
      documentId,
      data: saleRecord,
    });
  } catch (error: any) {
    console.error('Error processing /api/whatsapp-sale:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error while recording sale',
    });
  }
});

async function startServer() {
  const isProduction =
    process.env.NODE_ENV === 'production' ||
    process.argv[1]?.includes('dist') ||
    process.argv[1]?.endsWith('server.cjs');

  if (isProduction) {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    try {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn('Vite dev server middleware failed to start, falling back to static build:', err);
      const distPath = path.join(process.cwd(), 'dist');
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get('*', (_req: Request, res: Response) => {
          res.sendFile(path.join(distPath, 'index.html'));
        });
      }
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Pick 'N' Eat Server running on http://0.0.0.0:${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer();

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

const LOCAL_STORAGE_KEY = 'sie_webhook_url';
const DEFAULT_WEBHOOK_URL = '';

/**
 * Get saved Google Apps Script Webhook URL from localStorage or Firestore
 */
export function getWebhookUrl(): string {
  if (typeof window === 'undefined') return DEFAULT_WEBHOOK_URL;
  return localStorage.getItem(LOCAL_STORAGE_KEY) || DEFAULT_WEBHOOK_URL;
}

/**
 * Save Google Apps Script Webhook URL to localStorage and sync to Firestore
 */
export async function saveWebhookUrl(url: string): Promise<void> {
  const trimmed = url.trim();
  localStorage.setItem(LOCAL_STORAGE_KEY, trimmed);

  try {
    const docRef = doc(db, 'settings', 'webhook');
    await setDoc(docRef, { url: trimmed, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (err) {
    console.warn('Failed to sync webhook URL to Firestore settings:', err);
  }
}

/**
 * Fetch initial webhook settings from Firestore
 */
export async function fetchWebhookUrlFromFirestore(): Promise<string> {
  try {
    const docRef = doc(db, 'settings', 'webhook');
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data()?.url) {
      const url = snap.data().url;
      localStorage.setItem(LOCAL_STORAGE_KEY, url);
      return url;
    }
  } catch (err) {
    console.warn('Could not fetch webhook URL from Firestore:', err);
  }
  return getWebhookUrl();
}

/**
 * Send JSON payload asynchronously to Google Apps Script Webhook URL
 */
export async function sendWebhookPayload(
  eventType: 'financial_transaction' | 'nomination_update' | 'committee_task' | 'certificate_generated' | 'bulk_export',
  payload: any
): Promise<{ success: boolean; message: string }> {
  const webhookUrl = getWebhookUrl();

  if (!webhookUrl) {
    console.log(`[Webhook Bypass] Event "${eventType}" recorded locally. Webhook URL not set yet.`);
    return { success: false, message: 'Webhook URL belum dikonfigurasi di Pengaturan.' };
  }

  const dataToSend = {
    event: eventType,
    timestamp: new Date().toISOString(),
    source: 'Sie Penganugerahan App',
    data: payload,
  };

  try {
    // Note: Google Apps Script Webhook requires mode: 'no-cors' for browser requests without preflight errors,
    // or direct POST.
    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend),
    });

    console.log(`[Webhook Success] Payload for "${eventType}" sent to Google Apps Script.`);
    return { success: true, message: 'Data berhasil dikirim ke Google Sheets via Webhook!' };
  } catch (error) {
    console.warn(`[Webhook Warning] Failed to send payload for "${eventType}":`, error);
    return { success: false, message: 'Gagal mengirim data ke Webhook. Cek koneksi atau URL.' };
  }
}

/**
 * Helper to export data rows into a downloadable CSV file
 */
export function exportToCSV(
  filename: string,
  headers: string[],
  rows: (string | number | undefined | null)[][]
) {
  const sanitizeCell = (val: any) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerRow = headers.map(sanitizeCell).join(',');
  const dataRows = rows.map((row) => row.map(sanitizeCell).join(','));
  const csvContent = '\uFEFF' + [headerRow, ...dataRows].join('\n'); // Add UTF-8 BOM for Indonesian characters

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Sample Google Apps Script Code template to provide to user
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `
// ================================================================
// GOOGLE APPS SCRIPT WEBHOOK UNTUK SIE PENGANUGERAHAN
// ================================================================
// 1. Buka Google Sheets Anda -> Extensions -> Apps Script
// 2. Hapus seluruh kode lama, lalu Salin & Tempel kode di bawah ini:

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var contents = JSON.parse(e.postData.contents);
    var event = contents.event || "Unspecified Event";
    var timestamp = contents.timestamp || new Date().toISOString();
    var data = contents.data;

    // Tulis header jika sheet masih kosong
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Waktu", "Jenis Event", "Detail Data JSON"]);
    }

    sheet.appendRow([timestamp, event, JSON.stringify(data)]);

    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Data tersimpan" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 3. Klik "Deploy" -> "New Deployment"
// 4. Pilih type "Web app"
// 5. Execute as: "Me", Who has access: "Anyone"
// 6. Copy Webhook URL yang dihasilkan dan tempelkan ke Pengaturan Webhook di Aplikasi.
`;

import { getWebhookUrl } from './webhookService';

// Tempelkan URL Web App yang Anda dapatkan dari Google Apps Script di sini
const GOOGLE_SHEETS_WEBHOOK_URL = 'ISI_DENGAN_URL_WEB_APP_ANDA';

/**
 * Sync data array of a specific collection to Google Sheets
 * @param sheetName Name of sheet / collection (e.g. "Nominasi", "Keuangan", "Panitia", "Sertifikat", "Surat")
 * @param dataArray Array of items to be synced
 */
export const syncCollectionToSheets = async (sheetName: string, dataArray: any[]) => {
  // Use constant if provided by user, otherwise fall back to URL stored in Webhook settings
  const targetUrl =
    (GOOGLE_SHEETS_WEBHOOK_URL as string) !== 'ISI_DENGAN_URL_WEB_APP_ANDA' && (GOOGLE_SHEETS_WEBHOOK_URL as string).trim()
      ? GOOGLE_SHEETS_WEBHOOK_URL
      : getWebhookUrl();

  if (!targetUrl || !dataArray || dataArray.length === 0) return;

  try {
    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sheet: sheetName,
        action: 'sync',
        rows: dataArray,
      }),
    });
    console.log(`Berhasil kirim ${sheetName} ke Google Sheets`);
  } catch (error) {
    console.error(`Gagal sync data ${sheetName}:`, error);
  }
};

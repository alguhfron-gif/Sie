import { getWebhookUrl, saveWebhookUrl } from './webhookService';
import {
  Nomination,
  Transaction,
  CommitteeTask,
  RundownItem,
  InventoryItem,
  OfficialDocument,
  RegulationRule,
  CommitteeAccount,
} from '../types';
import { CertificateRecord } from './certificatesService';

export interface AllDataPayload {
  nominations?: Nomination[];
  transactions?: Transaction[];
  tasks?: CommitteeTask[];
  rundown?: RundownItem[];
  inventory?: InventoryItem[];
  certificates?: CertificateRecord[];
  documents?: OfficialDocument[];
  regulations?: RegulationRule[];
  accounts?: CommitteeAccount[];
}

/**
 * Send payload to Google Sheets Web App URL
 */
export async function sendToGoogleSheets(
  action: string,
  data: any,
  customUrl?: string
): Promise<{ success: boolean; message: string }> {
  const url = (customUrl && customUrl.trim()) || getWebhookUrl();

  if (!url) {
    return {
      success: false,
      message: 'Web App URL Google Sheets belum dikonfigurasi. Silakan isi URL di Pengaturan Webhook.',
    };
  }

  const payload = {
    action,
    event: action,
    timestamp: new Date().toISOString(),
    appName: 'Sie Penganugerahan Web App',
    data,
  };

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      message: 'Data berhasil dikirim ke Google Sheets!',
    };
  } catch (error) {
    console.error('Failed to sync data with Google Sheets:', error);
    return {
      success: false,
      message: 'Gagal menghubungkan ke Google Sheets. Pastikan URL Web App valid.',
    };
  }
}

/**
 * Synchronize Nominations collection to Google Sheets
 */
export async function syncNominationsToGoogleSheets(
  nominations: Nomination[],
  webAppUrl?: string
) {
  return sendToGoogleSheets('sync_nominations', nominations, webAppUrl);
}

/**
 * Synchronize Financial Transactions to Google Sheets
 */
export async function syncFinanceToGoogleSheets(
  transactions: Transaction[],
  webAppUrl?: string
) {
  return sendToGoogleSheets('sync_finance', transactions, webAppUrl);
}

/**
 * Synchronize Committee tasks, rundown, and inventory to Google Sheets
 */
export async function syncCommitteeToGoogleSheets(
  tasks: CommitteeTask[],
  rundown?: RundownItem[],
  inventory?: InventoryItem[],
  webAppUrl?: string
) {
  return sendToGoogleSheets('sync_committee', { tasks, rundown, inventory }, webAppUrl);
}

/**
 * Synchronize Generated Certificate records to Google Sheets
 */
export async function syncCertificatesToGoogleSheets(
  certificates: CertificateRecord[],
  webAppUrl?: string
) {
  return sendToGoogleSheets('sync_certificates', certificates, webAppUrl);
}

/**
 * Synchronize Official Documents and Regulations to Google Sheets
 */
export async function syncDocumentsToGoogleSheets(
  documents: OfficialDocument[],
  regulations?: RegulationRule[],
  webAppUrl?: string
) {
  return sendToGoogleSheets('sync_documents', { documents, regulations }, webAppUrl);
}

/**
 * Synchronize Committee Accounts to Google Sheets
 */
export async function syncAccountsToGoogleSheets(
  accounts: CommitteeAccount[],
  webAppUrl?: string
) {
  return sendToGoogleSheets('sync_accounts', accounts, webAppUrl);
}

/**
 * Synchronize ALL collections (nominations, finance, committee, certificates, documents, accounts) in one batch
 */
export async function syncAllCollectionsToGoogleSheets(
  allData: AllDataPayload,
  webAppUrl?: string
) {
  return sendToGoogleSheets('sync_all', allData, webAppUrl);
}

export { getWebhookUrl, saveWebhookUrl };
export { syncCollectionToSheets } from './googleSheetsSync';

/**
 * Complete Google Apps Script snippet for multi-tab Google Sheets auto-sync
 */
export const GOOGLE_APPS_SCRIPT_FULL_CODE = `
// ============================================================================
// KODE GOOGLE APPS SCRIPT OTOMATIS - SIE PENGANUGERAHAN
// ============================================================================
// CARA MEMASANG DI GOOGLE SHEETS:
// 1. Buka Google Sheets Anda.
// 2. Klik menu Extensi (Extensions) -> Apps Script.
// 3. Hapus semua kode default, lalu Tempel (Paste) seluruh kode di bawah ini.
// 4. Klik tombol "Deploy" -> "Deployment Baru" (New Deployment).
// 5. Pilih jenis (Select type): "Web app".
// 6. Jalankan sebagai (Execute as): "Saya" (Me / email Anda).
// 7. Yang memiliki akses (Who has access): "Siapa saja" (Anyone).
// 8. Klik Deploy, Berikan Izin Akses (Grant Permissions), lalu salin Web App URL.
// 9. Tempelkan Web App URL tersebut ke form Pengaturan Webhook di Aplikasi!
// ============================================================================

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var contents = JSON.parse(e.postData.contents);
    var action = contents.action || contents.event || "sync_all";
    var data = contents.data || {};

    if (action === "sync_all" || action === "bulk_export") {
      if (data.nominations) writeSheet(ss, "Nominasi", getNominationHeaders(), formatNominations(data.nominations));
      if (data.transactions) writeSheet(ss, "Keuangan", getFinanceHeaders(), formatFinance(data.transactions));
      if (data.tasks) writeSheet(ss, "Tugas Panitia", getTaskHeaders(), formatTasks(data.tasks));
      if (data.rundown) writeSheet(ss, "Rundown Acara", getRundownHeaders(), formatRundown(data.rundown));
      if (data.inventory) writeSheet(ss, "Inventaris", getInventoryHeaders(), formatInventory(data.inventory));
      if (data.certificates) writeSheet(ss, "Sertifikat", getCertificateHeaders(), formatCertificates(data.certificates));
      if (data.documents) writeSheet(ss, "Surat & Dokumen", getDocumentHeaders(), formatDocuments(data.documents));
      if (data.accounts) writeSheet(ss, "Akun Petugas", getAccountHeaders(), formatAccounts(data.accounts));
    } else if (action === "sync_nominations" && Array.isArray(data)) {
      writeSheet(ss, "Nominasi", getNominationHeaders(), formatNominations(data));
    } else if (action === "sync_finance" && Array.isArray(data)) {
      writeSheet(ss, "Keuangan", getFinanceHeaders(), formatFinance(data));
    } else if (action === "sync_committee") {
      if (data.tasks) writeSheet(ss, "Tugas Panitia", getTaskHeaders(), formatTasks(data.tasks));
      if (data.rundown) writeSheet(ss, "Rundown Acara", getRundownHeaders(), formatRundown(data.rundown));
      if (data.inventory) writeSheet(ss, "Inventaris", getInventoryHeaders(), formatInventory(data.inventory));
    } else if (action === "sync_certificates" && Array.isArray(data)) {
      writeSheet(ss, "Sertifikat", getCertificateHeaders(), formatCertificates(data));
    } else if (action === "sync_documents") {
      if (data.documents) writeSheet(ss, "Surat & Dokumen", getDocumentHeaders(), formatDocuments(data.documents));
    } else if (action === "sync_accounts" && Array.isArray(data)) {
      writeSheet(ss, "Akun Petugas", getAccountHeaders(), formatAccounts(data));
    }

    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Google Sheets berhasil diperbarui" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function writeSheet(ss, sheetName, headers, rows) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  sheet.clear();
  sheet.appendRow(headers);
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setFontWeight("bold").setBackground("#e2e8f0");
  
  if (rows && rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
  sheet.setFrozenRows(1);
}

// Headers & Formatters
function getNominationHeaders() {
  return ["ID", "Nama Nominator", "Kategori", "Instansi / Departemen", "Status", "Nilai", "Pengusul", "Tanggal Buat"];
}
function formatNominations(items) {
  return items.map(function(item) {
    return [
      item.id || "",
      item.nomineeName || "",
      item.categoryName || "",
      item.department || "",
      item.status || "",
      item.score || 0,
      item.submittedBy || "",
      item.createdAt || ""
    ];
  });
}

function getFinanceHeaders() {
  return ["ID", "Deskripsi", "Jenis", "Kategori", "Jumlah (Rp)", "Tanggal", "Penanggung Jawab", "Catatan"];
}
function formatFinance(items) {
  return items.map(function(item) {
    return [
      item.id || "",
      item.title || "",
      item.type === "income" ? "Pemasukan" : "Pengeluaran",
      item.category || "",
      item.amount || 0,
      item.date || "",
      item.submittedBy || "",
      item.notes || ""
    ];
  });
}

function getTaskHeaders() {
  return ["ID", "Judul Tugas", "Divisi", "Penanggung Jawab", "Tenggat Waktu", "Status", "Prioritas"];
}
function formatTasks(items) {
  return items.map(function(item) {
    return [
      item.id || "",
      item.title || "",
      item.division || "",
      item.assignee || "",
      item.dueDate || "",
      item.status || "",
      item.priority || ""
    ];
  });
}

function getRundownHeaders() {
  return ["Waktu", "Nama Kegiatan", "PJ / Pembicara", "Lokasi", "Status"];
}
function formatRundown(items) {
  return items.map(function(item) {
    return [
      item.time || "",
      item.event || "",
      item.personInCharge || "",
      item.location || "",
      item.status || ""
    ];
  });
}

function getInventoryHeaders() {
  return ["Nama Barang", "Kategori", "Jumlah Total", "Kondisi Baik", "Lokasi Simpan", "Penanggung Jawab"];
}
function formatInventory(items) {
  return items.map(function(item) {
    return [
      item.itemName || "",
      item.category || "",
      item.quantity || 0,
      item.condition || "",
      item.location || "",
      item.pic || ""
    ];
  });
}

function getCertificateHeaders() {
  return ["ID", "Nama Penerima", "Judul Penghargaan", "Nomor Sertifikat", "Tanggal Terbit", "Departemen", "Waktu Buat"];
}
function formatCertificates(items) {
  return items.map(function(item) {
    return [
      item.id || "",
      item.recipientName || "",
      item.awardTitle || "",
      item.certNumber || "",
      item.issueDate || "",
      item.department || "",
      item.generatedAt || ""
    ];
  });
}

function getDocumentHeaders() {
  return ["ID", "Nomor Surat", "Judul Surat", "Jenis Surat", "Perihal", "Sifat", "Tanggal Surat", "Pengirim", "Penerima"];
}
function formatDocuments(items) {
  return items.map(function(item) {
    return [
      item.id || "",
      item.documentNumber || "",
      item.title || "",
      item.type || "",
      item.subject || "",
      item.confidentiality || "",
      item.date || "",
      item.sender || "",
      item.recipient || ""
    ];
  });
}

function getAccountHeaders() {
  return ["ID", "Nama Lengkap", "Peran / Jabatan", "Username", "Kategori Akses"];
}
function formatAccounts(items) {
  return items.map(function(item) {
    return [
      item.id || "",
      item.name || "",
      item.role || "",
      item.username || "",
      item.category || ""
    ];
  });
}
`;

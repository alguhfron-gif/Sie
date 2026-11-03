// Integrasi Google Sheets dinonaktifkan sesuai permintaan pengguna.
// Fungsi ini dipertahankan sebagai no-op aman agar tidak menyebabkan error fetch atau unhandled promise.

export const syncCollectionToSheets = async (_sheetName: string, _dataArray: any[]): Promise<void> => {
  // No-op: Sinkronisasi Google Sheets telah dinonaktifkan.
  return Promise.resolve();
};

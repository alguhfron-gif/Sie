import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

/**
 * Upload receipt image file to Firebase Storage under 'receipts/'.
 * Falls back to Base64 Data URL if Firebase Storage bucket is restricted or unconfigured.
 */
export async function uploadReceiptImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
  const storageRef = ref(storage, `receipts/${fileName}`);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.warn("Firebase Storage upload failed or offline. Converting image to Base64 Data URL fallback:", error);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error("Gagal mengolah berkas gambar."));
        }
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }
}

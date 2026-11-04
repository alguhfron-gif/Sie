import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

/**
 * Compresses an image file client-side before uploading or saving.
 * Resizes to max width/height of 1200px and 0.8 JPEG quality.
 * Result is typically 60KB - 150KB, ensuring it fits easily into Firestore (<1MB limit)
 * and loads super fast on mobile devices.
 */
export async function compressImage(file: File, maxDimension: number = 1200, quality: number = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    // If not an image, return error
    if (!file.type.startsWith('image/')) {
      reject(new Error('Berkas harus berupa gambar (JPG, PNG, WEBP).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak dapat dibaca oleh browser.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        // Draw white background for transparency conversion
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Convert a base64 data URL to a Blob
 */
function dataURLtoBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Upload receipt image file to Firebase Storage under 'receipts/'.
 * Compresses first so mobile photos (often 5-15MB) are reduced to ~80-120KB.
 * Falls back safely to compressed Base64 Data URL if Firebase Storage bucket is restricted or unconfigured.
 */
export async function uploadReceiptImage(file: File): Promise<string> {
  // 1. First compress the image on mobile client
  let compressedDataUrl: string;
  try {
    compressedDataUrl = await compressImage(file, 1200, 0.8);
  } catch (err) {
    console.warn('Canvas compression fallback to raw read:', err);
    compressedDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // 2. Try uploading compressed Blob to Firebase Storage
  try {
    const blob = dataURLtoBlob(compressedDataUrl);
    const fileName = `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;
    const storageRef = ref(storage, `receipts/${fileName}`);

    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
    });
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (error) {
    console.info('Firebase Storage upload notice (using compressed data URL):', error);
    // Return compressed Base64 Data URL directly (only ~80KB, perfectly fits Firestore)
    return compressedDataUrl;
  }
}


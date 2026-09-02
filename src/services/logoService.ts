import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { db, logFirestoreError, OperationType } from '../firebase';

export const CUSTOM_LOGO_STORAGE_KEY = 'custom_milad_logo';
export const CUSTOM_LOGO_EVENT = 'custom_milad_logo_changed';

/**
 * Compress / optimize an image file or DataURL so it loads instantly on all devices and saves cleanly to Firestore
 */
export async function optimizeImageForLogo(
  imageSource: File | string,
  maxWidth = 512,
  maxHeight = 512
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's already an external HTTP/HTTPS URL, don't re-compress
    if (typeof imageSource === 'string' && (imageSource.startsWith('http://') || imageSource.startsWith('https://'))) {
      return resolve(imageSource);
    }

    const img = document.createElement('img');
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve(typeof imageSource === 'string' ? imageSource : '');
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Output as PNG to preserve transparency
      const dataUrl = canvas.toDataURL('image/png', 0.92);
      resolve(dataUrl);
    };

    img.onerror = (err) => {
      reject(err);
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageSource);
    }
  });
}

/**
 * Get current locally cached logo immediately
 */
export function getLocalCustomLogo(): string | null {
  try {
    return localStorage.getItem(CUSTOM_LOGO_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Save logo to Cloud Firestore (so it syncs to Mobile / Vercel / all devices) and to localStorage
 */
export async function saveCustomLogo(logoDataOrUrl: string | null): Promise<void> {
  let finalData: string | null = null;

  if (logoDataOrUrl && logoDataOrUrl.trim()) {
    try {
      finalData = await optimizeImageForLogo(logoDataOrUrl.trim());
    } catch {
      finalData = logoDataOrUrl.trim();
    }
  }

  // 1. Update localStorage immediately for instantaneous local responsiveness
  if (finalData) {
    try {
      localStorage.setItem(CUSTOM_LOGO_STORAGE_KEY, finalData);
    } catch (e) {
      console.warn('Could not write logo to localStorage:', e);
    }
  } else {
    try {
      localStorage.removeItem(CUSTOM_LOGO_STORAGE_KEY);
    } catch (e) {
      console.warn('Could not remove logo from localStorage:', e);
    }
  }

  // 2. Dispatch local event for instant UI re-render on active tab
  window.dispatchEvent(new Event(CUSTOM_LOGO_EVENT));

  // 3. Sync to Cloud Firestore in the settings collection
  try {
    const docRef = doc(db, 'settings', 'milad_logo');
    await setDoc(
      docRef,
      {
        logoUrl: finalData,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    logFirestoreError(error, OperationType.WRITE, 'settings/milad_logo');
    console.warn('Failed to sync custom logo to Firestore:', error);
  }
}

/**
 * Direct fetch from Firestore once at startup (for instant retrieval on cold start)
 */
export async function fetchInitialCustomLogo(): Promise<string | null> {
  try {
    const docRef = doc(db, 'settings', 'milad_logo');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const cloudLogo = docSnap.data()?.logoUrl || null;
      if (cloudLogo) {
        try {
          localStorage.setItem(CUSTOM_LOGO_STORAGE_KEY, cloudLogo);
        } catch {}
        window.dispatchEvent(new Event(CUSTOM_LOGO_EVENT));
        return cloudLogo;
      }
    }
  } catch (err) {
    console.warn('Initial logo fetch error:', err);
  }
  return getLocalCustomLogo();
}

/**
 * Real-time listener: Subscribes to logo changes in Firestore across all devices
 */
export function subscribeCustomLogo(callback: (logoUrl: string | null) => void): () => void {
  try {
    // Initial direct fetch
    fetchInitialCustomLogo().then((logo) => {
      if (logo) callback(logo);
    });

    const docRef = doc(db, 'settings', 'milad_logo');
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const cloudLogo = docSnap.data()?.logoUrl || null;
          // Synchronize local storage cache
          if (cloudLogo) {
            try {
              localStorage.setItem(CUSTOM_LOGO_STORAGE_KEY, cloudLogo);
            } catch {}
          } else {
            try {
              localStorage.removeItem(CUSTOM_LOGO_STORAGE_KEY);
            } catch {}
          }
          callback(cloudLogo);
          window.dispatchEvent(new Event(CUSTOM_LOGO_EVENT));
        }
      },
      (error) => {
        logFirestoreError(error, OperationType.GET, 'settings/milad_logo');
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Failed to attach Firestore logo listener:', err);
    return () => {};
  }
}

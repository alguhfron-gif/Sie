import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { auth } from '../firebase';
import { UserSession } from '../types';

const googleProvider = new GoogleAuthProvider();

export function mapFirebaseUserToSession(user: FirebaseUser): UserSession {
  return {
    id: user.uid,
    name: user.displayName || user.email?.split('@')[0].toUpperCase() || 'Pengguna Panitia',
    role: 'PANITIA PENGANUGERAHAN',
    email: user.email || undefined,
    loginTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  };
}

export async function loginWithEmail(email: string, pass: string): Promise<UserSession> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    return mapFirebaseUserToSession(userCredential.user);
  } catch (error: unknown) {
    console.error("Firebase Login Error:", error);
    const err = error as { code?: string; message?: string };
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
      throw new Error("Email atau kata sandi salah. Jika belum punya akun, buat akun baru.");
    } else if (err.code === 'auth/invalid-email') {
      throw new Error("Format email tidak valid.");
    } else if (err.code === 'auth/too-many-requests') {
      throw new Error("Terlalu banyak percobaan gagal. Silakan coba lagi nanti.");
    }
    throw new Error(err.message || "Gagal masuk dengan Firebase Email/Password.");
  }
}

export async function registerWithEmail(email: string, pass: string, name?: string): Promise<UserSession> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    if (name && userCredential.user) {
      await updateProfile(userCredential.user, { displayName: name });
    }
    return mapFirebaseUserToSession(userCredential.user);
  } catch (error: unknown) {
    console.error("Firebase Register Error:", error);
    const err = error as { code?: string; message?: string };
    if (err.code === 'auth/email-already-in-use') {
      throw new Error("Email sudah terdaftar. Silakan gunakan menu Masuk.");
    } else if (err.code === 'auth/weak-password') {
      throw new Error("Kata sandi terlalu lemah. Minimal 6 karakter.");
    } else if (err.code === 'auth/invalid-email') {
      throw new Error("Format email tidak valid.");
    }
    throw new Error(err.message || "Gagal mendaftar dengan Firebase Email/Password.");
  }
}

export async function loginWithGoogle(): Promise<UserSession> {
  try {
    const userCredential = await signInWithPopup(auth, googleProvider);
    return mapFirebaseUserToSession(userCredential.user);
  } catch (error: unknown) {
    console.error("Firebase Google Auth Error:", error);
    const err = error as { code?: string; message?: string };
    if (err.code === 'auth/popup-closed-by-user') {
      throw new Error("Jendela Login Google ditutup sebelum selesai.");
    } else if (err.code === 'auth/popup-blocked') {
      throw new Error("Jendela popup diblokir oleh browser. Izinkan popup untuk login dengan Google.");
    }
    throw new Error(err.message || "Gagal masuk menggunakan Google Sign-In.");
  }
}

export async function logoutFirebase(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Firebase Logout Error:", error);
  }
}

export function subscribeToAuthChanges(onUserChanged: (session: UserSession | null) => void) {
  return onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      onUserChanged(mapFirebaseUserToSession(firebaseUser));
    } else {
      onUserChanged(null);
    }
  });
}

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, type User as FirebaseUser } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const hasRequiredConfig =
  !!firebaseConfig.apiKey && !!firebaseConfig.projectId && !!firebaseConfig.appId;

const app = hasRequiredConfig
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;
export const storage = app ? getStorage(app) : null;

export async function ensureSignedInAnonymously(): Promise<FirebaseUser | null> {
  if (!auth) {
    return null;
  }

  if (auth.currentUser) {
    return auth.currentUser;
  }

  const credential = await signInAnonymously(auth);
  return credential.user;
}

export function assertFirebaseReady() {
  if (!db || !auth || !storage) {
    throw new Error(
      'Firebase is not initialized. Set NEXT_PUBLIC_FIREBASE_* environment variables.'
    );
  }
}

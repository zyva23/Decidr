import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

export const isGCPConfigured = Boolean(
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey.startsWith('AIza') &&
  firebaseConfig.projectId &&
  !firebaseConfig.projectId.includes('YOUR_PROJECT')
);

let app = null;
/* Standard modular check for existing app instance to handle hot-reloading */
try {
  if (isGCPConfigured) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
} catch (e) {
  console.warn("Firebase initialization failed.", e);
}

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const googleProvider = new GoogleAuthProvider();

export const logActivity = async (userId: string, actionType: string, details: any = {}) => {
  if (!db) return;
  try {
    await addDoc(collection(db, "activity_logs"), {
      userId,
      actionType,
      details,
      timestamp: serverTimestamp()
    });
  } catch (e) {
    console.error("GCP Logging Error:", e);
  }
};

export const saveDetailedFeedback = async (userId: string | undefined, sessionId: string, type: string, comment: string) => {
  if (!db) return;
  try {
    await addDoc(collection(db, "feedback_responses"), {
      userId: userId || 'guest',
      sessionId,
      feedbackType: type,
      comment,
      timestamp: serverTimestamp()
    });
  } catch (e) {
    console.error("Firebase Feedback Error:", e);
  }
};

export { signInWithPopup, signOut, onAuthStateChanged };

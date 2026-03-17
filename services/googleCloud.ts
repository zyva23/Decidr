import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc, setDoc } from "firebase/firestore";

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

const getAnonymousId = () => {
  let id = localStorage.getItem('dc_anon_id');
  if (!id) {
    id = `anon_${crypto.randomUUID()}`;
    localStorage.setItem('dc_anon_id', id);
  }
  return id;
};

const getBrowserSessionId = () => {
  let id = sessionStorage.getItem('dc_session_id');
  if (!id) {
    id = `sess_${crypto.randomUUID()}`;
    sessionStorage.setItem('dc_session_id', id);
  }
  return id;
};

let cachedLocation: any = null;

const getApproxLocation = async () => {
  if (cachedLocation) return cachedLocation;
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    cachedLocation = {
      city: data.city,
      region: data.region,
      country: data.country_name,
      ip: data.ip
    };
    return cachedLocation;
  } catch (e) {
    return { error: 'Location unavailable' };
  }
};

export const logActivity = async (userId: string | null | undefined, actionType: string, details: any = {}) => {
  if (!db) return;
  try {
    const anonId = getAnonymousId();
    const sessionId = getBrowserSessionId();
    const location = await getApproxLocation();
    
    await addDoc(collection(db, "activity_logs"), {
      userId: userId || anonId,
      isGuest: !userId,
      browserSessionId: sessionId,
      location,
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

export const saveToWaitlist = async (email: string, userId?: string) => {
  if (!db) return;
  try {
    await addDoc(collection(db, "waitlist"), {
      email,
      userId: userId || 'guest',
      timestamp: serverTimestamp()
    });
  } catch (e) {
    console.error("Waitlist Error:", e);
  }
};

export const getUserProfile = async (userId: string): Promise<{xp: number, level: number} | null> => {
  if (!db) return null;
  try {
    const docRef = doc(db, "profiles", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as {xp: number, level: number};
    }
    return null;
  } catch (e) {
    console.error("Error fetching profile:", e);
    return null;
  }
};

export const saveUserProfile = async (userId: string, xp: number, level: number) => {
  if (!db) return;
  try {
    await setDoc(doc(db, "profiles", userId), {
      xp,
      level,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.error("Error saving profile:", e);
  }
};

export { signInWithPopup, signOut, onAuthStateChanged };

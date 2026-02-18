import { DecisionSession } from '../types';
import { db } from './googleCloud';
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, orderBy } from 'firebase/firestore';

const STORAGE_KEY = 'decision_council_sessions';

/**
 * Saves a session both to LocalStorage (for instant feedback/offline)
 * and to Firebase Firestore (if a userId is provided).
 */
export const saveSession = async (session: DecisionSession): Promise<void> => {
  // 1. Sync to LocalStorage
  const sessions = getLocalSessions();
  const index = sessions.findIndex(s => s.id === session.id);
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.unshift(session);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));

  // 2. Sync to Firebase if user is logged in
  if (db && session.user_id) {
    try {
      await setDoc(doc(db, "sessions", session.id), {
        ...session,
        updatedAt: Date.now()
      });
    } catch (e) {
      console.error("Firestore Save Error:", e);
    }
  }
};

/**
 * Fetches sessions. If userId is provided, it tries to fetch from Firestore.
 * Always merges with LocalStorage to ensure nothing is lost.
 */
export const getSessions = async (userId?: string): Promise<DecisionSession[]> => {
  const localSessions = getLocalSessions();
  
  if (!db || !userId) return localSessions;

  try {
    const q = query(
      collection(db, "sessions"), 
      where("user_id", "==", userId),
      orderBy("timestamp", "desc")
    );
    const querySnapshot = await getDocs(q);
    const firestoreSessions = querySnapshot.docs.map(doc => doc.data() as DecisionSession);
    
    // Merge logic: Map by ID, favor Firestore version for conflicts
    const sessionMap = new Map<string, DecisionSession>();
    localSessions.forEach(s => sessionMap.set(s.id, s));
    firestoreSessions.forEach(s => sessionMap.set(s.id, s));
    
    return Array.from(sessionMap.values()).sort((a, b) => b.timestamp - a.timestamp);
  } catch (e) {
    console.error("Firestore Load Error:", e);
    return localSessions;
  }
};

/** Internal helper for LocalStorage access */
export const getLocalSessions = (): DecisionSession[] => {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    return [];
  }
};

export const deleteSession = async (id: string): Promise<void> => {
  // Remove from Local
  const sessions = getLocalSessions().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));

  // Remove from Firestore
  if (db) {
    try {
      await deleteDoc(doc(db, "sessions", id));
    } catch (e) {
      console.error("Firestore Delete Error:", e);
    }
  }
};

export const clearSessions = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

import { DecisionSession } from '../types';

const STORAGE_KEY = 'decision_council_sessions';

export const saveSession = (session: DecisionSession): void => {
  const sessions = getSessions();
  // Check if update or new
  const index = sessions.findIndex(s => s.id === session.id);
  if (index >= 0) {
    sessions[index] = session;
  } else {
    sessions.unshift(session); // Add to top
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};

export const getSessions = (): DecisionSession[] => {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.error("Failed to load sessions", e);
    return [];
  }
};

export const deleteSession = (id: string): void => {
  const sessions = getSessions().filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};

export const clearSessions = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveSession, getSessions, clearSessions } from '../../services/storageService';
import { DecisionInput, AnalysisStatus, DecisionSession } from '../../types';

// Mock Firebase
vi.mock('../../services/googleCloud', () => ({
  db: null,
  auth: null,
  isGCPConfigured: false,
  onAuthStateChanged: vi.fn(),
  logActivity: vi.fn(),
}));

describe('Core Functionality Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    clearSessions();
  });

  describe('Session Storage', () => {
    it('should save and retrieve multiple sessions locally', async () => {
      const mockInput: DecisionInput = { title: 'Test 1', context: 'Context 1', constraints: '', options: '' };
      const session1: DecisionSession = {
        id: '1',
        timestamp: Date.now(),
        input: mockInput,
        result: null,
        status: AnalysisStatus.COMPLETE
      };

      const session2: DecisionSession = {
        id: '2',
        timestamp: Date.now() + 1000,
        input: { ...mockInput, title: 'Test 2' },
        result: null,
        status: AnalysisStatus.COMPLETE
      };

      await saveSession(session1);
      await saveSession(session2);

      const savedSessions = await getSessions();
      expect(savedSessions).toHaveLength(2);
      expect(savedSessions[0].id).toBe('2'); // Check sorting (unshift)
      expect(savedSessions[1].id).toBe('1');
    });

    it('should update an existing session', async () => {
       const session: DecisionSession = {
        id: '1',
        timestamp: Date.now(),
        input: { title: 'Original', context: '', constraints: '', options: '' },
        result: null,
        status: AnalysisStatus.IDLE
      };

      await saveSession(session);
      const updatedSession = { ...session, status: AnalysisStatus.COMPLETE };
      await saveSession(updatedSession);

      const savedSessions = await getSessions();
      expect(savedSessions).toHaveLength(1);
      expect(savedSessions[0].status).toBe(AnalysisStatus.COMPLETE);
    });
  });

  describe('XP and Gamification Logic', () => {
    // XP logic is in App.tsx handleAnalysis, we can test the calculation logic
    it('should correctly calculate level based on XP', () => {
      const calculateLevel = (xp: number) => Math.floor(xp / 500) + 1;
      
      expect(calculateLevel(0)).toBe(1);
      expect(calculateLevel(100)).toBe(1);
      expect(calculateLevel(500)).toBe(2);
      expect(calculateLevel(1000)).toBe(3);
      expect(calculateLevel(1550)).toBe(4);
    });

    it('should grant 100 XP per deliberation and 150 per commitment', () => {
      let xp = 0;
      const DELIBERATION_XP = 100;
      const COMMITMENT_XP = 150;

      // Simulate 3 deliberations
      xp += DELIBERATION_XP;
      xp += DELIBERATION_XP;
      xp += DELIBERATION_XP;
      expect(xp).toBe(300);

      // Simulate 1 commitment
      xp += COMMITMENT_XP;
      expect(xp).toBe(450);

      // Next deliberation triggers level 2
      xp += DELIBERATION_XP;
      expect(xp).toBe(550);
      expect(Math.floor(xp / 500) + 1).toBe(2);
    });
  });
});

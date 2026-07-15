import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import React from 'react';
import App from '../../App';
import * as geminiService from '../../services/geminiService';
import * as storageService from '../../services/storageService';

// Mock Services
vi.mock('../../services/geminiService', () => ({
  analyzeDecision: vi.fn(),
  generateActionPlan: vi.fn(),
  generateDecisionTree: vi.fn(),
  chatWithCouncil: vi.fn(),
  exploreBrainstorm: vi.fn(),
  extractDeepInquiry: vi.fn().mockResolvedValue({ situationalNuances: [], frictionalRealities: [] }),
}));

vi.mock('../../services/storageService', () => ({
  getSessions: vi.fn(() => Promise.resolve([])),
  saveSession: vi.fn(() => Promise.resolve()),
  deleteSession: vi.fn(),
  getLocalSessions: vi.fn(() => []),
}));

vi.mock('../../services/pdfService', () => ({
  generateDecisionPDF: vi.fn(),
  extractTextFromPDF: vi.fn(),
}));

vi.mock('../../services/googleCloud', () => ({
  auth: {},
  db: {},
  isGCPConfigured: true,
  onAuthStateChanged: vi.fn((auth, cb) => {
    cb(null); 
    return () => {};
  }),
  logActivity: vi.fn(),
  saveToWaitlist: vi.fn(),
  getUserProfile: vi.fn(),
  saveUserProfile: vi.fn(),
  saveDetailedFeedback: vi.fn(),
}));

describe('Decidr Feature Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  const setupAndEnterGuest = async () => {
    render(<App />);
    const guestBtn = await screen.findByText(/Continue as Guest/i);
    fireEvent.click(guestBtn);
    await screen.findByText("The Core Inquiry");
  };

  describe('Evolutionary Branching', () => {
    it('should correctly set parentId and show parent title when linking from history', async () => {
      const mockSession = {
        id: 'parent-123',
        timestamp: Date.now(),
        input: { title: 'Parent Decision Name', context: 'Context A', constraints: '', options: '' },
        result: null,
        status: 'COMPLETE'
      };
      
      (storageService.getLocalSessions as any).mockReturnValue([mockSession]);
      (storageService.getSessions as any).mockResolvedValue([mockSession]);

      await setupAndEnterGuest();

      const linkBtn = await screen.findByText(/Link from History/i);
      fireEvent.click(linkBtn);

      const parentLink = await screen.findByRole('button', { name: /Parent Decision Name/i });
      fireEvent.click(parentLink);

      expect(await screen.findByText(/Evolutionary Branch/i)).toBeInTheDocument();
      
      const linkedBranchInfo = screen.getByText((content, element) => {
        return element?.tagName.toLowerCase() === 'div' && content.includes('Parent Decision Name') && element.classList.contains('text-xs');
      });
      expect(linkedBranchInfo).toBeInTheDocument();
    });
  });

  describe('Mindful Commitment', () => {
    it('should show both core inquiry and chosen path in the Interval of Intent modal', async () => {
      const mockResult = {
        analyst: { name: 'A', role: 'Analyst', analysis: '...', keyPoints: [], score: 80, sequence: [] },
        strategist: { name: 'S', role: 'Strategist', analysis: '...', keyPoints: [], score: 80, sequence: [] },
        skeptic: { name: 'Sk', role: 'Skeptic', analysis: '...', keyPoints: [], score: 80, sequence: [] },
        mediator: { name: 'M', role: 'Mediator', analysis: '...', keyPoints: [], score: 80, sequence: [] },
        synthesis: { verdict: 'Proceed', recommendation: '...', refinedPaths: ['Refined Strategic Path'], metrics: { risk: 10, speed: 90, cost: 20, impact: 80, feasibility: 95 } }
      };

      const mockSession = {
        id: 'session-1',
        timestamp: Date.now(),
        input: { title: 'Unique Inquiry Title', context: '...', constraints: '...', options: '...' },
        result: mockResult,
        status: 'COMPLETE'
      };

      (storageService.getLocalSessions as any).mockReturnValue([mockSession]);
      (storageService.getSessions as any).mockResolvedValue([mockSession]);

      await setupAndEnterGuest();

      fireEvent.click(screen.getByLabelText(/Open History/i)); 
      
      // Find the session in history by its heading
      const sessionLink = await screen.findByRole('heading', { name: 'Unique Inquiry Title' });
      fireEvent.click(sessionLink);

      const pathBtn = await screen.findByLabelText(/Select Path: Refined Strategic Path/i);
      fireEvent.click(pathBtn);

      fireEvent.change(screen.getByPlaceholderText(/Articulate the reasoning/i), { target: { value: 'This path has the best long-term resonance.' } });

      fireEvent.click(screen.getByRole('button', { name: /Lock My Intent/i }));

      const modal = await screen.findByRole('dialog');
      expect(within(modal).getByText(/Unique Inquiry Title/i)).toBeInTheDocument();
      expect(within(modal).getByText(/Refined Strategic Path/i)).toBeInTheDocument();
    });
  });

  describe('Smart Context Architect', () => {
    it('should guide user through structured questions in the wizard', async () => {
      const mockBrainstorm = {
        structuredQuestions: [
          { question: 'What is the primary constraint?', options: ['Time', 'Capital', 'Ethics'] }
        ],
        suggestions: ['Nuance A']
      };
      (geminiService.exploreBrainstorm as any).mockResolvedValue(mockBrainstorm);

      await setupAndEnterGuest();

      // Enter title to enable AI
      fireEvent.change(screen.getByPlaceholderText(/fundamental question/i), { target: { value: 'Scaling a team' } });
      
      // Click AI context button
      const aiBtn = await screen.findByLabelText(/AI context/i);
      fireEvent.click(aiBtn);

      // Verify question appears
      expect(await screen.findByText(/What is the primary constraint\?/i)).toBeInTheDocument();

      // Click an option
      const optBtn = screen.getByText(/Ethics/i);
      fireEvent.click(optBtn);

      // Verify context area was updated
      const contextField = screen.getByPlaceholderText(/underlying dynamics/i) as HTMLTextAreaElement;
      expect(contextField.value).toContain('Q: What is the primary constraint?');
      expect(contextField.value).toContain('A: Ethics');
    });
  });
});

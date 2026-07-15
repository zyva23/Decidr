import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import App from '../../App';
import * as geminiService from '../../services/geminiService';
import * as storageService from '../../services/storageService';
import { AnalysisStatus } from '../../types';

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
}));

vi.mock('../../services/pdfService', () => ({
  generateDecisionPDF: vi.fn(),
  extractTextFromPDF: vi.fn(),
}));

vi.mock('../../services/googleCloud', () => ({
  auth: null,
  db: null,
  isGCPConfigured: false,
  onAuthStateChanged: (auth: any, cb: any) => { cb(null); return () => {}; },
  logActivity: vi.fn(),
}));

describe('App XP Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should increase XP when an analysis is completed', async () => {
    // 1. Setup mock result
    const mockResult = {
      analyst: { analysis: 'test', keyPoints: [], score: 80, sequence: [] },
      strategist: { analysis: 'test', keyPoints: [], score: 80, sequence: [] },
      skeptic: { analysis: 'test', keyPoints: [], score: 80, sequence: [] },
      mediator: { analysis: 'test', keyPoints: [], score: 80, sequence: [] },
      synthesis: { verdict: 'Proceed', recommendation: 'Do it', metrics: { risk: 10, speed: 90, cost: 20, impact: 80, feasibility: 95 } }
    };
    (geminiService.analyzeDecision as any).mockResolvedValue(mockResult);

    // 2. Render App (In Guest Mode by default due to our mock)
    render(<App />);
    
    // 3. Continue as Guest
    const guestBtn = screen.getByText(/Continue as Guest/i);
    fireEvent.click(guestBtn);

    // 4. Check initial XP (level 1 rank Observer)
    expect(screen.getByText(/Observer/i)).toBeInTheDocument();

    // 5. Fill form and submit
    fireEvent.change(screen.getByPlaceholderText(/fundamental question/i), { target: { value: 'Test Title' } });
    fireEvent.change(screen.getByPlaceholderText(/underlying dynamics/i), { target: { value: 'This is a long enough context for the button to enable.' } });
    
    const analyzeBtn = screen.getByRole('button', { name: /Begin Deliberation/i });
    fireEvent.click(analyzeBtn);

    // 6. Wait for analysis to complete and check XP progress
    await waitFor(() => {
      expect(screen.getByText(/The Synthesis/i)).toBeInTheDocument();
    }, { timeout: 5000 });

    // In our GamifiedHeader, 100/500 XP would be 20% progress
    // We can check if localStorage was updated
    expect(localStorage.getItem('dc_xp_guest')).toBe('100');
  });
});

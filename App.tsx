import React, { useState, useEffect } from 'react';
import InputForm from './components/InputForm';
import AgentCard from './components/AgentCard';
import RadarViz from './components/RadarViz';
import ResizableSplitPane from './components/ResizableSplitPane';
import SessionHistory from './components/SessionHistory';
import FrameworkLibrary from './components/FrameworkLibrary';
import CouncilChat from './components/CouncilChat';
import VerdictElaboration from './components/VerdictElaboration';
import ActionPlanModal from './components/ActionPlanModal';
import GamifiedHeader from './components/GamifiedHeader';
import CommitmentPanel from './components/CommitmentPanel';
import Auth from './components/Auth';
import { UI_CONTENT } from './src/constants/uiContent';
import { analyzeDecision, generateActionPlan } from './services/geminiService';
import { saveSession, getSessions, deleteSession } from './services/storageService';
import { auth, logActivity, onAuthStateChanged, signOut, isGCPConfigured, saveDetailedFeedback } from './services/googleCloud';
import { generateDecisionPDF } from './services/pdfService';
import { DecisionInput, CouncilResult, AnalysisStatus, DecisionSession, ChatMessage, UserProfile, ActionPlan } from './types';

/**
 * MAIN APPLICATION COMPONENT
 * Coordinates Authentication, Storage, AI Analysis, and Visual Results.
 */

const MAX_FREE_CREDITS = 5;

const App: React.FC = () => {
  // --- AUTH STATE ---
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);

  // --- DATA STATE ---
  const [sessions, setSessions] = useState<DecisionSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<DecisionInput>({ title: '', context: '', constraints: '', options: '' });
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<CouncilResult | null>(null);
  const [partialResult, setPartialResult] = useState<PartialCouncilResult | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [credits, setCredits] = useState(0);
  
  // --- GAMIFICATION STATE ---
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // --- UI STATE ---
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isElaborationOpen, setIsElaborationOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<ActionPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // --- FEEDBACK STATE ---
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  /**
   * Listen for Firebase Auth changes on mount.
   */
  useEffect(() => {
    if (!isGCPConfigured || !auth) {
      setIsAuthChecking(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({ 
           id: firebaseUser.uid, 
           email: firebaseUser.email || "User",
           xp: parseInt(localStorage.getItem(`dc_xp_${firebaseUser.uid}`) || '0', 10),
           level: parseInt(localStorage.getItem(`dc_level_${firebaseUser.uid}`) || '1', 10)
        });
        logActivity(firebaseUser.uid, 'login');
      } else {
        setUser(null);
      }
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  /**
   * Load history and local quota info on mount.
   */
  useEffect(() => {
    const loadInitialData = async () => {
      const initialSessions = await getSessions(user?.id);
      setSessions(initialSessions);
    };
    loadInitialData();
    
    const used = localStorage.getItem('dc_credits_used');
    setCredits(used ? parseInt(used, 10) : 0);

    // Load Gamification Data
    const storedXp = localStorage.getItem(user ? `dc_xp_${user.id}` : 'dc_xp_guest');
    const storedLevel = localStorage.getItem(user ? `dc_level_${user.id}` : 'dc_level_guest');
    setXp(storedXp ? parseInt(storedXp, 10) : 0);
    setLevel(storedLevel ? parseInt(storedLevel, 10) : 1);
  }, [user]);

  /**
   * Handles user sentiment feedback on the verdict.
   */
  const handleFeedback = async (type: 'helpful' | 'not-helpful') => {
    if (!result) return;
    const newResult = { ...result, feedback: type };
    setResult(newResult);
    setShowFeedbackForm(true);
    setFeedbackSubmitted(false);
    
    if (user) logActivity(user.id, 'feedback_click', { verdict: result.synthesis.verdict, type });
    if (currentSessionId) {
      const session = sessions.find(s => s.id === currentSessionId);
      if (session) {
        await saveSession({ ...session, result: newResult });
      }
    }
  };

  const submitDetailedFeedback = async () => {
     if (!currentSessionId || !result?.feedback) return;
     await saveDetailedFeedback(user?.id, currentSessionId, result.feedback, feedbackComment);
     setFeedbackSubmitted(true);
     setTimeout(() => setShowFeedbackForm(false), 2000);
     setFeedbackComment('');
  };

  const handleCommitment = async (selected: string, why: string) => {
    if (!currentSessionId) return;
    
    const session = sessions.find(s => s.id === currentSessionId);
    if (!session) return;

    const commitment = { selectedOption: selected, justification: why, timestamp: Date.now() };
    const updatedSession = { ...session, commitment };
    
    // XP Reward for commitment
    const newXp = xp + 150;
    const newLevel = Math.floor(newXp / 500) + 1;
    setXp(newXp);
    if (newLevel > level) {
       setLevel(newLevel);
       setShowLevelUp(true);
       setTimeout(() => setShowLevelUp(false), 5000);
    }
    
    localStorage.setItem(user ? `dc_xp_${user.id}` : 'dc_xp_guest', newXp.toString());
    localStorage.setItem(user ? `dc_level_${user.id}` : 'dc_level_guest', newLevel.toString());
    
    await saveSession(updatedSession);
    setSessions(await getSessions(user?.id));
    if (user) logActivity(user.id, 'commitment_made', { selected, title: session.input.title });
  };

  const handleBranch = (newContext: string) => {
    startNewSession();
    setInputValues(prev => ({ 
      title: `Step 2: Following ${prev.title}`, 
      context: `${newContext} `,
      constraints: prev.constraints,
      options: '' 
    }));
  };

  const handleDevelopPlan = async () => {
    if (!result || !inputValues) return;
    
    // If we already have a plan for this session, just open it
    const existingSession = sessions.find(s => s.id === currentSessionId);
    if (existingSession?.actionPlan) {
      setCurrentPlan(existingSession.actionPlan);
      setIsPlanModalOpen(true);
      return;
    }

    setIsGeneratingPlan(true);
    try {
      const plan = await generateActionPlan(inputValues, result);
      setCurrentPlan(plan);
      setIsPlanModalOpen(true);
      
      // Save the plan to the session
      if (currentSessionId) {
        const session = sessions.find(s => s.id === currentSessionId);
        if (session) {
          const updatedSession = { ...session, actionPlan: plan };
          await saveSession(updatedSession);
          setSessions(await getSessions(user?.id));
        }
      }
    } catch (e) {
      console.error("Failed to generate plan", e);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleSavePlan = async (updatedPlan: ActionPlan) => {
    if (!currentSessionId) return;
    
    const session = sessions.find(s => s.id === currentSessionId);
    if (session) {
      const updatedSession = { ...session, actionPlan: updatedPlan };
      await saveSession(updatedSession);
      setCurrentPlan(updatedPlan);
      setSessions(await getSessions(user?.id));
    }
  };

  /**
   * Resets form to a blank state for a fresh analysis.
   */
  const startNewSession = () => {
    setCurrentSessionId(null);
    setInputValues({ title: '', context: '', constraints: '', options: '' });
    setResult(null);
    setChatHistory([]);
    setStatus(AnalysisStatus.IDLE);
    setIsChatOpen(false);
    setIsElaborationOpen(false);
    setCurrentPlan(null);
  };

  /**
   * Restores an existing session from the history sidebar.
   */
  const loadSession = (session: DecisionSession) => {
    setCurrentSessionId(session.id);
    setInputValues(session.input);
    setResult(session.result);
    setChatHistory(session.chatHistory || []);
    setStatus(session.status);
    setIsChatOpen(false);
    setIsElaborationOpen(false);
    setCurrentPlan(session.actionPlan || null);
  };

  /**
   * PRIMARY ACTION: Trigger AI Deliberation
   * Checks credits, triggers geminiService, and persists results.
   */
  const handleAnalysis = async (input: DecisionInput) => {
    if (credits >= MAX_FREE_CREDITS) {
      setShowWaitlist(true);
      return;
    }
    setStatus(AnalysisStatus.ANALYZING);
    setInputValues(input); 
    setResult(null);
    setPartialResult(null);
    if (user) logActivity(user.id, 'analysis_started', { title: input.title });

    try {
      const data = await analyzeDecision(input, (partial) => {
        setPartialResult(prev => ({ ...prev, ...partial }));
      });
      setResult(data);
      setPartialResult(null); // Clear partials once full result is in
      setStatus(AnalysisStatus.COMPLETE);
      
      const newCredits = credits + 1;
      setCredits(newCredits);
      localStorage.setItem('dc_credits_used', newCredits.toString());

      // Gamification Reward: 100 XP per deliberation
      const newXp = xp + 100;
      const newLevel = Math.floor(newXp / 500) + 1;
      setXp(newXp);
      if (newLevel > level) {
         setLevel(newLevel);
         setShowLevelUp(true);
         setTimeout(() => setShowLevelUp(false), 5000);
      }
      
      localStorage.setItem(user ? `dc_xp_${user.id}` : 'dc_xp_guest', newXp.toString());
      localStorage.setItem(user ? `dc_level_${user.id}` : 'dc_level_guest', newLevel.toString());

      const newSession: DecisionSession = {
        id: currentSessionId || crypto.randomUUID(),
        user_id: user?.id,
        timestamp: Date.now(),
        input: input,
        result: data,
        status: AnalysisStatus.COMPLETE,
        chatHistory: []
      };
      await saveSession(newSession);
      setCurrentSessionId(newSession.id);
      const updatedSessions = await getSessions(user?.id);
      setSessions(updatedSessions);
      setChatHistory([]);
    } catch (error: any) {
      setStatus(AnalysisStatus.ERROR);
      if (user) logActivity(user.id, 'error', { message: error.message });
    }
  };

  const handleExportPDF = async () => {
    if (!result || !inputValues) return;
    setIsExporting(true);
    try {
        await generateDecisionPDF(inputValues, result);
    } catch (e) {
        console.error("PDF Export failed", e);
    } finally {
        setIsExporting(false);
    }
  };

  const handleSignOut = async () => {
    if (user) logActivity(user.id, 'logout');
    if (auth) await signOut(auth);
    setIsGuestMode(false);
    setUser(null);
  };

  // --- RENDERING LOGIC ---

  if (isAuthChecking) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-950">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user && !isGuestMode) {
    return <Auth onContinueAsGuest={() => setIsGuestMode(true)} />;
  }

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-200 font-sans overflow-hidden">
      <SessionHistory 
        isOpen={isHistoryOpen}
        sessions={sessions}
        currentSessionId={currentSessionId}
        user={user}
        onSelectSession={loadSession}
        onNewSession={startNewSession}
        onClose={() => setIsHistoryOpen(false)}
        onDeleteSession={async (id) => { 
          await deleteSession(id); 
          const updated = await getSessions(user?.id);
          setSessions(updated); 
        }}
        onSignOut={handleSignOut}
      />
      
      {/* Documentation modal for the lenses */}
      <FrameworkLibrary isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} />

      {/* Credit limit / Paywall simulation */}
      {showWaitlist && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl max-w-md text-center shadow-2xl animate-fade-in">
            <h3 className="text-2xl font-bold text-white mb-4">Quota Exceeded</h3>
            <p className="text-slate-400 mb-6 text-sm">Join the waitlist for Decision Council Pro for unlimited high-fidelity analysis.</p>
            <input type="email" placeholder="your@email.com" className="w-full p-4 bg-slate-950 border border-slate-700 rounded-xl mb-4 text-white outline-none" />
            <button onClick={() => setShowWaitlist(false)} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl">Notify Me</button>
            <button onClick={() => setShowWaitlist(false)} className="mt-4 text-xs text-slate-500 uppercase font-bold tracking-widest">Dismiss</button>
          </div>
        </div>
      )}
      
      {/* Level Up Celebration Toast */}
      {showLevelUp && (
         <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[400] animate-bounce">
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 p-1 rounded-2xl shadow-2xl shadow-indigo-500/50">
               <div className="bg-slate-900 px-8 py-4 rounded-[14px] flex flex-col items-center">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-1">New Strategic Rank</div>
                  <div className="text-2xl font-black text-white">LEVEL {level} UNLOCKED</div>
               </div>
            </div>
         </div>
      )}

      {/* Main Header */}
      <header className="flex-shrink-0 h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 z-30">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsHistoryOpen(true)} className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <h1 className="text-lg font-bold text-white tracking-tight">{UI_CONTENT.APP_NAME}</h1>
        </div>
        
        <div className="flex items-center gap-6">
          <GamifiedHeader xp={xp} level={level} />
        </div>
      </header>

      {/* Multi-Pane Layout */}
      <main className="flex-1 overflow-hidden relative p-4 lg:p-6">
        <ResizableSplitPane 
          isResultReady={status === AnalysisStatus.COMPLETE}
          left={<InputForm initialValues={inputValues} onSubmit={handleAnalysis} isLoading={status === AnalysisStatus.ANALYZING} />}
          right={
            <div className="h-full">
              {(status === AnalysisStatus.COMPLETE || status === AnalysisStatus.ANALYZING) && (result || partialResult) && (
                <div className="space-y-6 animate-fade-in pb-12">
                  {status === AnalysisStatus.COMPLETE && result && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Final Verdict Synthesis */}
                      <div className="md:col-span-2 bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border border-indigo-500/30 rounded-xl p-8 flex flex-col shadow-2xl">
                        <h2 className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-4">{UI_CONTENT.RESULTS.FINAL_VERDICT}</h2>
                        <h3 className="text-3xl font-black text-white mb-4 leading-tight">{result.synthesis.verdict}</h3>
                        <p className="text-slate-300 leading-relaxed text-lg mb-8">{result.synthesis.recommendation}</p>
                        <div className="flex flex-wrap gap-3 mt-auto">
                          <button 
                            onClick={() => setIsChatOpen(true)} 
                            title={UI_CONTENT.RESULTS.CONSULT_COUNCIL}
                            className="p-3 bg-white text-slate-950 rounded-xl active:scale-95 transition-all hover:bg-slate-100 flex items-center justify-center group"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
                            <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 font-bold whitespace-nowrap">{UI_CONTENT.RESULTS.CONSULT_COUNCIL}</span>
                          </button>

                          <button 
                            onClick={() => setIsElaborationOpen(!isElaborationOpen)} 
                            title={isElaborationOpen ? `Hide ${UI_CONTENT.RESULTS.ELABORATION}` : `View ${UI_CONTENT.RESULTS.ELABORATION}`}
                            className={`p-3 border rounded-xl active:scale-95 transition-all flex items-center justify-center group ${isElaborationOpen ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10'}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                            <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 font-bold whitespace-nowrap">{isElaborationOpen ? UI_CONTENT.RESULTS.HIDE : UI_CONTENT.RESULTS.ELABORATION}</span>
                          </button>

                          <button 
                            onClick={handleDevelopPlan} 
                            disabled={isGeneratingPlan}
                            title={`Develop ${UI_CONTENT.RESULTS.PLANNING} Plan`}
                            className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl active:scale-95 flex items-center justify-center transition-all disabled:opacity-50 group"
                          >
                            {isGeneratingPlan ? (
                              <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="m9 16 2 2 4-4"/></svg>
                            )}
                            <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 font-bold whitespace-nowrap">{UI_CONTENT.RESULTS.PLANNING}</span>
                          </button>

                          <button 
                            onClick={handleExportPDF} 
                            disabled={isExporting}
                            title={UI_CONTENT.RESULTS.EXPORT}
                            className="p-3 border border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10 rounded-xl active:scale-95 flex items-center justify-center transition-all disabled:opacity-50 group"
                          >
                            {isExporting ? (
                              <svg className="animate-spin h-5 w-5 text-indigo-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                            )}
                            <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 font-bold whitespace-nowrap">{UI_CONTENT.RESULTS.EXPORT}</span>
                          </button>
                          <div className="ml-auto flex items-center gap-2">
                             <button onClick={() => handleFeedback('helpful')} className={`p-3 rounded-xl border ${result.feedback === 'helpful' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12"></path><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"></path></svg>
                             </button>
                             <button onClick={() => handleFeedback('not-helpful')} className={`p-3 rounded-xl border ${result.feedback === 'not-helpful' ? 'bg-red-500 border-red-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V2"></path><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79-1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"></path></svg>
                             </button>
                          </div>
                        </div>

                        {showFeedbackForm && (
                          <div className="mt-6 p-6 bg-slate-900/50 border border-slate-800 rounded-xl animate-fade-in">
                            {feedbackSubmitted ? (
                              <div className="text-emerald-400 font-bold flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                {UI_CONTENT.FEEDBACK.SUCCESS}
                              </div>
                            ) : (
                              <>
                                <h4 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-widest">{UI_CONTENT.FEEDBACK.TITLE}</h4>
                                <textarea 
                                  value={feedbackComment}
                                  onChange={(e) => setFeedbackComment(e.target.value)}
                                  placeholder={UI_CONTENT.FEEDBACK.PLACEHOLDER}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white placeholder-slate-600 focus:ring-1 focus:ring-indigo-500 outline-none transition-all h-24 resize-none mb-3 text-sm"
                                />
                                <div className="flex justify-end gap-3">
                                   <button onClick={() => setShowFeedbackForm(false)} className="text-xs font-bold text-slate-500 uppercase px-4 py-2">{UI_CONTENT.FEEDBACK.BUTTON_CANCEL}</button>
                                   <button 
                                    onClick={submitDetailedFeedback}
                                    disabled={!feedbackComment.trim()}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg uppercase tracking-widest transition-all"
                                   >
                                     {UI_CONTENT.FEEDBACK.BUTTON_SUBMIT}
                                   </button>
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      {/* Visual Data Radar */}
                      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 flex items-center justify-center">
                        <RadarViz metrics={result.synthesis.metrics} />
                      </div>
                    </div>
                  )}

                  {status === AnalysisStatus.COMPLETE && result && isElaborationOpen && <VerdictElaboration result={result} />}

                  {/* Detailed Agent Cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <AgentCard agent={(result?.analyst || partialResult?.analyst)!} color="blue" isLoading={!result?.analyst && !partialResult?.analyst} />
                    <AgentCard agent={(result?.strategist || partialResult?.strategist)!} color="purple" isLoading={!result?.strategist && !partialResult?.strategist} />
                    <AgentCard agent={(result?.skeptic || partialResult?.skeptic)!} color="red" isLoading={!result?.skeptic && !partialResult?.skeptic} />
                    <AgentCard agent={(result?.mediator || partialResult?.mediator)!} color="emerald" isLoading={!result?.mediator && !partialResult?.mediator} />
                  </div>

                  {/* The Commitment Protocol */}
                  {status === AnalysisStatus.COMPLETE && result && (
                    <div className="pt-8 pb-20 border-t border-slate-800/50 mt-12">
                      <CommitmentPanel 
                          options={inputValues.options}
                          onCommit={handleCommitment}
                          onBranch={handleBranch}
                          existingCommitment={sessions.find(s => s.id === currentSessionId)?.commitment}
                      />
                    </div>
                  )}
                </div>
              )}
              {status === AnalysisStatus.IDLE && (
                <div className="h-full flex flex-col items-center justify-center p-8 lg:p-20 text-center animate-fade-in">
                  <div className="relative mb-12">
                     <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full"></div>
                     <div className="relative bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl flex items-center justify-center gap-6">
                        <div className="flex -space-x-4">
                           <div className="w-16 h-16 rounded-full border-4 border-slate-900 bg-blue-900/20 flex items-center justify-center text-blue-400 shadow-lg z-40">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
                           </div>
                           <div className="w-16 h-16 rounded-full border-4 border-slate-900 bg-purple-900/20 flex items-center justify-center text-purple-400 shadow-lg z-30">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                           </div>
                           <div className="w-16 h-16 rounded-full border-4 border-slate-900 bg-red-900/20 flex items-center justify-center text-red-400 shadow-lg z-20">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                           </div>
                           <div className="w-16 h-16 rounded-full border-4 border-slate-900 bg-emerald-900/20 flex items-center justify-center text-emerald-400 shadow-lg z-10">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                           </div>
                        </div>
                     </div>
                  </div>
                  
                  <h2 className="text-4xl font-black text-white mb-6 tracking-tight">{UI_CONTENT.IDLE.TITLE}</h2>
                  <p className="text-lg text-slate-400 max-w-lg mx-auto leading-relaxed mb-12">
                    {UI_CONTENT.IDLE.DESCRIPTION}
                  </p>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl">
                     {UI_CONTENT.IDLE.AGENTS.map(agent => (
                       <div key={agent.name} className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50 text-left">
                          <div className={`text-xs font-black uppercase tracking-widest mb-1 ${agent.color}`}>{agent.name}</div>
                          <div className="text-[10px] text-slate-500 font-medium">{agent.desc}</div>
                       </div>
                     ))}
                  </div>
                </div>
              )}
            </div>
          }
        />
      </main>
      
      {/* Interactive Council Chat Modal */}
      {isChatOpen && result && <CouncilChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} councilResult={result} input={inputValues} chatHistory={chatHistory} onUpdateHistory={setChatHistory} onReAnalyze={(newCtx) => handleAnalysis({...inputValues, context: inputValues.context + newCtx})} />}
      
      {/* Action Plan Modal */}
      {currentPlan && (
        <ActionPlanModal 
          isOpen={isPlanModalOpen} 
          onClose={() => setIsPlanModalOpen(false)} 
          onSave={handleSavePlan}
          plan={currentPlan} 
        />
      )}
    </div>
  );
};

export default App;

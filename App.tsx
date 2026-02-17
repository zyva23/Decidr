
import React, { useState, useEffect } from 'react';
import InputForm from './components/InputForm';
import AgentCard from './components/AgentCard';
import RadarViz from './components/RadarViz';
import ResizableSplitPane from './components/ResizableSplitPane';
import SessionHistory from './components/SessionHistory';
import FrameworkLibrary from './components/FrameworkLibrary';
import CouncilChat from './components/CouncilChat';
import Auth from './components/Auth';
import { analyzeDecision } from './services/geminiService';
import { saveSession, getSessions, deleteSession } from './services/storageService';
import { auth, logActivity, onAuthStateChanged, signOut, isGCPConfigured } from './services/googleCloud';
import { DecisionInput, CouncilResult, AnalysisStatus, DecisionSession, ChatMessage, UserProfile } from './types';

const MAX_FREE_CREDITS = 5;

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);

  const [sessions, setSessions] = useState<DecisionSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<DecisionInput>({ title: '', context: '', constraints: '', options: '' });
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<CouncilResult | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [credits, setCredits] = useState(0);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);

  useEffect(() => {
    if (!isGCPConfigured || !auth) {
      setIsAuthChecking(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({ id: firebaseUser.uid, email: firebaseUser.email || "User" });
        logActivity(firebaseUser.uid, 'login');
      } else {
        setUser(null);
      }
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setSessions(getSessions());
    const used = localStorage.getItem('dc_credits_used');
    setCredits(used ? parseInt(used, 10) : 0);
  }, []);

  const handleFeedback = (type: 'helpful' | 'not-helpful') => {
    if (!result) return;
    const newResult = { ...result, feedback: type };
    setResult(newResult);
    if (user) logActivity(user.id, 'feedback', { verdict: result.synthesis.verdict, type });
    if (currentSessionId) {
      const session = sessions.find(s => s.id === currentSessionId);
      if (session) saveSession({ ...session, result: newResult });
    }
  };

  const startNewSession = () => {
    setCurrentSessionId(null);
    setInputValues({ title: '', context: '', constraints: '', options: '' });
    setResult(null);
    setChatHistory([]);
    setStatus(AnalysisStatus.IDLE);
    setIsChatOpen(false);
  };

  const loadSession = (session: DecisionSession) => {
    setCurrentSessionId(session.id);
    setInputValues(session.input);
    setResult(session.result);
    setChatHistory(session.chatHistory || []);
    setStatus(session.status);
    setIsChatOpen(false);
  };

  const handleAnalysis = async (input: DecisionInput) => {
    if (credits >= MAX_FREE_CREDITS) {
      setShowWaitlist(true);
      return;
    }
    setStatus(AnalysisStatus.ANALYZING);
    setInputValues(input); 
    if (user) logActivity(user.id, 'analysis_started', { title: input.title });

    try {
      const data = await analyzeDecision(input);
      setResult(data);
      setStatus(AnalysisStatus.COMPLETE);
      
      const newCredits = credits + 1;
      setCredits(newCredits);
      localStorage.setItem('dc_credits_used', newCredits.toString());

      const newSession: DecisionSession = {
        id: currentSessionId || crypto.randomUUID(),
        user_id: user?.id,
        timestamp: Date.now(),
        input: input,
        result: data,
        status: AnalysisStatus.COMPLETE,
        chatHistory: []
      };
      saveSession(newSession);
      setCurrentSessionId(newSession.id);
      setSessions(getSessions());
      setChatHistory([]);
    } catch (error: any) {
      setStatus(AnalysisStatus.ERROR);
      if (user) logActivity(user.id, 'error', { message: error.message });
    }
  };

  const handleSignOut = async () => {
    if (user) logActivity(user.id, 'logout');
    if (auth) await signOut(auth);
    setIsGuestMode(false);
    setUser(null);
  };

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
        onSelectSession={loadSession}
        onNewSession={startNewSession}
        onClose={() => setIsHistoryOpen(false)}
        onDeleteSession={(id) => { deleteSession(id); setSessions(getSessions()); }}
      />
      <FrameworkLibrary isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} />

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

      <header className="flex-shrink-0 h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 z-30">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsHistoryOpen(true)} className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          <h1 className="text-lg font-bold text-white tracking-tight">Decision Council AI</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs ${isGuestMode ? 'bg-amber-950/20 border-amber-900/40 text-amber-500/70' : 'bg-slate-900/80 border-slate-700 text-slate-400'}`}>
             <span className={`w-2 h-2 rounded-full ${isGuestMode ? 'bg-amber-500' : 'bg-indigo-500 animate-pulse'}`}></span>
             {user?.email || "Guest Session"}
          </div>
          <button onClick={handleSignOut} className="p-2 text-slate-500 hover:text-red-400" title="Sign Out">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative p-4 lg:p-6">
        <ResizableSplitPane 
          left={<InputForm initialValues={inputValues} onSubmit={handleAnalysis} isLoading={status === AnalysisStatus.ANALYZING} />}
          right={
            <div className="h-full">
              {status === AnalysisStatus.COMPLETE && result && (
                <div className="space-y-6 animate-fade-in pb-12">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border border-indigo-500/30 rounded-xl p-8 flex flex-col shadow-2xl">
                      <h2 className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-4">Final Verdict</h2>
                      <h3 className="text-3xl font-black text-white mb-4 leading-tight">{result.synthesis.verdict}</h3>
                      <p className="text-slate-300 leading-relaxed text-lg mb-8">{result.synthesis.recommendation}</p>
                      <div className="flex flex-wrap gap-4 mt-auto">
                        <button onClick={() => setIsChatOpen(true)} className="px-6 py-3 bg-white text-slate-950 font-bold rounded-xl active:scale-95">Consult Council</button>
                        <div className="ml-auto flex items-center gap-2">
                           <button onClick={() => handleFeedback('helpful')} className={`p-3 rounded-xl border ${result.feedback === 'helpful' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12"></path><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"></path></svg>
                           </button>
                           <button onClick={() => handleFeedback('not-helpful')} className={`p-3 rounded-xl border ${result.feedback === 'not-helpful' ? 'bg-red-500 border-red-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V2"></path><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79-1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"></path></svg>
                           </button>
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 flex items-center justify-center">
                      <RadarViz metrics={result.synthesis.metrics} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <AgentCard agent={result.analyst} color="blue" />
                    <AgentCard agent={result.strategist} color="purple" />
                    <AgentCard agent={result.skeptic} color="red" />
                    <AgentCard agent={result.mediator} color="emerald" />
                  </div>
                </div>
              )}
              {status === AnalysisStatus.IDLE && (
                <div className="h-full flex flex-col items-center justify-center p-20 text-center text-slate-500">
                  <svg className="w-16 h-16 mb-4 opacity-20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 11H5m14 0a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2m14 0V9a2 2 0 0 0-2-2M5 11V9a2 2 0 0 1 2-2m0 0V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2M7 7h10" /></svg>
                  <p className="text-xl font-medium">Ready for Deliberation</p>
                  <p className="mt-2 text-sm max-w-xs">Enter your decision brief to convene the strategic council.</p>
                </div>
              )}
            </div>
          }
        />
      </main>
      
      {isChatOpen && result && <CouncilChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} councilResult={result} input={inputValues} chatHistory={chatHistory} onUpdateHistory={setChatHistory} onReAnalyze={(newCtx) => handleAnalysis({...inputValues, context: inputValues.context + newCtx})} />}
    </div>
  );
};

export default App;

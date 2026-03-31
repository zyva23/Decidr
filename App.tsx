import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
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
import DecisionTreeViz from './components/DecisionTreeViz';
import ShareModal from './components/ShareModal';
import CollaborationModal from './components/CollaborationModal';
import Auth from './components/Auth';
import { UI_CONTENT } from './src/constants/uiContent';
import { analyzeDecision, generateActionPlan, generateDecisionTree, synthesizeOnly } from './services/geminiService';
import { saveSession, getSessions, deleteSession, getLocalSessions } from './services/storageService';
import { auth, logActivity, onAuthStateChanged, signOut, isGCPConfigured, saveDetailedFeedback, saveToWaitlist, getUserProfile, saveUserProfile, getPublicSession, addSessionContribution, updateContributionStatuses } from './services/googleCloud';
import { generateDecisionPDF } from './services/pdfService';
import { DecisionInput, CouncilResult, AnalysisStatus, DecisionSession, ChatMessage, UserProfile, ActionPlan, PartialCouncilResult, DecisionTree, Contribution } from './types';

/**
 * ERROR BOUNDARY
 */
class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  componentDidCatch(error: Error, errorInfo: ErrorInfo) { console.error("CRITICAL UI CRASH:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">System Malfunction</h1>
          <p className="text-slate-400 max-w-md mb-8">The Council interface has encountered a fatal rendering error. This usually indicates a data mismatch during deliberation.</p>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl mb-8 text-left w-full max-w-xl overflow-hidden">
             <p className="text-[10px] font-black text-red-400 uppercase mb-2">Diagnostic Log</p>
             <code className="text-xs text-slate-300 break-all">{this.state.error?.message}</code>
          </div>
          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all">Re-initialize Council</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const MAX_FREE_CREDITS = 5;

const DecidrApp: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [sessions, setSessions] = useState<DecisionSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputValues, setInputValues] = useState<DecisionInput>({ title: '', context: '', constraints: '', options: '' });
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<CouncilResult | null>(null);
  const [partialResult, setPartialResult] = useState<PartialCouncilResult | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [credits, setCredits] = useState(0);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isElaborationOpen, setIsElaborationOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isTreeOpen, setIsTreeOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<ActionPlan | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [hasDownloadedPDF, setHasDownloadedPDF] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState<{
    type: 'cancel_analysis' | 'download_first';
    pendingAction: () => void;
  } | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [hasJoinedWaitlist, setHasJoinedWaitlist] = useState(false);

  // Collaboration State
  const [isSharedLoading, setIsSharedLoading] = useState(false);
  const [isPublicSession, setIsPublicSession] = useState(false);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isContributing, setIsContributing] = useState(false);
  const [contributionName, setContributionName] = useState('');
  const [contributionContent, setContributionContent] = useState('');
  const [contributionType, setContributionType] = useState<Contribution['type']>('variable');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isCollaborationModalOpen, setIsCollaborationModalOpen] = useState(false);
  const [isPeerSynthesizing, setIsPeerSynthesizing] = useState(false);

  // Sync contribution name with user profile if not anonymous
  useEffect(() => {
    if (user && !isAnonymous && !contributionName) {
      setContributionName(user.email.split('@')[0]);
    }
  }, [user, isAnonymous]);

  const handleSubmitContribution = async () => {
    if (!currentSessionId || !contributionContent.trim()) return;
    setIsContributing(true);
    const finalName = isAnonymous ? "Anonymous Expert" : (contributionName.trim() || "Anonymous Expert");
    const contribution: Contribution = {
      id: crypto.randomUUID(),
      name: finalName,
      content: contributionContent.trim(),
      type: contributionType,
      timestamp: Date.now(),
      status: 'pending'
    };
    try {
      await addSessionContribution(currentSessionId, contribution);
      setContributions(prev => [...prev, contribution]);
      setContributionContent('');
      alert("Your perspective has been submitted to the Council.");
    } catch (e) { console.error(e); } finally { setIsContributing(false); }
  };

  const handleIncorporateContributions = () => {
    if (contributions.length === 0) return;
    const peerInsights = contributions.map(c => `[PEER INSIGHT - ${c.type.toUpperCase()} from ${c.name}]: ${c.content}`).join("\n\n");
    const newContext = `${inputValues.context}\n\n--- INCORPORATED PEER REVIEW ---\n${peerInsights}`;
    handleBranch(newContext);
  };

  if (isAuthChecking) {
    return <div className="flex items-center justify-center h-screen bg-slate-950"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>;
  }

  if (!user && !isGuestMode && status !== AnalysisStatus.SHARED_VIEW) { 
    return <Auth onContinueAsGuest={() => { setIsGuestMode(true); logActivity(null, 'guest_session_start'); }} />; 
  }

  const isOwner = sessions.some(s => s.id === currentSessionId);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-200 font-sans overflow-hidden">
      {!isPublicSession && (
        <SessionHistory 
          isOpen={isHistoryOpen} sessions={sessions} currentSessionId={currentSessionId} user={user}
          onSelectSession={loadSession} onNewSession={startNewSession} onClose={() => setIsHistoryOpen(false)}
          onDeleteSession={async (id) => { await deleteSession(id); setSessions(await getSessions(user?.id)); }}
          onSignOut={handleSignOut}
        />
      )}
      <FrameworkLibrary isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} />
      
      {/* Confirmation Dialog Modal */}
      {confirmationDialog && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm shadow-2xl animate-fade-in text-center">
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-amber-500/40">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {confirmationDialog.type === 'cancel_analysis' ? 'Cancel Analysis?' : 'Download Report?'}
            </h3>
            <p className="text-slate-400 mb-8 text-sm leading-relaxed">
              {confirmationDialog.type === 'cancel_analysis' 
                ? 'Your current deliberation is in progress. Moving away will terminate the active session.' 
                : 'You have a completed strategic analysis. Would you like to export the PDF before starting something new?'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setConfirmationDialog(null)} 
                className="py-3 bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-widest"
              >
                Go Back
              </button>
              <button 
                onClick={() => { confirmationDialog.pendingAction(); setConfirmationDialog(null); }} 
                className="py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all"
              >
                {confirmationDialog.type === 'cancel_analysis' ? 'Terminate' : 'Skip & Move'}
              </button>
            </div>
            {confirmationDialog.type === 'download_first' && (
              <button 
                onClick={async () => { await handleExportPDF(); confirmationDialog.pendingAction(); setConfirmationDialog(null); }}
                className="w-full mt-3 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                Download & Move
              </button>
            )}
          </div>
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && currentSessionId && (
        <ShareModal 
          isOpen={isShareModalOpen} 
          onClose={() => setIsShareModalOpen(false)} 
          sessionId={currentSessionId} 
          title={inputValues.title}
          isPublicInitial={isPublicSession}
        />
      )}

      {showWaitlist && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md text-center">
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl max-w-md shadow-2xl animate-fade-in">
            <h3 className="text-2xl font-bold text-white mb-4">Quota Exceeded</h3>
            {hasJoinedWaitlist ? (
              <div className="animate-fade-in">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p className="text-slate-300 font-bold mb-2">Request Received</p>
                <p className="text-slate-500 text-sm mb-6">We've noted your interest. Capacity expands soon.</p>
                <button onClick={() => setShowWaitlist(false)} className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl">Close</button>
              </div>
            ) : (
              <>
                <p className="text-slate-400 mb-6 text-sm">Join the waitlist for unlimited deliberation capacity.</p>
                {user ? <div className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 text-xs text-left flex items-center gap-3"><div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>Registering {user.email}...</div> : <input type="email" id="waitlist-email" placeholder="your@email.com" className="w-full p-4 bg-slate-950 border border-slate-700 rounded-xl mb-4 text-white outline-none focus:border-indigo-500 transition-all" />}
                <button onClick={() => { const email = user?.email || (document.getElementById('waitlist-email') as HTMLInputElement)?.value; if (email) handleWaitlistJoin(email); }} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/30">Notify Me</button>
                <button onClick={() => setShowWaitlist(false)} className="mt-4 text-xs text-slate-500 uppercase font-bold tracking-widest">Dismiss</button>
              </>
            )}
          </div>
        </div>
      )}

      {showLevelUp && (
         <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[400] animate-bounce">
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 p-1 rounded-2xl shadow-2xl">
               <div className="bg-slate-900 px-8 py-4 rounded-[14px] flex flex-col items-center">
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-1">New Strategic Rank</div>
                  <div className="text-2xl font-black text-white">LEVEL {level} UNLOCKED</div>
               </div>
            </div>
         </div>
      )}
      <header className="flex-shrink-0 h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 z-30">
                <div className="flex items-center gap-4">
                  {!isPublicSession && (
                    <button 
                      onClick={() => setIsHistoryOpen(true)} 
                      aria-label="Open History"
                      className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    </button>
                  )}
                  <h1 className="text-lg font-bold text-white tracking-tight">{UI_CONTENT.APP_NAME}</h1>
                  {isPublicSession && <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border border-indigo-500/30 px-2 py-0.5 rounded bg-indigo-500/10">Shared Deliberation</span>}
                </div>
        <div className="flex items-center gap-6">
          {!isPublicSession ? <GamifiedHeader xp={xp} level={level} /> : (
            <button onClick={startNewSession} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-all uppercase tracking-widest">Start My Own Analysis</button>
          )}
        </div>
      </header>
      <main className="flex-1 overflow-hidden relative p-4 lg:p-6">
        <ResizableSplitPane 
          isResultReady={status === AnalysisStatus.COMPLETE || status === AnalysisStatus.SHARED_VIEW}
          left={<InputForm initialValues={inputValues} onSubmit={handleAnalysis} isLoading={status === AnalysisStatus.ANALYZING} sessions={sessions} />}
          right={
            <div className="h-full overflow-y-auto custom-scrollbar">
              {(status === AnalysisStatus.COMPLETE || status === AnalysisStatus.ANALYZING || status === AnalysisStatus.ERROR || status === AnalysisStatus.SHARED_VIEW) && (result || partialResult || status === AnalysisStatus.ERROR) && (
                <div className="space-y-6 animate-fade-in pb-12">
                  {(status === AnalysisStatus.COMPLETE || status === AnalysisStatus.SHARED_VIEW) && result ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-2 bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border border-indigo-500/30 rounded-xl p-8 flex flex-col shadow-2xl">
                        <h2 className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-4">{UI_CONTENT.RESULTS.FINAL_VERDICT}</h2>
                        <h3 className="text-3xl font-black text-white mb-4 leading-tight">{result.synthesis?.verdict}</h3>
                        <p className="text-slate-300 leading-relaxed text-lg mb-8">{result.synthesis?.recommendation}</p>
                        <div className="flex flex-wrap gap-3 mt-auto">
                          {isOwner && <button onClick={() => setIsChatOpen(true)} className="p-3 bg-white text-slate-950 rounded-xl active:scale-95 transition-all hover:bg-slate-100 flex items-center justify-center group"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg><span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 font-bold whitespace-nowrap">{UI_CONTENT.RESULTS.CONSULT_COUNCIL}</span></button>}
                          <button onClick={() => setIsElaborationOpen(!isElaborationOpen)} className={`p-3 border rounded-xl active:scale-95 transition-all flex items-center justify-center group ${isElaborationOpen ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10'}`}><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg><span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 font-bold whitespace-nowrap">{isElaborationOpen ? UI_CONTENT.RESULTS.HIDE : UI_CONTENT.RESULTS.ELABORATION}</span></button>
                          {isOwner && <button onClick={handleDevelopPlan} disabled={isGeneratingPlan} className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl active:scale-95 flex items-center justify-center transition-all disabled:opacity-50 group">{isGeneratingPlan ? <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line><path d="m9 16 2 2 4-4"/></svg>}<span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 font-bold whitespace-nowrap">{UI_CONTENT.RESULTS.PLANNING}</span></button>}
                          <button onClick={handleExportPDF} disabled={isExporting} className="p-3 border border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10 rounded-xl active:scale-95 flex items-center justify-center transition-all disabled:opacity-50 group">{isExporting ? <svg className="animate-spin h-5 w-5 text-indigo-300" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" x2="12" y2="3"></line></svg>}<span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 font-bold whitespace-nowrap">{UI_CONTENT.RESULTS.EXPORT}</span></button>
                          {isOwner && (
                            <button onClick={() => setIsShareModalOpen(true)} className="p-3 border border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10 rounded-xl active:scale-95 flex items-center justify-center transition-all group">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                              <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 font-bold whitespace-nowrap">Share</span>
                            </button>
                          )}
                          {isOwner && contributions.length > 0 && (
                            <button onClick={() => setIsCollaborationModalOpen(true)} className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl active:scale-95 flex items-center justify-center transition-all group shadow-lg shadow-indigo-900/40">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                              <span className="max-w-0 overflow-hidden group-hover:max-w-xs group-hover:ml-2 transition-all duration-300 font-bold whitespace-nowrap">Manage Peer Insights</span>
                            </button>
                          )}
                          <div className="ml-auto flex items-center gap-2">
                             <button onClick={() => handleFeedback('helpful')} className={`p-3 rounded-xl border ${result?.feedback === 'helpful' ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12"></path><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"></path></svg></button>
                             <button onClick={() => handleFeedback('not-helpful')} className={`p-3 rounded-xl border ${result?.feedback === 'not-helpful' ? 'bg-red-500 border-red-400 text-white' : 'bg-slate-800 border-slate-700 text-slate-500'}`}><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V2"></path><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79-1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"></path></svg></button>
                          </div>
                        </div>
                        {showFeedbackForm && (
                          <div className="mt-6 p-6 bg-slate-900/50 border border-slate-800 rounded-xl animate-fade-in">
                            {feedbackSubmitted ? <div className="text-emerald-400 font-bold flex items-center gap-2"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>{UI_CONTENT.FEEDBACK.SUCCESS}</div> : <>
                                <h4 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-widest">{UI_CONTENT.FEEDBACK.TITLE}</h4>
                                <textarea value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} placeholder={UI_CONTENT.FEEDBACK.PLACEHOLDER} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white placeholder-slate-600 focus:ring-1 focus:ring-indigo-500 outline-none transition-all h-24 resize-none mb-3 text-sm"/>
                                <div className="flex justify-end gap-3"><button onClick={() => setShowFeedbackForm(false)} className="text-xs font-bold text-slate-500 uppercase px-4 py-2">Cancel</button><button onClick={submitDetailedFeedback} disabled={!feedbackComment.trim()} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg uppercase tracking-widest transition-all">Submit</button></div>
                              </>}
                          </div>
                        )}
                      </div>
                      <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center gap-4">
                        <RadarViz metrics={result.synthesis?.metrics} />
                        <button 
                          onClick={() => setIsTreeOpen(true)}
                          className="w-full py-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m8 22 4-10 4 10"/></svg>
                          Scenario Mapping
                        </button>
                      </div>
                    </div>
                  ) : status === AnalysisStatus.ERROR ? (
                    <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-12 text-center animate-fade-in">
                       <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/40">
                          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-400"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                       </div>
                       <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tighter">Council Deadlock</h3>
                       <p className="text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">The Master Model failed to synthesize the archetypal perspectives. Your individual agent reports are preserved below.</p>
                       <button onClick={() => handleAnalysis(inputValues)} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-900/40">Retry Synthesis</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                       <div className="md:col-span-2 bg-slate-900/40 border border-slate-800 rounded-xl h-64 flex flex-col items-center justify-center text-center p-8">
                          <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4"><svg className="animate-spin h-6 w-6 text-indigo-500" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg></div>
                          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Synthesizing Archetypal Perspectives...</div>
                       </div>
                       <div className="bg-slate-900/40 border border-slate-800 rounded-xl h-64 flex flex-col items-center justify-center text-center p-6">
                          <div className="w-10 h-10 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-3"></div>
                          <div className="text-[8px] font-black uppercase tracking-widest text-slate-600">Mapping Metrics...</div>
                       </div>
                    </div>
                  )}
                  
                  {/* Contribution Form for Public View */}
                  {isPublicSession && !isOwner && (
                    <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-8 animate-fade-in">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-white">Contribute Your Perspective</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Post as Anonymous</span>
                          <button 
                            onClick={() => setIsAnonymous(!isAnonymous)}
                            className={`w-10 h-5 rounded-full transition-all relative ${isAnonymous ? 'bg-indigo-600' : 'bg-slate-700'}`}
                          >
                            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isAnonymous ? 'left-6' : 'left-1'}`} />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-slate-400 text-sm mb-6">Your insights will be shared with the deliberation owner to help refine their decision.</p>
                      
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {!isAnonymous && (
                            <input 
                              type="text" 
                              value={contributionName} 
                              onChange={(e) => setContributionName(e.target.value)} 
                              placeholder="Your Name (Optional)" 
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white placeholder-slate-600 focus:border-indigo-500 outline-none transition-all"
                            />
                          )}
                          <div className={`flex gap-2 p-1 bg-slate-950 border border-slate-800 rounded-xl ${isAnonymous ? 'col-span-2' : ''}`}>
                            {[
                              { id: 'risk', label: '🚩 Risk', color: 'text-red-400' },
                              { id: 'variable', label: '🧩 Variable', color: 'text-blue-400' },
                              { id: 'alternative', label: '💡 Alternative', color: 'text-emerald-400' }
                            ].map((t) => (
                              <button
                                key={t.id}
                                onClick={() => setContributionType(t.id as any)}
                                className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-tighter transition-all ${contributionType === t.id ? 'bg-slate-800 text-white border border-slate-700 shadow-xl' : 'text-slate-500 hover:text-slate-300'}`}
                              >
                                <span className={contributionType === t.id ? t.color : ''}>{t.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <textarea 
                          value={contributionContent} 
                          onChange={(e) => setContributionContent(e.target.value)} 
                          rows={4} 
                          placeholder={
                            contributionType === 'risk' ? "What critical failure mode or risk has been overlooked?" :
                            contributionType === 'variable' ? "What new variable or context should the council consider?" :
                            "Suggest an alternative strategic path or specific action..."
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white placeholder-slate-600 focus:border-indigo-500 outline-none transition-all resize-none"
                        />
                        
                        <button 
                          onClick={handleSubmitContribution}
                          disabled={isContributing || !contributionContent.trim()}
                          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all disabled:opacity-50 shadow-xl shadow-indigo-900/20"
                        >
                          {isContributing ? "Submitting..." : "Submit to Council"}
                        </button>
                      </div>
                    </div>
                  )}

                  {(status === AnalysisStatus.COMPLETE || status === AnalysisStatus.SHARED_VIEW) && result && isElaborationOpen && <VerdictElaboration result={result} />}
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <AgentCard role="Analyst" agent={result?.analyst} color="blue" isLoading={!result?.analyst && !partialResult?.analyst} />
                    <AgentCard role="Strategist" agent={result?.strategist} color="purple" isLoading={!result?.strategist && !partialResult?.strategist} />
                    <AgentCard role="Skeptic" agent={result?.skeptic} color="red" isLoading={!result?.skeptic && !partialResult?.skeptic} />
                    <AgentCard role="Mediator" agent={result?.mediator} color="emerald" isLoading={!result?.mediator && !partialResult?.mediator} />
                    
                    {/* Render Contributions ONLY for Owner */}
                    {isOwner && contributions.map((c) => (
                        <AgentCard 
                          key={c.id}
                          role="Human" 
                          type={c.type}
                          agent={{
                            name: c.name,
                            role: "Human Perspective",
                            analysis: c.content,
                            keyPoints: [c.status === 'accepted' ? "Incorporated into Synthesis" : "Pending Review"],
                            score: 100,
                            sequence: []
                          }} 
                          color="indigo" 
                          isLoading={false} 
                        />
                      ))}
                  </div>

                  {(status === AnalysisStatus.COMPLETE || status === AnalysisStatus.SHARED_VIEW) && result && (
                    <div className="pt-8 pb-20 border-t border-slate-800/50 mt-12">
                      <CommitmentPanel 
                          options={inputValues.options} 
                          refinedPaths={result.synthesis?.refinedPaths}
                          onCommit={handleCommitment} 
                          onBranch={handleBranch} 
                          onConsult={() => setIsChatOpen(true)}
                          coreInquiry={inputValues.title}
                          existingCommitment={currentSessionId ? sessions.find(s => s.id === currentSessionId)?.commitment : undefined} 
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
                           <div className="w-16 h-16 rounded-full border-4 border-slate-900 bg-blue-900/20 flex items-center justify-center text-blue-400 shadow-lg z-40"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg></div>
                           <div className="w-16 h-16 rounded-full border-4 border-slate-900 bg-purple-900/20 flex items-center justify-center text-purple-400 shadow-lg z-30"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg></div>
                           <div className="w-16 h-16 rounded-full border-4 border-slate-900 bg-red-900/20 flex items-center justify-center text-red-400 shadow-lg z-20"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
                           <div className="w-16 h-16 rounded-full border-4 border-slate-900 bg-emerald-900/20 flex items-center justify-center text-emerald-400 shadow-lg z-10"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
                        </div>
                     </div>
                  </div>
                  <h2 className="text-4xl font-black text-white mb-6 tracking-tight">{UI_CONTENT.IDLE.TITLE}</h2>
                  <p className="text-lg text-slate-400 max-w-lg mx-auto leading-relaxed mb-12">{UI_CONTENT.IDLE.DESCRIPTION}</p>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl">{UI_CONTENT.IDLE.AGENTS.map(agent => (<div key={agent.name} className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50 text-left"><div className={`text-xs font-black uppercase tracking-widest mb-1 ${agent.color}`}>{agent.name}</div><div className="text-[10px] text-slate-500 font-medium">{agent.desc}</div></div>))}</div>
                </div>
              )}
            </div>
          }
        />
      </main>
      {isChatOpen && result && <CouncilChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} councilResult={result} input={inputValues} chatHistory={chatHistory} onUpdateHistory={setChatHistory} onReAnalyze={(newCtx) => handleAnalysis({...inputValues, context: inputValues.context + newCtx})} />}
      {currentPlan && (
        <ActionPlanModal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} onSave={handleSavePlan} plan={currentPlan} />
      )}
      {isTreeOpen && (
        <DecisionTreeViz 
          problemTitle={inputValues.title} 
          councilResult={result || undefined}
          initialTree={currentSessionId ? sessions.find(s => s.id === currentSessionId)?.decisionTree : undefined}
          onSave={handleSaveTree} 
          onClose={() => setIsTreeOpen(false)} 
        />
      )}
      {isCollaborationModalOpen && currentSessionId && (
        <CollaborationModal 
          isOpen={isCollaborationModalOpen} 
          onClose={() => setIsCollaborationModalOpen(false)} 
          session={sessions.find(s => s.id === currentSessionId)!}
          onSynthesize={handlePeerSynthesis}
          isSynthesizing={isPeerSynthesizing}
        />
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <DecidrApp />
    </ErrorBoundary>
  );
};

export default App;

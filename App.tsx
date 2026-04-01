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
import NotificationFeed from './components/NotificationFeed';
import Auth from './components/Auth';
import { UI_CONTENT } from './src/constants/uiContent';
import { analyzeDecision, generateActionPlan, generateDecisionTree, synthesizeOnly } from './services/geminiService';
import { saveSession, getSessions, deleteSession, getLocalSessions } from './services/storageService';
import { auth, logActivity, onAuthStateChanged, signOut, isGCPConfigured, saveDetailedFeedback, saveToWaitlist, getUserProfile, saveUserProfile, getPublicSession, addSessionContribution, updateContributionStatus, getSessionContributions } from './services/googleCloud';
import { generateDecisionPDF } from './services/pdfService';
import { DecisionInput, CouncilResult, AnalysisStatus, DecisionSession, ChatMessage, UserProfile, ActionPlan, PartialCouncilResult, DecisionTree, Contribution, Notification } from './types';

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
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center text-left">
          <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-6 border border-red-500/50">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-tighter">System Malfunction</h1>
          <p className="text-slate-400 max-w-md mb-8">The Council interface has encountered a fatal rendering error.</p>
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
  const [isCollaborationModalOpen, setIsCollaborationModalOpen] = useState(false);
  const [isSharedLoading, setIsSharedLoading] = useState(false);
  const [isPublicSession, setIsPublicSession] = useState(false);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [isContributing, setIsContributing] = useState(false);
  const [contributionName, setContributionName] = useState('');
  const [contributionContent, setContributionContent] = useState('');
  const [contributionType, setContributionType] = useState<Contribution['type']>('variable');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isPeerSynthesizing, setIsPeerSynthesizing] = useState(false);
  const [selectedContributionIds, setSelectedContributionIds] = useState<string[]>([]);
  const [notifyContributors, setNotifyContributors] = useState(true);

  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [shouldStartNewAfterLogin, setShouldStartNewAfterLogin] = useState(false);

  const isOwner = sessions.some(s => s.id === currentSessionId);
  const [isHumanInsightsVisible, setIsHumanInsightsVisible] = useState(true);

  // PRESERVE SHARED HISTORY ON LOGIN
  useEffect(() => {
    if (user && status === AnalysisStatus.SHARED_VIEW && result && !isOwner) {
      const preserveSession = async () => {
        const sessionToSave: DecisionSession = {
          id: currentSessionId || crypto.randomUUID(),
          user_id: user.id,
          timestamp: Date.now(),
          input: inputValues,
          result: result,
          status: AnalysisStatus.COMPLETE,
          chatHistory: chatHistory,
          isPublic: true,
          contributions: contributions
        };
        await saveSession(sessionToSave);
        const updatedSessions = await getSessions(user.id);
        setSessions(updatedSessions);
        if (shouldStartNewAfterLogin) {
          executeStartNewSession();
          setShouldStartNewAfterLogin(false);
        }
      };
      preserveSession();
    }
  }, [user, status, result, isOwner, shouldStartNewAfterLogin]);

  // LOAD CONTRIBUTIONS FOR OWNER (Unified Merge)
  useEffect(() => {
    if (currentSessionId && isOwner) {
      const fetchInsights = async () => {
        const subCollectionInsights = await getSessionContributions(currentSessionId);
        const session = sessions.find(s => s.id === currentSessionId);
        const legacyInsights = session?.contributions || [];
        const mergedMap = new Map<string, Contribution>();
        legacyInsights.forEach(c => mergedMap.set(c.id, c));
        subCollectionInsights.forEach(c => mergedMap.set(c.id, c));
        const finalMerged = Array.from(mergedMap.values()).sort((a, b) => b.timestamp - a.timestamp);
        setContributions(finalMerged);
      };
      fetchInsights();
    }
  }, [currentSessionId, isOwner, sessions]);

  // NOTIFICATION ENGINE
  useEffect(() => {
    if (status === AnalysisStatus.SHARED_VIEW && !isOwner) return;
    const runEngine = async () => {
      const newNotifications: Notification[] = [];
      const now = Date.now();
      const dayInMs = 24 * 60 * 60 * 1000;
      for (const session of sessions) {
        if (session.status === AnalysisStatus.COMPLETE && !session.commitment) {
          const ageInDays = (now - session.timestamp) / dayInMs;
          if (ageInDays >= 14) {
            newNotifications.push({ id: `nudge-14-${session.id}`, type: 'commitment_nudge', title: 'Critical Stalemate', message: `Decision pending for 2 weeks.`, timestamp: now, read: false, linkSessionId: session.id, intensity: 'high' });
          } else if (ageInDays >= 5) {
            newNotifications.push({ id: `nudge-5-${session.id}`, type: 'commitment_nudge', title: 'Stagnation Warning', message: `5 days since Council verdict.`, timestamp: now, read: false, linkSessionId: session.id, intensity: 'medium' });
          }
        }
        if (session.isPublic) {
          const peerInsights = await getSessionContributions(session.id);
          const pendingCount = peerInsights.filter(c => c.status === 'pending').length;
          if (pendingCount > 0) {
            newNotifications.push({ id: `peer-${session.id}`, type: 'peer_contribution', title: 'New Peer Insight', message: `${pendingCount} expert review pending.`, timestamp: now, read: false, linkSessionId: session.id, intensity: 'low' });
          }
        }
      }
      setNotifications(prev => {
        const existingIds = new Set(prev.map(n => n.id));
        const uniqueNew = newNotifications.filter(n => !existingIds.has(n.id));
        return [...prev, ...uniqueNew];
      });
    };
    runEngine();
  }, [sessions, status, isOwner]);

  const handleMarkNotificationRead = (id: string) => { setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n)); };
  const handleDismissNotification = (id: string) => { setNotifications(prev => prev.filter(n => n.id !== id)); };
  const handleNavigateFromNotification = (sessionId: string, notificationId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) { loadSession(session); handleMarkNotificationRead(notificationId); setIsNotificationOpen(false); }
  };

  // AUTH EFFECT
  useEffect(() => {
    if (!isGCPConfigured || !auth) { setIsAuthChecking(false); return; }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const cloudProfile = await getUserProfile(firebaseUser.uid);
        const localXp = parseInt(localStorage.getItem(`dc_xp_${firebaseUser.uid}`) || '0', 10);
        const finalXp = Math.max(cloudProfile?.xp || 0, localXp);
        const finalLevel = Math.floor(finalXp / 500) + 1;
        setUser({ id: firebaseUser.uid, email: firebaseUser.email || "User", xp: finalXp, level: finalLevel });
        setXp(finalXp); setLevel(finalLevel);
        localStorage.setItem(`dc_xp_${firebaseUser.uid}`, finalXp.toString());
        localStorage.setItem(`dc_level_${firebaseUser.uid}`, finalLevel.toString());
        if (!cloudProfile || cloudProfile.xp < finalXp) { await saveUserProfile(firebaseUser.uid, finalXp, finalLevel); }
        logActivity(firebaseUser.uid, 'login');
        setSessions(await getSessions(firebaseUser.uid));
      } else {
        setUser(null); setSessions(getLocalSessions());
        setXp(parseInt(localStorage.getItem('dc_xp_guest') || '0', 10));
        setLevel(parseInt(localStorage.getItem('dc_level_guest') || '1', 10));
      }
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  // SHARED LINK EFFECT
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('share');
    if (shareId) { handleLoadSharedSession(shareId); }
  }, []);

  const handleLoadSharedSession = async (shareId: string) => {
    setIsSharedLoading(true);
    try {
      const session = await getPublicSession(shareId);
      if (session) {
        setCurrentSessionId(session.id); setInputValues(session.input); setResult(session.result);
        setStatus(AnalysisStatus.SHARED_VIEW); setContributions([]); setIsPublicSession(true);
      } else { alert("Shared deliberation not found."); setStatus(AnalysisStatus.IDLE); }
    } catch (e) { console.error(e); setStatus(AnalysisStatus.IDLE); } finally { setIsSharedLoading(false); }
  };

  useEffect(() => { if (localStorage.getItem('dc_waitlist_joined') === 'true') { setHasJoinedWaitlist(true); } }, []);
  useEffect(() => { const used = localStorage.getItem('dc_credits_used'); setCredits(used ? parseInt(used, 10) : 0); }, []);

  const handleWaitlistJoin = async (email: string) => { await saveToWaitlist(email, user?.id); setHasJoinedWaitlist(true); localStorage.setItem('dc_waitlist_joined', 'true'); };
  const updateProgression = async (addedXp: number) => {
    const newXp = xp + addedXp;
    const newLevel = Math.floor(newXp / 500) + 1;
    setXp(newXp);
    if (newLevel > level) { setLevel(newLevel); setShowLevelUp(true); setTimeout(() => setShowLevelUp(false), 5000); }
    localStorage.setItem(user ? `dc_xp_${user.id}` : 'dc_xp_guest', newXp.toString());
    localStorage.setItem(user ? `dc_level_${user.id}` : 'dc_level_guest', newLevel.toString());
    if (user) { await saveUserProfile(user.id, newXp, newLevel); }
  };

  const handleFeedback = async (type: 'helpful' | 'not-helpful') => {
    if (!result) return;
    const newResult = { ...result, feedback: type };
    setResult(newResult); setShowFeedbackForm(true); setFeedbackSubmitted(false);
    logActivity(user?.id, 'feedback_click', { verdict: result.synthesis.verdict, type });
    if (currentSessionId) {
      const session = sessions.find(s => s.id === currentSessionId);
      if (session) await saveSession({ ...session, result: newResult });
    }
  };

  const submitDetailedFeedback = async () => { if (!currentSessionId || !result?.feedback) return; await saveDetailedFeedback(user?.id, currentSessionId, result.feedback, feedbackComment); setFeedbackSubmitted(true); setTimeout(() => setShowFeedbackForm(false), 2000); setFeedbackComment(''); };
  const handleCommitment = async (selected: string, why: string) => {
    if (!currentSessionId) return;
    const session = sessions.find(s => s.id === currentSessionId);
    if (!session) return;
    const commitment = { selectedOption: selected, justification: why, timestamp: Date.now() };
    const updatedSession = { ...session, commitment };
    await updateProgression(150); await saveSession(updatedSession); setSessions(await getSessions(user?.id));
    logActivity(user?.id, 'commitment_made', { selected, title: session.input.title });
  };

  const handleBranch = (newContext: string) => {
    const parentId = currentSessionId || undefined;
    const oldTitle = inputValues.title;
    executeStartNewSession();
    setInputValues(prev => ({ title: oldTitle, context: `${newContext} `, constraints: prev.constraints, options: '', parentId: parentId }));
  };

  const handleDevelopPlan = async () => {
    if (!result || !inputValues) return;
    const existingSession = sessions.find(s => s.id === currentSessionId);
    if (existingSession?.actionPlan) { setCurrentPlan(existingSession.actionPlan); setIsPlanModalOpen(true); return; }
    setIsGeneratingPlan(true);
    try {
      const plan = await generateActionPlan(inputValues, result);
      setCurrentPlan(plan); setIsPlanModalOpen(true);
      if (currentSessionId) {
        const session = sessions.find(s => s.id === currentSessionId);
        if (session) { const updatedSession = { ...session, actionPlan: plan }; await saveSession(updatedSession); setSessions(await getSessions(user?.id)); }
      }
    } catch (e) { console.error(e); } finally { setIsGeneratingPlan(false); }
  };

  const handleSavePlan = async (updatedPlan: ActionPlan) => { if (!currentSessionId) return; const session = sessions.find(s => s.id === currentSessionId); if (session) { const updatedSession = { ...session, actionPlan: updatedPlan }; await saveSession(updatedSession); setCurrentPlan(updatedPlan); setSessions(await getSessions(user?.id)); } };
  const handleSaveTree = async (tree: DecisionTree, shouldClose: boolean = true) => { if (!currentSessionId) return; const session = sessions.find(s => s.id === currentSessionId); if (session) { const updatedSession = { ...session, decisionTree: tree }; await saveSession(updatedSession); if (shouldClose) setIsTreeOpen(false); setSessions(await getSessions(user?.id)); } };

  const executeStartNewSession = () => { window.history.pushState({}, '', window.location.pathname); setCurrentSessionId(null); setInputValues({ title: '', context: '', constraints: '', options: '' }); setResult(null); setPartialResult(null); setChatHistory([]); setStatus(AnalysisStatus.IDLE); setIsChatOpen(false); setIsElaborationOpen(false); setCurrentPlan(null); setHasDownloadedPDF(false); setContributions([]); setIsPublicSession(false); };
  const startNewSession = () => { if (status === AnalysisStatus.ANALYZING) { setConfirmationDialog({ type: 'cancel_analysis', pendingAction: executeStartNewSession }); return; } if (status === AnalysisStatus.COMPLETE && !hasDownloadedPDF) { setConfirmationDialog({ type: 'download_first', pendingAction: executeStartNewSession }); return; } executeStartNewSession(); };

  const executeLoadSession = async (session: DecisionSession) => {
    window.history.pushState({}, '', window.location.pathname);
    setCurrentSessionId(session.id); setInputValues(session.input); setResult(session.result); setPartialResult(null); setChatHistory(session.chatHistory || []);
    setStatus(session.status); setIsChatOpen(false); setIsElaborationOpen(false); setCurrentPlan(session.actionPlan || null); setIsHistoryOpen(false); setHasDownloadedPDF(true); setIsPublicSession(session.isPublic || false);
    const peerInsights = await getSessionContributions(session.id); setContributions(peerInsights);
  };

  const loadSession = (session: DecisionSession) => { if (status === AnalysisStatus.ANALYZING) { setConfirmationDialog({ type: 'cancel_analysis', pendingAction: () => executeLoadSession(session) }); return; } if (status === AnalysisStatus.COMPLETE && !hasDownloadedPDF && currentSessionId !== session.id) { setConfirmationDialog({ type: 'download_first', pendingAction: () => executeLoadSession(session) }); return; } executeLoadSession(session); };

  const handleAnalysis = async (input: DecisionInput) => {
    if (credits >= MAX_FREE_CREDITS) { if (user && user.email && !hasJoinedWaitlist) { await handleWaitlistJoin(user.email); } setShowWaitlist(true); return; }
    const canRetrySynthesis = partialResult && partialResult.analyst && partialResult.strategist && partialResult.skeptic && partialResult.mediator;
    setStatus(AnalysisStatus.ANALYZING); setInputValues(input); if (!canRetrySynthesis) { setResult(null); setPartialResult(null); }
    setHasDownloadedPDF(false); logActivity(user?.id, canRetrySynthesis ? 'retry_synthesis' : 'analysis_started', { title: input.title });
    try {
      let data: CouncilResult;
      if (canRetrySynthesis) { data = await synthesizeOnly(input, partialResult); } else { data = await analyzeDecision(input, (partial) => { try { setPartialResult(prev => ({ ...(prev || {}), ...partial })); } catch (e) { console.warn("Partial state update skipped", e); } }); }
      setResult(data); setPartialResult(null); setStatus(AnalysisStatus.COMPLETE);
      const newCredits = credits + 1; setCredits(newCredits); localStorage.setItem('dc_credits_used', newCredits.toString()); await updateProgression(100);
      const sessionId = currentSessionId || crypto.randomUUID();
      const newSession: DecisionSession = { id: sessionId, user_id: user?.id, timestamp: Date.now(), input: input, result: data, status: AnalysisStatus.COMPLETE, chatHistory: [], isPublic: false };
      await saveSession(newSession); setCurrentSessionId(sessionId); setSessions(await getSessions(user?.id));
      (async () => { try { const [plan, tree] = await Promise.all([ generateActionPlan(input, data), generateDecisionTree(input.title, data) ]); const session = (await getSessions(user?.id)).find(s => s.id === sessionId); if (session) { await saveSession({ ...session, actionPlan: plan, decisionTree: tree }); if (sessionId === currentSessionId) { setCurrentPlan(plan); setSessions(await getSessions(user?.id)); } } } catch (bgError) { console.error("Background Gen Error:", bgError); } })();
    } catch (error: any) { setStatus(AnalysisStatus.ERROR); logActivity(user?.id, 'error', { message: error.message }); }
  };

  const handleExportPDF = async () => { if (!result || !inputValues) return; setIsExporting(true); try { await generateDecisionPDF(inputValues, result, currentPlan || undefined); setHasDownloadedPDF(true); } catch (e) { console.error(e); } finally { setIsExporting(false); } };
  const handleSignOut = async () => { logActivity(user?.id, 'logout'); if (auth) await signOut(auth); setIsGuestMode(false); setUser(null); setSessions([]); setCurrentSessionId(null); setResult(null); setPartialResult(null); setStatus(AnalysisStatus.IDLE); setCredits(0); setXp(0); setLevel(1); };

  const toggleContributionSelection = (id: string) => { setSelectedContributionIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]); };
  const handleIncorporatePeerSynthesis = async () => {
    if (selectedContributionIds.length === 0 || !result) return;
    setIsPeerSynthesizing(true);
    const selectedPeers = contributions.filter(c => selectedContributionIds.includes(c.id));
    try {
      const updatedResult = await synthesizeOnly(inputValues, result, selectedPeers);
      setResult(updatedResult);
      const session = sessions.find(s => s.id === currentSessionId);
      if (session && currentSessionId) {
        await Promise.all(selectedContributionIds.map(id => updateContributionStatus(currentSessionId, id, { status: 'accepted', notified: notifyContributors })));
        const updatedContributions = contributions.map(c => selectedContributionIds.includes(c.id) ? { ...c, status: 'accepted' as const, notified: notifyContributors } : c);
        const updatedSession = { ...session, result: updatedResult }; await saveSession(updatedSession); setSessions(await getSessions(user?.id)); setContributions(updatedContributions); setSelectedContributionIds([]);
      }
      await updateProgression(200);
    } catch (e) { console.error(e); alert("Council failed to incorporate peer insights."); } finally { setIsPeerSynthesizing(false); }
  };

  useEffect(() => { if (user && !isAnonymous && !contributionName) { setContributionName(user.email.split('@')[0]); } }, [user, isAnonymous]);
  const handleSubmitContribution = async (name: string, content: string, type: Contribution['type'], isAnon: boolean) => {
    if (!currentSessionId || !content.trim()) return;
    setIsContributing(true);
    const finalName = isAnon ? "Anonymous Expert" : (name.trim() || "Anonymous Expert");
    const contribution: Contribution = { id: crypto.randomUUID(), name: finalName, content: content.trim(), type: type, timestamp: Date.now(), status: 'pending' };
    try { 
      await addSessionContribution(currentSessionId, contribution); 
      setContributions(prev => [...prev, contribution]); 
      alert("Perspective submitted for review."); 
    } catch (e) { 
      console.error(e); 
    } finally { 
      setIsContributing(false); 
    }
  };

  const handleStartOwnAnalysis = () => {
    if (!user) {
      setShouldStartNewAfterLogin(true);
      setIsGuestMode(false);
    } else {
      startNewSession();
    }
  };

  if (isAuthChecking) { return <div className="flex items-center justify-center h-screen bg-slate-950"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div></div>; }
  if (!user && !isGuestMode && status !== AnalysisStatus.SHARED_VIEW) { return <Auth onContinueAsGuest={() => { setIsGuestMode(true); logActivity(null, 'guest_session_start'); }} />; }

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-200 font-sans overflow-hidden text-left">
      {(!isPublicSession || isOwner) && (
        <SessionHistory isOpen={isHistoryOpen} sessions={sessions} currentSessionId={currentSessionId} user={user} onSelectSession={loadSession} onNewSession={startNewSession} onClose={() => setIsHistoryOpen(false)} onDeleteSession={async (id) => { await deleteSession(id); setSessions(await getSessions(user?.id)); }} onSignOut={handleSignOut} />
      )}
      <FrameworkLibrary isOpen={isLibraryOpen} onClose={() => setIsLibraryOpen(false)} />
      
      {confirmationDialog && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md text-center">
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-sm shadow-2xl animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-2">{confirmationDialog.type === 'cancel_analysis' ? 'Cancel Analysis?' : 'Download Report?'}</h3>
            <p className="text-slate-400 mb-8 text-sm leading-relaxed">{confirmationDialog.type === 'cancel_analysis' ? 'Deliberation in progress.' : 'Deliberation complete. Download PDF report?'}</p>
            <div className="grid grid-cols-2 gap-3"><button onClick={() => setConfirmationDialog(null)} className="py-3 bg-slate-800 text-white font-bold rounded-xl text-xs uppercase tracking-widest">Go Back</button><button onClick={() => { confirmationDialog.pendingAction(); setConfirmationDialog(null); }} className="py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs uppercase tracking-widest">{confirmationDialog.type === 'cancel_analysis' ? 'Terminate' : 'Skip'}</button></div>
          </div>
        </div>
      )}

      {isShareModalOpen && currentSessionId && (
        <ShareModal isOpen={isShareModalOpen} onClose={() => setIsShareModalOpen(false)} sessionId={currentSessionId} title={inputValues.title} isPublicInitial={isPublicSession} />
      )}

      {showWaitlist && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md text-center text-left">
          <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl max-w-md shadow-2xl animate-fade-in">
            <h3 className="text-2xl font-bold text-white mb-4">Quota Exceeded</h3>
            {hasJoinedWaitlist ? (<div className="animate-fade-in"><div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><polyline points="20 6 9 17 4 12"/></svg></div><p className="text-slate-300 font-bold mb-2">Request Received</p><button onClick={() => setShowWaitlist(false)} className="w-full py-4 bg-slate-800 text-white font-bold rounded-xl">Close</button></div>) : (<><p className="text-slate-400 mb-6 text-sm">Join waitlist for unlimited strategic deliberation.</p>{user ? <div className="mb-6 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-300 text-xs text-left"><div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></div>Registering {user.email}...</div> : <input type="email" id="waitlist-email" placeholder="your@email.com" className="w-full p-4 bg-slate-950 border border-slate-700 rounded-xl mb-4 text-white outline-none focus:border-indigo-500" />}<button onClick={() => { const email = user?.email || (document.getElementById('waitlist-email') as HTMLInputElement)?.value; if (email) handleWaitlistJoin(email); }} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/30">Notify Me</button></>)}
          </div>
        </div>
      )}

      {showLevelUp && (<div className="fixed top-20 left-1/2 -translate-x-1/2 z-[400] animate-bounce"><div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 p-1 rounded-2xl shadow-2xl"><div className="bg-slate-900 px-8 py-4 rounded-[14px] flex flex-col items-center"><div className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-1">Rank Up</div><div className="text-2xl font-black text-white">LEVEL {level}</div></div></div></div>)}

      <header className="flex-shrink-0 h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-4 lg:px-6 z-30">
        <div className="flex items-center gap-4">
          {(!isPublicSession || isOwner) && (<button onClick={() => setIsHistoryOpen(true)} className="p-2 -ml-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg></button>)}
          <h1 className="text-lg font-bold text-white tracking-tight">{UI_CONTENT.APP_NAME}</h1>
          {isPublicSession && <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest border border-indigo-500/30 px-2 py-0.5 rounded bg-indigo-500/10 shadow-[0_0_10px_rgba(99,102,241,0.2)]">Shared</span>}
        </div>
        <div className="flex items-center gap-6">
          <button onClick={() => setIsNotificationOpen(true)} className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all">{notifications.filter(n => !n.read).length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border-2 border-slate-900 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>}<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg></button>
          {(!isPublicSession || isOwner) ? <GamifiedHeader xp={xp} level={level} /> : <button onClick={handleStartOwnAnalysis} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-all uppercase tracking-widest px-4 py-2 rounded-lg border border-indigo-500/30 bg-indigo-500/5 shadow-lg shadow-indigo-900/20">Analyze your own decision</button>}
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative p-4 lg:p-6 text-left">
        <ResizableSplitPane isResultReady={status === AnalysisStatus.COMPLETE || status === AnalysisStatus.SHARED_VIEW}
          left={isPublicSession && !isOwner ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl h-full flex flex-col animate-fade-in overflow-y-auto custom-scrollbar text-left">
              <div className="mb-8"><div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">The Strategic Inquiry</div><h2 className="text-2xl font-black text-white leading-tight mb-4 uppercase">{inputValues.title}</h2><div className="w-12 h-1 bg-indigo-500 rounded-full"></div></div>
              <div className="space-y-8 text-left">
                <div><h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Core Context</h4><p className="text-slate-300 leading-relaxed text-sm p-4 bg-slate-950/50 border border-slate-800/50 rounded-xl">{inputValues.context}</p></div>
                {inputValues.constraints && <div><h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Known Constraints</h4><p className="text-slate-400 leading-relaxed text-xs p-4 border border-slate-800/50 rounded-xl italic">{inputValues.constraints}</p></div>}
                {inputValues.options && <div><h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 text-left">Paths Explored</h4><div className="space-y-2">{inputValues.options.split('\n').filter(o => o.trim()).map((opt, i) => (<div key={i} className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-xs text-indigo-200/70 flex gap-3 text-left"><span className="font-mono text-indigo-500 opacity-50 text-left">0{i+1}</span>{opt}</div>))}</div></div>}
              </div>
            </div>
          ) : <InputForm initialValues={inputValues} onSubmit={handleAnalysis} isLoading={status === AnalysisStatus.ANALYZING} sessions={sessions} />}
          right={
            <div className="h-full overflow-y-auto custom-scrollbar text-left">
              {(status === AnalysisStatus.COMPLETE || status === AnalysisStatus.SHARED_VIEW) && result && (
                <div className="space-y-6 animate-fade-in pb-12 text-left">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <div className="md:col-span-2 bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border border-indigo-500/30 rounded-xl p-8 flex flex-col shadow-2xl text-left">
                      <h2 className="text-indigo-300 text-xs font-bold uppercase tracking-widest mb-4">Master Verdict</h2><h3 className="text-3xl font-black text-white mb-4 leading-tight">{result.synthesis?.verdict}</h3><p className="text-slate-300 leading-relaxed text-lg mb-8">{result.synthesis?.recommendation}</p>
                      <div className="flex items-center justify-between gap-3 mt-auto text-left relative">
                        <div className="flex items-center gap-2">
                          {isOwner && (
                            <button 
                              onClick={() => setIsShareModalOpen(true)} 
                              className="p-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl active:scale-95 transition-all shadow-lg shadow-emerald-900/40 flex items-center justify-center group"
                              title="Share Strategic Verdict"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
                            </button>
                          )}
                          <button 
                            onClick={handleExportPDF} 
                            disabled={isExporting}
                            className="p-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl active:scale-95 transition-all shadow-lg shadow-indigo-900/40 flex items-center justify-center gap-3 disabled:opacity-50"
                            title="Download PDF Report"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                          </button>

                          <div className="flex items-center gap-1 bg-slate-950/40 p-1 rounded-xl border border-slate-800/50">
                            <button 
                              onClick={() => handleFeedback('helpful')}
                              className={`p-2 rounded-lg transition-all ${result.feedback === 'helpful' ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-emerald-400'}`}
                              title="Strategic Insight was Helpful"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/></svg>
                            </button>
                            <button 
                              onClick={() => handleFeedback('not-helpful')}
                              className={`p-2 rounded-lg transition-all ${result.feedback === 'not-helpful' ? 'bg-red-500/20 text-red-400' : 'text-slate-500 hover:text-red-400'}`}
                              title="Strategic Insight Needs Refinement"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"/></svg>
                            </button>
                          </div>
                        </div>
                        
                        <div className="relative">
                          <button 
                            onClick={() => setIsActionsMenuOpen(!isActionsMenuOpen)}
                            className={`p-3 rounded-xl transition-all flex items-center justify-center border ${isActionsMenuOpen ? 'bg-slate-800 border-slate-700 text-white shadow-inner' : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
                          </button>

                          {isActionsMenuOpen && (
                            <>
                              <div className="fixed inset-0 z-[100]" onClick={() => setIsActionsMenuOpen(false)} />
                              <div className="absolute bottom-full right-0 mb-4 w-64 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-[110] animate-slide-up origin-bottom-right overflow-hidden">
                                <div className="px-3 py-2 border-b border-slate-800/50 mb-1">
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">More Strategic Actions</span>
                                </div>
                                
                                {isOwner && (
                                  <button 
                                    onClick={() => { setIsChatOpen(true); setIsActionsMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-800 rounded-xl transition-all group"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-slate-900 transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg></div>
                                    <div>
                                      <div className="text-xs font-bold text-white leading-none mb-1">Consult Council</div>
                                      <div className="text-[9px] text-slate-500 font-medium">Chat with agent archetypes</div>
                                    </div>
                                  </button>
                                )}

                                <button 
                                  onClick={() => { setIsElaborationOpen(!isElaborationOpen); setIsActionsMenuOpen(false); }}
                                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-800 rounded-xl transition-all group"
                                >
                                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isElaborationOpen ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700'}`}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></div>
                                  <div>
                                    <div className="text-xs font-bold text-white leading-none mb-1">Deep Elaboration</div>
                                    <div className="text-[9px] text-slate-500 font-medium">Explore granular strategic data</div>
                                  </div>
                                </button>

                                {isOwner && (
                                  <button 
                                    onClick={() => { handleDevelopPlan(); setIsActionsMenuOpen(false); }}
                                    disabled={isGeneratingPlan}
                                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-800 rounded-xl transition-all group"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="m9 16 2 2 4-4"/></svg></div>
                                    <div>
                                      <div className="text-xs font-bold text-white leading-none mb-1">Execution Plan</div>
                                      <div className="text-[9px] text-slate-500 font-medium">Generate step-by-step roadmap</div>
                                    </div>
                                  </button>
                                )}

                                {!isOwner && (
                                  <button 
                                    onClick={() => { setIsCollaborationModalOpen(true); setIsActionsMenuOpen(false); }}
                                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-800 rounded-xl transition-all group"
                                  >
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
                                    <div>
                                      <div className="text-xs font-bold text-white leading-none mb-1">Open Deliberation</div>
                                      <div className="text-[9px] text-slate-500 font-medium">Collaborate in the expert feed</div>
                                    </div>
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-6 flex flex-col items-center justify-center gap-4 text-left"><RadarViz metrics={result.synthesis?.metrics} />{isOwner && (<button onClick={() => setIsTreeOpen(true)} className="w-full py-3 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-inner shadow-indigo-900/10"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m8 22 4-10 4 10"/></svg>Impact Mapping</button>)}</div>
                  </div>

                  {/* Collaborative Intelligence Channel */}
                  {(isOwner || status === AnalysisStatus.SHARED_VIEW || contributions.some(c => c.status === 'accepted')) && (
                    <div className={`lg:col-span-3 transition-all duration-500 text-left ${isHumanInsightsVisible ? 'opacity-100' : 'opacity-50'}`}>
                      <div className="flex justify-between items-center mb-3 px-2 text-left">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Human Intelligence Layer</span>
                        </div>
                        <button onClick={() => setIsHumanInsightsVisible(!isHumanInsightsVisible)} className="p-1.5 text-slate-500 hover:text-white transition-colors rounded-lg bg-slate-900/50 border border-slate-800">
                          {isHumanInsightsVisible ? (<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>) : (<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>)}
                        </button>
                      </div>
                      {isHumanInsightsVisible && (
                        <div className="bg-[#1A1D21]/80 border border-slate-700/50 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl text-left">
                          <div className="px-6 py-3 border-b border-slate-700/30 bg-[#121519]/50 flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                              Expert Deliberation Channel
                            </span>
                            {isOwner && contributions.filter(c => c.status === 'pending').length > 0 && (
                              <span className="text-[8px] bg-red-500/20 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full font-black uppercase shadow-lg shadow-red-900/20">Action Required: {contributions.filter(c => c.status === 'pending').length} New</span>
                            )}
                          </div>

                          {!isOwner && (
                            <div className="p-6 border-b border-slate-800/50 bg-[#121519]/30">
                              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Contribute Perspective</h4>
                              <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row gap-4">
                                  {!isAnonymous && (
                                    <input 
                                      type="text"
                                      placeholder="Your Name (Required)"
                                      value={contributionName}
                                      onChange={(e) => setContributionName(e.target.value)}
                                      className="flex-1 bg-[#1A1D21] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-indigo-500 transition-all shadow-inner"
                                      required
                                    />
                                  )}
                                  {user && (
                                    <div className="flex items-center gap-3 bg-[#1A1D21] border border-slate-700 rounded-xl px-4 py-2 shadow-inner">
                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Anonymous</span>
                                      <button 
                                        onClick={() => setIsAnonymous(!isAnonymous)}
                                        className={`w-10 h-5 rounded-full transition-all relative ${isAnonymous ? 'bg-indigo-600' : 'bg-slate-800'}`}
                                      >
                                        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isAnonymous ? 'left-6' : 'left-1'}`} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {(['variable', 'risk', 'alternative'] as const).map(t => (
                                    <button
                                      key={t}
                                      onClick={() => setContributionType(t)}
                                      className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                                        contributionType === t 
                                          ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' 
                                          : 'bg-slate-900 text-slate-500 border-slate-800 hover:border-slate-700'
                                      }`}
                                    >
                                      {t === 'risk' ? '🚩 Risk' : t === 'variable' ? '🧩 Variable' : '💡 Alternative'}
                                    </button>
                                  ))}
                                </div>
                                <textarea 
                                  placeholder="Share your insight, risk observation, or alternative path..."
                                  value={contributionContent}
                                  onChange={(e) => setContributionContent(e.target.value)}
                                  className="w-full bg-[#1A1D21] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-indigo-500 transition-all min-h-[100px] resize-none shadow-inner"
                                />
                                <button
                                  onClick={() => handleSubmitContribution(contributionName, contributionContent, contributionType, isAnonymous)}
                                  disabled={!contributionContent.trim() || isContributing || (!isAnonymous && !contributionName.trim())}
                                  className={`w-full py-4 rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl flex items-center justify-center gap-3 ${
                                    !contributionContent.trim() || isContributing || (!isAnonymous && !contributionName.trim())
                                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20 active:scale-[0.98]'
                                  }`}
                                >
                                  {isContributing ? "Transmitting..." : "Submit Perspective"}
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="divide-y divide-slate-800/30 max-h-[400px] overflow-y-auto custom-scrollbar text-left">
                            {contributions.filter(c => isOwner || c.status === 'accepted').map((c) => (
                              <div key={c.id} onClick={() => isOwner && toggleContributionSelection(c.id)} className={`flex gap-4 p-5 transition-all text-left ${isOwner ? 'cursor-pointer hover:bg-[#222529]' : ''} ${selectedContributionIds.includes(c.id) ? 'bg-indigo-500/5 border-l-4 border-l-indigo-500 shadow-inner shadow-indigo-900/10' : 'border-l-4 border-l-transparent'} ${c.status === 'accepted' ? 'bg-indigo-500/5' : ''}`}>
                                <div className="shrink-0 pt-1 text-left"><div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-xs border border-slate-700 shadow-inner">{(c.name?.[0] || 'E').toUpperCase()}</div></div>
                                <div className="flex-1 min-w-0 text-left">
                                  <div className="flex items-baseline gap-2 mb-1 text-left"><span className="font-bold text-sm text-slate-200">{c.name}</span><span className="text-[9px] text-slate-600 font-medium opacity-60">{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>{c.status === 'accepted' && <span className="text-[7px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 rounded uppercase font-black tracking-widest shadow-inner">Incorporated</span>}</div>
                                  <div className="mb-2 text-left"><span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border shadow-sm ${c.type === 'risk' ? 'bg-red-500/10 text-red-400 border-red-500/20' : c.type === 'variable' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{c.type === 'risk' ? '🚩 Risk' : c.type === 'variable' ? '🧩 Variable' : '💡 Alternative'}</span></div>
                                  <p className="text-slate-300 text-sm leading-relaxed text-left opacity-90">{c.content}</p>
                                  {isOwner && (
                                    <div className="mt-3 flex items-center gap-2 text-left"><div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${selectedContributionIds.includes(c.id) ? 'bg-indigo-500 border-indigo-400 scale-110' : 'border-slate-700 hover:border-slate-500 shadow-inner'}`}>{selectedContributionIds.includes(c.id) && <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}</div><span className={`text-[8px] font-black uppercase tracking-widest ${selectedContributionIds.includes(c.id) ? 'text-indigo-400' : 'text-slate-600'}`}>{selectedContributionIds.includes(c.id) ? 'Selected for Council Update' : 'Select to Incorporate'}</span></div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          {isOwner && selectedContributionIds.length > 0 && (
                            <div className="p-4 bg-[#121519]/50 border-t border-slate-700/30 flex items-center justify-between gap-4 text-left">
                              <div className="flex items-center gap-3"><div className="flex flex-col"><span className="text-xs font-bold text-slate-300">Sync Status</span><span className="text-[8px] text-slate-600 uppercase font-black tracking-widest">Update contributor feeds</span></div><button onClick={() => setNotifyContributors(!notifyContributors)} className={`w-10 h-5 rounded-full transition-all relative ${notifyContributors ? 'bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-slate-700 shadow-inner'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${notifyContributors ? 'left-6' : 'left-1'}`} /></button></div>
                              <button onClick={handleIncorporatePeerSynthesis} disabled={isPeerSynthesizing} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-xl transition-all shadow-xl shadow-indigo-900/30 active:scale-[0.98]">{isPeerSynthesizing ? "Re-Synthesizing..." : `Update verdict with ${selectedContributionIds.length} Insights`}</button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-left">
                    <AgentCard role="Analyst" agent={result?.analyst} color="blue" isLoading={!result?.analyst} />
                    <AgentCard role="Strategist" agent={result?.strategist} color="purple" isLoading={!result?.strategist} />
                    <AgentCard role="Skeptic" agent={result?.skeptic} color="red" isLoading={!result?.skeptic} />
                    <AgentCard role="Mediator" agent={result?.mediator} color="emerald" isLoading={!result?.mediator} />
                  </div>
                  {isOwner && (<div className="pt-8 pb-20 border-t border-slate-800/50 mt-12 text-left"><CommitmentPanel options={inputValues.options} refinedPaths={result.synthesis?.refinedPaths} onCommit={handleCommitment} onBranch={handleBranch} onConsult={() => setIsChatOpen(true)} coreInquiry={inputValues.title} existingCommitment={currentSessionId ? sessions.find(s => s.id === currentSessionId)?.commitment : undefined} /></div>)}
                </div>
              )}
              {status === AnalysisStatus.IDLE && (
                <div className="h-full flex flex-col items-center justify-center p-8 lg:p-20 text-center animate-fade-in text-left">
                  <div className="relative mb-12"><div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full"></div><div className="relative bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl flex items-center justify-center gap-6"><div className="flex -space-x-4 text-left"><div className="w-16 h-16 rounded-full border-4 border-slate-900 bg-blue-900/20 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-900/20"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg></div><div className="w-16 h-16 rounded-full border-4 border-slate-900 bg-purple-900/20 flex items-center justify-center text-purple-400 shadow-lg shadow-purple-900/20"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg></div><div className="w-16 h-16 rounded-full border-4 border-slate-900 bg-red-900/20 flex items-center justify-center text-red-400 shadow-lg shadow-red-900/20"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div><div className="w-16 h-16 rounded-full border-4 border-slate-900 bg-emerald-900/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-900/20"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div></div></div></div>
                  <h2 className="text-4xl font-black text-white mb-6 tracking-tight uppercase shadow-indigo-500/10 drop-shadow-2xl">Council Intelligence</h2>
                  <p className="text-lg text-slate-400 max-w-lg mx-auto leading-relaxed mb-12">Submit strategic inquiries for multi-agent archetypal deliberation.</p>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl text-left">{UI_CONTENT.IDLE.AGENTS.map(agent => (<div key={agent.name} className="p-4 rounded-2xl bg-slate-900/40 border border-slate-800/50 text-left hover:border-indigo-500/30 transition-colors shadow-inner"><div className={`text-xs font-black uppercase tracking-widest mb-1 ${agent.color}`}>{agent.name}</div><div className="text-[10px] text-slate-500 font-medium leading-relaxed">{agent.desc}</div></div>))}</div>
                </div>
              )}
            </div>
          }
        />
      </main>
      {isChatOpen && result && <CouncilChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} councilResult={result} input={inputValues} chatHistory={chatHistory} onUpdateHistory={setChatHistory} onReAnalyze={(newCtx) => handleAnalysis({...inputValues, context: inputValues.context + newCtx})} />}
      {currentPlan && (<ActionPlanModal isOpen={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} onSave={handleSavePlan} plan={currentPlan} />)}
      {isTreeOpen && (<DecisionTreeViz problemTitle={inputValues.title} councilResult={result || undefined} initialTree={currentSessionId ? sessions.find(s => s.id === currentSessionId)?.decisionTree : undefined} onSave={handleSaveTree} onClose={() => setIsTreeOpen(false)} />)}
      <NotificationFeed isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} notifications={notifications} onMarkRead={handleMarkNotificationRead} onDismiss={handleDismissNotification} onNavigate={handleNavigateFromNotification} />
      <CollaborationModal 
        isOpen={isCollaborationModalOpen} 
        onClose={() => setIsCollaborationModalOpen(false)} 
        session={sessions.find(s => s.id === currentSessionId) || null}
        contributions={contributions}
        onSynthesize={handleIncorporatePeerSynthesis}
        isSynthesizing={isPeerSynthesizing}
        isOwner={isOwner}
        onSubmitContribution={handleSubmitContribution}
        isContributing={isContributing}
        isAuthenticated={!!user}
      />
    </div>
  );
};

const App: React.FC = () => (<ErrorBoundary><DecidrApp /></ErrorBoundary>);
export default App;

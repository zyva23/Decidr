import React, { useState, useEffect } from 'react';
import { DecisionSession, UserProfile, Contribution } from '../types';
import { getSessionContributions } from '../services/googleCloud';

interface Props {
  isOpen: boolean;
  sessions: DecisionSession[];
  currentSessionId: string | null;
  user: UserProfile | null;
  onSelectSession: (session: DecisionSession) => void;
  onNewSession: () => void;
  onClose: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onSignOut: () => void;
}

const SessionHistory: React.FC<Props> = ({ 
  isOpen, 
  sessions, 
  currentSessionId, 
  user,
  onSelectSession, 
  onNewSession,
  onClose,
  onDeleteSession,
  onSignOut
}) => {
  const [activeTab, setActiveTab] = useState<'personal' | 'shared'>('personal');
  const [liveCounts, setLiveCounts] = useState<Record<string, number>>({});

  // Fetch live counts for shared sessions when panel opens
  useEffect(() => {
    if (isOpen) {
      const fetchAllCounts = async () => {
        const counts: Record<string, number> = {};
        const shared = sessions.filter(s => s.isPublic);
        await Promise.all(shared.map(async (s) => {
          const contributions = await getSessionContributions(s.id);
          // Only count contributions that are NOT 'thought' (which are self/council refined)
          const peerOnly = contributions.filter(c => c.type !== 'thought');
          counts[s.id] = peerOnly.length;
        }));
        setLiveCounts(counts);
      };
      fetchAllCounts();
    }
  }, [isOpen, sessions]);

  const personalSessions = sessions.filter(s => !s.isPublic);
  const sharedSessions = sessions.filter(s => s.isPublic);

  const renderSessionItem = (session: DecisionSession) => {
    const contributionCount = liveCounts[session.id] ?? (session.contributions?.length || 0);
    const hasUnreadContributions = session.contributions?.some(c => c.status === 'pending');

    return (
      <div 
        key={session.id}
        onClick={() => {
          onSelectSession(session);
          if (window.innerWidth < 1024) onClose();
        }}
        className={`group relative p-3 rounded-lg cursor-pointer border transition-all duration-200 ${
          currentSessionId === session.id 
            ? 'bg-slate-800 border-indigo-500/50 shadow-md ring-1 ring-indigo-500/20' 
            : 'bg-transparent border-transparent hover:bg-slate-900 hover:border-slate-800'
        }`}
      >
        <div className="pr-6">
           <h3 className={`text-sm font-medium truncate mb-1 ${currentSessionId === session.id ? 'text-indigo-300' : 'text-slate-300 group-hover:text-white'}`}>
            {session.input.title || "Untitled Decision"}
           </h3>
           <div className="flex flex-wrap items-center gap-2">
             <span className={`text-[10px] ${currentSessionId === session.id ? 'text-slate-400' : 'text-slate-500'}`}>
               {new Date(session.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
             </span>
             
             {session.isPublic && (
               <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-sm border border-indigo-500/20">
                 Shared
               </span>
             )}

             {contributionCount > 0 && (
               <span className={`flex items-center gap-1 text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-sm border ${hasUnreadContributions ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' : 'text-slate-400 bg-slate-800 border-slate-700'}`}>
                 {contributionCount} {contributionCount === 1 ? 'Peer Insight' : 'Peer Insights'}
               </span>
             )}

             {session.commitment && (
               <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm border border-emerald-500/20">
                 Locked
               </span>
             )}
           </div>
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Delete this inquiry history?")) {
              onDeleteSession(session.id, e);
            }
          }}
          className="absolute right-2 top-3 p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all rounded-md lg:opacity-0 group-hover:opacity-100"
          title="Delete Session"
        >
           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[40] block"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none" />
        </div>
      )}

      {/* Sidebar Panel */}
      <div className={`fixed top-0 left-0 bottom-0 w-80 bg-slate-950 border-r border-slate-800 z-[50] transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            <h2 className="text-lg font-bold text-white tracking-tight">History</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex p-1 bg-slate-900 mx-4 mt-4 rounded-xl border border-slate-800">
          <button 
            onClick={() => setActiveTab('personal')}
            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'personal' ? 'bg-slate-800 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Personal ({personalSessions.length})
          </button>
          <button 
            onClick={() => setActiveTab('shared')}
            className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'shared' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Shared ({sharedSessions.length})
          </button>
        </div>

        {/* New Session Button */}
        <div className="p-4">
          <button
            onClick={() => {
              onNewSession();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full py-3 px-4 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all border border-indigo-500/20 active:scale-[0.98]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            New Analysis
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2 custom-scrollbar">
          {activeTab === 'personal' ? (
            personalSessions.length === 0 ? (
              <div className="py-10 text-center text-slate-600 text-xs italic">No personal inquiries found.</div>
            ) : personalSessions.map(renderSessionItem)
          ) : (
            sharedSessions.length === 0 ? (
              <div className="py-10 text-center text-slate-600 text-xs italic px-4">No shared deliberations yet. Toggle "Public Access" on an analysis to collaborate.</div>
            ) : sharedSessions.map(renderSessionItem)
          )}
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 p-2 rounded-xl transition-colors group">
             <div className="flex items-center gap-3 overflow-hidden">
                <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-500/20">
                    {user?.email?.[0].toUpperCase() || "G"}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full"></div>
                </div>
                
                <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate">{user?.email || "Guest Session"}</h4>
                <p className="text-[10px] text-slate-500 truncate uppercase tracking-tighter font-black">Strategic Observer</p>
                </div>
             </div>

             <button 
                onClick={onSignOut}
                className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                title="Sign Out"
             >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
             </button>
          </div>
        </div>

      </div>
    </>
  );
};

export default SessionHistory;

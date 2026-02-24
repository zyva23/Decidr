import React from 'react';
import { DecisionSession, UserProfile } from '../types';

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
  return (
    <>
      {/* Backdrop for Mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40] lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div className={`fixed top-0 left-0 bottom-0 w-80 bg-slate-950 border-r border-slate-800 z-[50] transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            <h2 className="text-lg font-bold text-white tracking-tight">History</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close sidebar"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* New Session Button */}
        <div className="p-4">
          <button
            onClick={() => {
              onNewSession();
              if (window.innerWidth < 1024) onClose();
            }}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/20 active:scale-[0.98] border border-indigo-400/20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            New Analysis
          </button>
        </div>

        {/* Session List */}
        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2 custom-scrollbar">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-6">
              <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center mb-3 text-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              </div>
              <p className="text-slate-500 text-sm">No saved sessions found.</p>
              <p className="text-slate-600 text-xs mt-1">Your decision history will appear here.</p>
            </div>
          ) : (
            <>
               <div className="px-3 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Recent</div>
               {sessions.map(session => (
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
                     <div className="flex items-center gap-2">
                       <span className={`text-[10px] ${currentSessionId === session.id ? 'text-slate-400' : 'text-slate-500'}`}>
                         {new Date(session.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                       </span>
                       {session.status === 'COMPLETE' && (
                         <span className="flex items-center gap-1 text-[10px] text-emerald-500/80 bg-emerald-500/10 px-1.5 rounded-sm">
                           Completed
                         </span>
                       )}
                     </div>
                  </div>

                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession(session.id, e);
                    }}
                    className="absolute right-2 top-3 p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity rounded hover:bg-slate-800"
                    title="Delete Session"
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              ))}
            </>
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

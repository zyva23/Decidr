import React from 'react';
import { Notification } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onNavigate: (sessionId: string, notificationId: string) => void;
}

const NotificationFeed: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  notifications, 
  onMarkRead, 
  onDismiss, 
  onNavigate 
}) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div className={`fixed top-0 right-0 bottom-0 w-80 sm:w-96 bg-slate-950 border-l border-slate-800 z-[110] transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Intelligence Feed</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Strategic Alerts</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {notifications.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50 px-8">
              <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              </div>
              <p className="text-sm font-medium text-slate-400">Clear horizon.</p>
              <p className="text-xs text-slate-600 mt-1">No active reminders or peer insights at this time.</p>
            </div>
          ) : (
            notifications.sort((a, b) => b.timestamp - a.timestamp).map((n) => (
              <div 
                key={n.id}
                className={`relative p-4 rounded-2xl border transition-all ${
                  n.read ? 'bg-slate-900/30 border-slate-800/50' : 'bg-slate-900 border-slate-700 shadow-lg'
                }`}
              >
                {!n.read && (
                  <div className="absolute top-4 right-4 w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                )}
                
                <div className="flex items-start gap-3 mb-2">
                  <div className={`mt-1 p-1.5 rounded-lg ${
                    n.intensity === 'high' ? 'bg-red-500/20 text-red-400' :
                    n.intensity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-indigo-500/20 text-indigo-400'
                  }`}>
                    {n.type === 'commitment_nudge' && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>}
                    {n.type === 'peer_contribution' && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
                    {n.type === 'download_reminder' && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>}
                    {n.type === 'system' && <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>}
                  </div>
                  <div className="flex-1 pr-4">
                    <h4 className={`text-sm font-bold ${n.read ? 'text-slate-400' : 'text-white'}`}>{n.title}</h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">{n.message}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-800/50">
                  <span className="text-[10px] text-slate-600 font-medium">
                    {new Date(n.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onDismiss(n.id)}
                      className="p-1.5 text-slate-600 hover:text-slate-400 transition-colors"
                      title="Dismiss"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    {n.linkSessionId && (
                      <button 
                        onClick={() => onNavigate(n.linkSessionId!, n.id)}
                        className="px-3 py-1 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all"
                      >
                        Review
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <p className="text-[9px] text-slate-600 text-center uppercase tracking-widest font-bold">
            Decision Integrity Monitor Active
          </p>
        </div>
      </div>
    </>
  );
};

export default NotificationFeed;

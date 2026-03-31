import React, { useState } from 'react';
import { toggleSessionPublic } from '../services/googleCloud';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  isPublicInitial: boolean;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, sessionId, isPublicInitial }) => {
  const [isPublic, setIsPublic] = useState(isPublicInitial);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const shareUrl = `${window.location.origin}/?share=${sessionId}`;

  const handleToggle = async () => {
    const newVal = !isPublic;
    setIsPublic(newVal);
    await toggleSessionPublic(sessionId, newVal);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-md w-full shadow-2xl animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">Share Deliberation</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          Enable a public link to allow others to view this council's verdict and contribute their own "Human Perspective."
        </p>

        <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl mb-6">
          <span className="text-sm font-bold text-slate-300">Public Access</span>
          <button 
            onClick={handleToggle}
            className={`w-12 h-6 rounded-full transition-all relative ${isPublic ? 'bg-indigo-600' : 'bg-slate-700'}`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isPublic ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        {isPublic && (
          <div className="animate-fade-in">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Shareable Link</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly 
                value={shareUrl} 
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-indigo-300 outline-none"
              />
              <button 
                onClick={copyToClipboard}
                className={`px-4 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${copied ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'}`}
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        <button 
          onClick={onClose}
          className="w-full mt-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-sm transition-all"
        >
          Done
        </button>
      </div>
    </div>
  );
};

export default ShareModal;

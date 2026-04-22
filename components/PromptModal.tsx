import React from 'react';

interface PromptModalProps {
  isOpen: boolean;
  type: 'alert' | 'confirm' | 'success';
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  extraLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  onExtraAction?: () => void;
  editableValue?: string;
  onValueChange?: (value: string) => void;
}

const PromptModal: React.FC<PromptModalProps> = ({
  isOpen,
  type,
  title,
  message,
  confirmLabel = 'Acknowledge',
  cancelLabel = 'Cancel',
  extraLabel,
  onConfirm,
  onCancel,
  onExtraAction,
  editableValue,
  onValueChange
}) => {
  if (!isOpen) return null;

  const isConfirm = type === 'confirm';
  const isSuccess = type === 'success';

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className={`bg-[#1A1D21] border border-slate-700/50 rounded-2xl ${editableValue !== undefined ? 'max-w-lg' : 'max-w-sm'} w-full shadow-2xl overflow-hidden animate-slide-up`}>
        <div className="p-6 text-center">
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center border-2 ${
            isSuccess ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' : 
            isConfirm ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-500' : 
            'bg-amber-500/10 border-amber-500/50 text-amber-500'
          }`}>
            {isSuccess ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            ) : isConfirm ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            )}
          </div>
          
          <h3 className="text-lg font-black text-white uppercase tracking-tighter mb-2 italic">{title}</h3>
          <p className="text-sm text-slate-400 font-medium leading-relaxed mb-4">{message}</p>

          {editableValue !== undefined && onValueChange && (
            <div className="mt-4 text-left">
              <textarea
                value={editableValue}
                onChange={(e) => onValueChange(e.target.value)}
                className="w-full bg-[#121519] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 transition-all min-h-[150px] resize-none shadow-inner"
                autoFocus
              />
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-2 flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                Finalize Intelligence Text
              </p>
            </div>
          )}
        </div>

        <div className="flex border-t border-slate-800/50">
          {isConfirm && (
            <button 
              onClick={onCancel}
              className="flex-1 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 hover:text-white hover:bg-slate-800/50 transition-all border-r border-slate-800/50"
            >
              {cancelLabel}
            </button>
          )}
          {extraLabel && onExtraAction && (
            <button 
              onClick={onExtraAction}
              className="flex-1 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-indigo-400 hover:text-white hover:bg-indigo-600/20 transition-all border-r border-slate-800/50"
            >
              {extraLabel}
            </button>
          )}
          <button 
            onClick={onConfirm}
            className={`flex-1 py-4 text-[9px] font-black uppercase tracking-[0.2em] hover:brightness-110 transition-all ${
              isSuccess ? 'bg-emerald-600 text-white' : 
              isConfirm ? 'bg-indigo-600 text-white' : 
              'bg-amber-600 text-white'
            }`}
          >
            {isConfirm ? (confirmLabel === 'Acknowledge' ? 'Confirm' : confirmLabel) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptModal;

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, CouncilResult, DecisionInput, Contribution } from '../types';
import { chatWithCouncil } from '../services/geminiService';

interface CouncilChatProps {
  isOpen: boolean;
  onClose: () => void;
  councilResult: CouncilResult;
  input: DecisionInput;
  chatHistory: ChatMessage[];
  onUpdateHistory: (msgs: ChatMessage[]) => void;
  onReAnalyze: (newContext: string) => void;
  onSubmitContribution: (name: string, content: string, type: Contribution['type'], isAnonymous: boolean) => Promise<void>;
  onRefineThought: (text: string) => Promise<string>;
  onSynthesizeChatHistory: (messages: ChatMessage[]) => Promise<string>;
  userName: string;
  isUserAuthenticated: boolean;
  showPrompt: (config: any) => void;
}

const CouncilChat: React.FC<CouncilChatProps> = ({ 
  isOpen,
  onClose,
  councilResult, 
  input, 
  chatHistory, 
  onUpdateHistory,
  onReAnalyze,
  onSubmitContribution,
  onRefineThought,
  onSynthesizeChatHistory,
  userName,
  isUserAuthenticated,
  showPrompt
}) => {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPromoting, setIsPromoting] = useState<string | null>(null);
  
  // Confirmation Modal State (Manual Edit Control)
  const [pendingText, setPendingText] = useState('');
  const [lastIncorporatedIndex, setLastIncorporatedIndex] = useState(-1);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [chatHistory, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: inputText,
      timestamp: Date.now()
    };

    const newHistory = [...chatHistory, userMsg];
    onUpdateHistory(newHistory);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await chatWithCouncil(newHistory, inputText, councilResult, input);
      
      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };
      
      onUpdateHistory([...newHistory, aiMsg]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const executeContribution = async (content: string, type: Contribution['type']) => {
    setIsLoading(true);
    try {
      // We pass content as is because it's ALREADY been refined/edited
      await onSubmitContribution(userName, content, type, !isUserAuthenticated);
      showPrompt({
        type: 'success',
        title: 'Intelligence Integrated',
        message: 'Insight has been successfully moved to the Human Intelligence Layer.'
      });
    } catch (err) {
      console.error("Contribution failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromoteToThought = async (content: string, msgId: number) => {
    setIsPromoting(msgId.toString());
    try {
      // 1. First, get AI Refinement
      const refined = await onRefineThought(content);
      
      // 2. Then show the modal with refined text
      let currentVal = refined;
      showPrompt({
        type: 'confirm',
        title: 'Review Self Thought',
        message: 'The Council has refined your thought into high-fidelity intelligence. Review and polish before integrating.',
        confirmLabel: 'Incorporate',
        editableValue: refined,
        onValueChange: (val) => { currentVal = val; },
        onConfirm: () => {
          executeContribution(currentVal, 'thought');
        }
      });
    } catch (err) {
      console.error("Refinement failed:", err);
    } finally {
      setIsPromoting(null);
    }
  };

  const handleBatchIncorporate = async () => {
    // Only get user messages AFTER the last incorporated index
    const userMessages = chatHistory.slice(lastIncorporatedIndex + 1).filter(m => m.role === 'user');
    if (userMessages.length === 0) return;

    setIsLoading(true);
    try {
      // 1. Get AI Synthesis for the specific history window
      const refined = await onSynthesizeChatHistory(chatHistory.slice(lastIncorporatedIndex + 1));
      
      // 2. Show modal with synthesized text
      let currentVal = refined;
      showPrompt({
        type: 'confirm',
        title: 'Unified Batch Integration',
        message: 'The Council has synthesized your NEW chat points into high-fidelity intelligence. Review and polish before integrating.',
        confirmLabel: 'Integrate New',
        editableValue: refined,
        onValueChange: (val) => { currentVal = val; },
        onConfirm: async () => {
          await executeContribution(currentVal, 'thought');
          setLastIncorporatedIndex(chatHistory.length - 1);
        }
      });
    } catch (err) {
      console.error("Batch refinement failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const hasNewMessages = chatHistory.slice(lastIncorporatedIndex + 1).some(m => m.role === 'user');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[80vh] animate-fade-in">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg ring-2 ring-slate-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Council Session</h3>
              <p className="text-xs text-slate-400">Interrogate the verdict or provide new data</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {(chatHistory.length > 0) && (
                <button 
                  onClick={handleBatchIncorporate}
                  disabled={!hasNewMessages || isLoading}
                  className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg transition-all border shadow-sm flex items-center gap-2 ${
                    hasNewMessages && !isLoading
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/50" 
                    : "bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-50"
                  }`}
                  title={hasNewMessages ? "Incorporate new chat insights" : "No new user insights to incorporate"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h.01"/><path d="M12 16h.01"/><path d="M12 12h.01"/><path d="M12 8h.01"/><path d="M12 4h.01"/><path d="M8 20h.01"/><path d="M8 16h.01"/><path d="M8 12h.01"/><path d="M8 8h.01"/><path d="M8 4h.01"/><path d="M16 20h.01"/><path d="M16 16h.01"/><path d="M16 12h.01"/><path d="M16 8h.01"/><path d="M16 4h.01"/></svg>
                  <span className="hidden sm:inline">{hasNewMessages ? 'Incorporate Insights' : 'Insights Integrated'}</span>
                </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-950/30 scroll-smooth relative">
          {(isLoading || isPromoting !== null) && (
            <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-8 animate-fade-in text-center">
              <div className="relative w-16 h-16 mb-6">
                <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping opacity-25"></div>
                <div className="relative w-16 h-16 bg-indigo-500/10 border border-indigo-500/30 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.2)]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400 animate-pulse">
                    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] italic">
                  {isPromoting !== null ? "Refining Thought" : "Council Synthesis"}
                </h3>
                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest animate-pulse max-w-xs leading-relaxed">
                  {isPromoting !== null 
                    ? "Architecting high-fidelity strategic thought from your input..." 
                    : "Architecting high-fidelity strategic insight from your deliberation..."}
                </p>
              </div>
            </div>
          )}

          {chatHistory.length === 0 && (
            <div className="text-center py-20 text-slate-500">
              <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                 <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              </div>
              <p className="text-sm font-medium text-slate-400">The Council is seated.</p>
              <p className="text-xs mt-2 max-w-xs mx-auto">Ask the Chairperson about specific risks, request clarification on the ROI, or introduce new constraints.</p>
            </div>
          )}
          
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm relative group ${
                msg.role === 'user' 
                  ? 'bg-indigo-600/20 text-indigo-100 border border-indigo-500/20 rounded-tr-none' 
                  : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-none'
              }`}>
                {msg.role === 'assistant' && (
                  <div className="text-[10px] font-bold uppercase text-slate-500 mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> Chairperson
                  </div>
                )}
                <div className="whitespace-pre-wrap">{msg.content}</div>
                
                {msg.role === 'user' && (
                  <button 
                    onClick={() => handlePromoteToThought(msg.content, idx)}
                    disabled={isPromoting === idx.toString()}
                    className="absolute -left-12 top-0 p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-indigo-400 hover:border-indigo-500/50 opacity-0 group-hover:opacity-100 transition-all shadow-xl"
                    title="Incorporate as Self Thought"
                  >
                    {isPromoting === idx.toString() ? (
                      <div className="w-4 h-4 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.48Z"/><path d="M10.5 7.5h.01"/><path d="M13.5 12h.01"/><path d="M8 15h.01"/><path d="M13.5 17h.01"/></svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-75"></span>
                <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce delay-150"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 bg-slate-900 border-t border-slate-800 shrink-0">
          <div className="relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Question the verdict or add new info..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-4 pl-5 pr-14 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 shadow-inner"
              disabled={isLoading}
              autoFocus
            />
            <button 
              type="submit" 
              disabled={!inputText.trim() || isLoading}
              className="absolute right-2 top-2 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CouncilChat;
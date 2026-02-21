import React, { useState, useEffect } from 'react';
import { DecisionInput, BrainstormResult } from '../types';
import { exploreBrainstorm } from '../services/geminiService';
import DocumentUpload from './DocumentUpload';

interface InputFormProps {
  initialValues: DecisionInput;
  onSubmit: (input: DecisionInput) => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ initialValues, onSubmit, isLoading }) => {
  const [input, setInput] = useState<DecisionInput>(initialValues);

  // Sync state when initialValues change (e.g. loading a history item)
  useEffect(() => {
    setInput(initialValues);
  }, [initialValues]);

  // Voice Input State
  const [listeningField, setListeningField] = useState<keyof DecisionInput | null>(null);

  // Brainstorming State
  const [activeBrainstorm, setActiveBrainstorm] = useState<'constraints' | 'options' | 'context' | null>(null);
  const [brainstormLoading, setBrainstormLoading] = useState(false);
  const [brainstormData, setBrainstormData] = useState<BrainstormResult | null>(null);

  // Check if context is ready for AI features
  // Title is enough to start asking for context help
  const isTitleReady = input.title.trim().length > 3;
  // Full context needed for constraints/options
  const isContextReady = isTitleReady && input.context.trim().length > 10;

  const [loadingStage, setLoadingStage] = useState(0);

  const handleDocumentUpload = (extractedText: string) => {
    setInput(prev => ({
      ...prev,
      context: prev.context ? `${prev.context}\n\n${extractedText}` : extractedText
    }));
  };

  const stages = [
    "Convening the Council...",
    "Analyzing Financials (Analyst)...",
    "Mapping Strategy (Strategist)...",
    "Evaluating Risks (Skeptic)...",
    "Reviewing Ethics (Mediator)...",
    "Synthesizing Verdict..."
  ];

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setLoadingStage(0);
      interval = setInterval(() => {
        setLoadingStage(prev => (prev + 1) % stages.length);
      }, 2500);
    } else {
      setLoadingStage(0);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.title && input.context) {
      onSubmit(input);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // --- Voice Input Logic ---
  const handleVoiceInput = (field: keyof DecisionInput) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Your browser does not support voice input.");
      return;
    }

    if (listeningField === field) {
      // Stop listening if clicked again
      setListeningField(null);
      return;
    }

    // @ts-ignore - Types for webkitSpeechRecognition are not standard in all envs
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setListeningField(field);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => {
        const current = prev[field];
        // Append if text exists, otherwise replace
        const newValue = current ? `${current} ${transcript}` : transcript;
        return { ...prev, [field]: newValue };
      });
      setListeningField(null);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setListeningField(null);
    };

    recognition.onend = () => {
      setListeningField(null);
    };

    recognition.start();
  };

  // --- Brainstorm Logic ---
  const handleBrainstorm = async (field: 'constraints' | 'options' | 'context') => {
    if (field === 'context') {
      if (!isTitleReady) return;
    } else {
      if (!isContextReady) return;
    }

    if (activeBrainstorm === field) {
      setActiveBrainstorm(null);
      setBrainstormData(null);
      return;
    }

    setActiveBrainstorm(field);
    setBrainstormLoading(true);
    setBrainstormData(null);

    try {
      const result = await exploreBrainstorm(field, input.title, input.context);
      setBrainstormData(result);
    } catch (e) {
      console.error(e);
      setActiveBrainstorm(null);
    } finally {
      setBrainstormLoading(false);
    }
  };

  const addSuggestion = (suggestion: string) => {
    if (!activeBrainstorm) return;
    
    const currentVal = input[activeBrainstorm];
    const separator = currentVal.trim().length > 0 ? '\n• ' : '• ';
    const newVal = currentVal + separator + suggestion;
    
    setInput(prev => ({ ...prev, [activeBrainstorm]: newVal }));
  };

  const addQuestionAsInput = (question: string) => {
      if (activeBrainstorm !== 'context') return;
      
      const currentVal = input.context;
      const separator = currentVal.trim().length > 0 ? '\n\n' : '';
      const newVal = currentVal + separator + `Q: ${question}\nA: `;
      
      setInput(prev => ({ ...prev, context: newVal }));
  };

  // Helper for Input Wrapper
  const renderInputWrapper = (
    field: keyof DecisionInput,
    label: string,
    component: React.ReactNode,
    hasAI: boolean = false,
    aiIconType: 'sparkle' | 'question' = 'sparkle'
  ) => {
    const isListening = listeningField === field;
    const isAiActive = activeBrainstorm === field;
    
    // Determine if AI button should be enabled
    const isAiEnabled = field === 'context' ? isTitleReady : isContextReady;
    const aiTooltip = isAiEnabled 
      ? (field === 'context' ? "Ask AI for clarifying questions" : "Explore ideas with AI")
      : (field === 'context' ? "Enter a Title to enable AI help" : "Fill Title & Context to enable AI");

    return (
      <div className="relative group w-full">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1">
          {label}
        </label>
        
        <div className="relative">
          {component}
          
          {/* Action Buttons Container */}
          <div className="absolute right-3 bottom-3 flex items-center gap-2 z-10">
            
            {/* AI Brainstorm Button */}
            {hasAI && (
              <button
                type="button"
                onClick={() => handleBrainstorm(field as any)}
                disabled={!isAiEnabled}
                title={aiTooltip}
                className={`p-1.5 rounded-full transition-all duration-300 backdrop-blur-md border ${
                  isAiActive 
                    ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]' 
                    : isAiEnabled
                      ? 'bg-slate-800/80 text-indigo-400 border-slate-600 hover:bg-indigo-500 hover:text-white hover:border-indigo-400'
                      : 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
                }`}
              >
                {aiIconType === 'question' ? (
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                ) : (
                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                )}
              </button>
            )}

            {/* Mic Button */}
            <button
              type="button"
              onClick={() => handleVoiceInput(field)}
              className={`p-1.5 rounded-full transition-all duration-300 backdrop-blur-md border ${
                isListening 
                  ? 'bg-red-500 text-white border-red-400 animate-pulse' 
                  : 'bg-slate-800/80 text-slate-400 border-slate-600 hover:text-white hover:border-slate-400'
              }`}
            >
              {isListening ? (
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              )}
            </button>
          </div>
        </div>

        {/* AI Panel Render */}
        {hasAI && activeBrainstorm === field && (
          <div className="mt-3 p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-lg animate-fade-in relative shadow-inner">
             <button 
                onClick={() => { setActiveBrainstorm(null); setBrainstormData(null); }}
                className="absolute top-2 right-2 text-indigo-400/50 hover:text-indigo-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>

            {brainstormLoading ? (
              <div className="flex items-center gap-3 text-indigo-300 py-4 justify-center">
                <div className="relative w-4 h-4">
                  <div className="absolute inset-0 bg-indigo-400 rounded-full animate-ping opacity-75"></div>
                  <div className="relative w-4 h-4 bg-indigo-500 rounded-full"></div>
                </div>
                <span className="text-sm font-medium">Consulting strategy engine...</span>
              </div>
            ) : brainstormData ? (
              <div className="space-y-4">
                {/* Questions Section */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase text-indigo-400 mb-2 tracking-wider">
                     {field === 'context' ? 'Clarifying Questions' : 'Strategic Considerations'}
                  </h4>
                  <ul className="list-disc list-outside ml-4 space-y-2">
                    {brainstormData.questions.map((q, i) => (
                      <li 
                        key={i} 
                        className={`text-sm text-slate-300 italic leading-relaxed ${field === 'context' ? 'cursor-pointer hover:text-white hover:underline decoration-indigo-500/50' : ''}`}
                        onClick={() => field === 'context' && addQuestionAsInput(q)}
                        title={field === 'context' ? "Click to add this question to your context" : ""}
                      >
                        {q}
                      </li>
                    ))}
                  </ul>
                  {field === 'context' && (
                      <p className="text-[10px] text-slate-500 mt-2 text-right">Click a question to add it above</p>
                  )}
                </div>
                
                {/* Suggestions Section */}
                <div>
                  <h4 className="text-[10px] font-bold uppercase text-indigo-400 mb-2 tracking-wider">
                    {field === 'context' ? 'Recommended Topics' : 'Suggested Additions'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {brainstormData.suggestions.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => addSuggestion(s)}
                        className="text-xs text-left bg-slate-800/80 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-400 text-slate-200 py-1.5 px-3 rounded-md transition-all duration-200 active:scale-95"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
               <div className="text-red-400 text-sm">Unavailable. Please try again.</div>
            )}
          </div>
        )}
      </div>
    );
  };

  const templates = [
    { 
      label: 'New Role', 
      title: 'Accepting a Senior PM Offer at a Stealth Startup', 
      context: 'Currently at a Big Tech firm with stability. The startup offers more equity and ownership but has higher risk and longer hours.',
      constraints: 'Need to decide by Friday. Financial runway: 12 months.',
      options: 'A: Stay at current job. B: Accept the startup offer. C: Negotiate for a 4-day week at current job.'
    },
    { 
      label: 'New Friends', 
      title: 'Joining a High-Intensity Run Club', 
      context: 'I want to expand my social circle and get fitter, but I am worried about the time commitment and my current fitness level.',
      constraints: 'Meets at 6 AM, 3 times a week. I am not a morning person.',
      options: 'A: Join the club and commit. B: Look for a more casual group. C: Start solo training first.'
    },
    { 
      label: 'Ask Out', 
      title: 'Asking a Long-time Friend on a Date', 
      context: 'We have been friends for 2 years. I have developed feelings, but I do not want to ruin the friendship if it is not mutual.',
      constraints: 'We are in the same tight-knit friend group. High social stakes.',
      options: 'A: Be direct and ask them out. B: Test the waters with more flirting. C: Keep the status quo.'
    },
    { 
      label: 'Hiring', 
      title: 'Hiring a VP of Engineering', 
      context: 'We are a Series A startup scaling from 10 to 50 engineers. We need someone with high-growth experience who can maintain culture.',
      constraints: 'Budget: $250k total comp. Time: Need someone in 3 months.',
      options: 'A: Promote from within. B: Hire an external veteran. C: Use a fractional leader.'
    },
    { 
      label: 'Tech Stack', 
      title: 'Switching to Microservices', 
      context: 'Current monolith is becoming hard to maintain. Deployments are slow and risky.',
      constraints: 'Team size: 12 devs. Existing debt: High.',
      options: 'A: Incremental migration. B: Complete rewrite. C: Optimize existing monolith.'
    },
    { 
      label: 'Strategy', 
      title: 'Entering the EU Market', 
      context: 'Strong growth in US/UK. Seeing organic traffic from Germany and France.',
      constraints: 'GDPR compliance is mandatory. Limited local support staff.',
      options: 'A: Direct entry (Berlin office). B: Partnership with local distributor. C: Remote digital-only approach.'
    }
  ];

  const applyTemplate = (t: any) => {
    setInput({
      title: t.title,
      context: t.context,
      constraints: t.constraints,
      options: t.options
    });
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="12" x2="12" y1="18" y2="12"/><line x1="9" x2="15" y1="15" y2="15"/></svg>
            Decision Brief
          </h2>
          {isContextReady && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">
              Ready
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] font-bold uppercase text-slate-500 mr-1 mt-1.5">Examples:</span>
          {templates.map(t => (
            <button
              key={t.label}
              type="button"
              onClick={() => applyTemplate(t)}
              className="text-[10px] bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 text-slate-300 px-2.5 py-1 rounded-full transition-all"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {renderInputWrapper(
          'title',
          'Decision Title',
          <input
            type="text"
            name="title"
            value={input.title}
            onChange={handleChange}
            placeholder="What is the core question?"
            className="w-full bg-slate-950/50 border border-slate-700/60 rounded-xl p-4 pr-16 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-inner font-medium text-lg"
            required
          />
        )}

        {renderInputWrapper(
          'context',
          'Context & Background',
          <textarea
            name="context"
            value={input.context}
            onChange={handleChange}
            rows={5}
            placeholder="Describe the situation, stakeholders, and urgency..."
            className="w-full bg-slate-950/50 border border-slate-700/60 rounded-xl p-4 pb-14 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-inner resize-none leading-relaxed custom-scrollbar"
            required
          />,
          true,
          'question'
        )}

        {/* Removed multi-column grid to prevent squashed inputs on sidebar layout */}
        <div className="grid grid-cols-1 gap-6">
          {renderInputWrapper(
            'constraints',
            'Constraints',
            <textarea
              name="constraints"
              value={input.constraints}
              onChange={handleChange}
              rows={4}
              placeholder="Budget, timeline, legal..."
              className="w-full bg-slate-950/50 border border-slate-700/60 rounded-xl p-4 pb-14 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-inner resize-none text-sm custom-scrollbar"
            />,
            true
          )}

          {renderInputWrapper(
            'options',
            'Options',
            <textarea
              name="options"
              value={input.options}
              onChange={handleChange}
              rows={4}
              placeholder="Option A, Option B..."
              className="w-full bg-slate-950/50 border border-slate-700/60 rounded-xl p-4 pb-14 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-inner resize-none text-sm custom-scrollbar"
            />,
            true
          )}
        </div>

        <div className="pt-2">
          <DocumentUpload onTextExtracted={handleDocumentUpload} />
        </div>

        <button
          type="submit"
          disabled={isLoading || !isContextReady}
          className={`w-full py-4 px-6 rounded-xl font-bold text-lg text-white shadow-xl transition-all duration-300 transform border border-white/10 ${
            isLoading 
              ? 'bg-slate-800 cursor-not-allowed' 
              : !isContextReady 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right hover:scale-[1.01] active:scale-[0.99] shadow-indigo-500/25'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="animate-pulse">{stages[loadingStage]}</span>
            </span>
          ) : (
            'Analyze Decision'
          )}
        </button>
      </form>
    </div>
  );
};

export default InputForm;
import React, { useState, useEffect } from 'react';
import { DecisionInput, BrainstormResult } from '../types';
import { exploreBrainstorm } from '../services/geminiService';
import DocumentUpload from './DocumentUpload';
import { Attachment } from '../types';
import { UI_CONTENT } from '../src/constants/uiContent';

interface InputFormProps {
  initialValues: DecisionInput;
  onSubmit: (input: DecisionInput) => void;
  isLoading: boolean;
}

const InputForm: React.FC<InputFormProps> = ({ initialValues, onSubmit, isLoading }) => {
  const [input, setInput] = useState<DecisionInput>(initialValues);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

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

  const handleDocumentUpload = (newAttachments: Attachment[]) => {
    setAttachments(newAttachments);
  };

  const stages = UI_CONTENT.LOADING_STAGES;

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
      // Combine typed context with extracted document text for the AI
      let finalContext = input.context;
      if (attachments.length > 0) {
        const docsText = attachments.map(a => `[Document: ${a.name}]\n${a.extractedText}`).join("\n\n");
        finalContext = `${finalContext}\n\n--- ATTACHED DOCUMENTS ---\n${docsText}`;
      }
      
      onSubmit({
        ...input,
        context: finalContext
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // --- Voice Input Logic ---
  const handleVoiceInput = (field: keyof DecisionInput) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert(UI_CONTENT.FORM.MESSAGES.VOICE_NOT_SUPPORTED);
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
      ? (field === 'context' ? UI_CONTENT.FORM.TOOLTIPS.AI_CONTEXT : UI_CONTENT.FORM.TOOLTIPS.AI_GENERAL)
      : (field === 'context' ? UI_CONTENT.FORM.TOOLTIPS.AI_DISABLED_TITLE : UI_CONTENT.FORM.TOOLTIPS.AI_DISABLED_GENERAL);

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
      label: 'Leadership', 
      title: 'Succession Planning: Transitioning from Founder to Professional CEO', 
      context: `I have led this organization from inception to 200 employees. While we are profitable, I recognize that my "wartime" founder instincts are beginning to create friction with the "peacetime" operational excellence we now require. I worry that stepping back will dilute the original soul of the company, but staying in the CEO role may bottleneck our next stage of institutional maturity.`,
      constraints: 'Board of Directors expects a 12-month transition plan. I must maintain a majority stake to preserve long-term vision. High internal candidate sensitivity.',
      options: 'Path A: Promote the current COO (Continuity). Path B: Launch an external search for a category-defining veteran (Disruption). Path C: Adopt a Co-CEO model for 18 months (Gradualism).'
    },
    { 
      label: 'Prestige vs. Purpose', 
      title: 'Choosing Between a Big Tech VP Role and a Social Impact Lead Position', 
      context: 'The Big Tech role offers immense leverage, a $1M+ compensation package, and the ability to influence products used by billions. However, the work feels ethically neutral at best. The Social Impact role, at a well-funded non-profit, offers the chance to fix a broken educational system, but with 40% of the pay and significantly more bureaucratic friction. I am navigating the tension between my desire for financial security and my existential need for meaningful contribution.',
      constraints: 'Children starting college in 4 years. Living in a high-cost-of-living urban center. Personal burnout levels are currently moderate.',
      options: 'A: Accept Big Tech (Leverage & Security). B: Accept Social Impact (Meaning & Legacy). C: Big Tech for 2 years, then transition (The "Sabbatical" Strategy).'
    },
    { 
      label: 'Vulnerability', 
      title: 'The Risk of Emotional Disclosure in a Professional-Personal Hybrid Relationship', 
      context: `I have been collaborating with a creative partner for three years. Our professional synergy is the source of our success. I have developed deep feelings for them, but the stakes are high: if I disclose my feelings and they aren't reciprocated, the friction might destroy the creative engine we have built. If I remain silent, the repressed emotion may eventually lead to resentment or an artificial wall between us.`,
      constraints: 'We have a joint contract for a major exhibition in 6 months. We are part of a very small, niche professional community.',
      options: 'A: Radical transparency (The Direct Ask). B: Subtle escalation of intimacy over time (The Test). C: Compartmentalization (Commitment to the Work).'
    },
    { 
      label: 'Market Pivot', 
      title: 'Pivoting from a Service Agency to a Product-Led SaaS Company', 
      context: `Our agency is healthy, but we are trading hours for dollars. We have built an internal tool that solves a recurring pain point for our clients. Pivoting to SaaS offers scalability and higher valuation, but it requires a total shift in DNA—from customer service to product engineering. It means "firing" our current revenue streams to chase a high-margin future that isn't guaranteed.`,
      constraints: 'Current cash runway: 8 months if we stop all agency work. 60% of the team has an agency mindset, not a product mindset.',
      options: 'A: All-in pivot (The Burn the Boats Strategy). B: Run both in parallel (The Slow Transition). C: Sell the agency to fund the SaaS startup.'
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
            {UI_CONTENT.FORM.TITLE}
          </h2>
          {isContextReady && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">
              {UI_CONTENT.FORM.MESSAGES.READY}
            </span>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] font-bold uppercase text-slate-500 mr-1 mt-1.5">{UI_CONTENT.FORM.EXAMPLES_LABEL}</span>
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
          UI_CONTENT.FORM.LABELS.TITLE,
          <input
            type="text"
            name="title"
            value={input.title}
            onChange={handleChange}
            placeholder={UI_CONTENT.FORM.PLACEHOLDERS.TITLE}
            className="w-full bg-slate-950/50 border border-slate-700/60 rounded-xl p-4 pr-16 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-inner font-medium text-lg"
            required
          />
        )}

        <div className="pt-2">
          <DocumentUpload onDocumentsChange={handleDocumentUpload} />
        </div>

        {renderInputWrapper(
          'context',
          UI_CONTENT.FORM.LABELS.CONTEXT,
          <textarea
            name="context"
            value={input.context}
            onChange={handleChange}
            rows={5}
            placeholder={UI_CONTENT.FORM.PLACEHOLDERS.CONTEXT}
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
            UI_CONTENT.FORM.LABELS.CONSTRAINTS,
            <textarea
              name="constraints"
              value={input.constraints}
              onChange={handleChange}
              rows={4}
              placeholder={UI_CONTENT.FORM.PLACEHOLDERS.CONSTRAINTS}
              className="w-full bg-slate-950/50 border border-slate-700/60 rounded-xl p-4 pb-14 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-inner resize-none text-sm custom-scrollbar"
            />,
            true
          )}

          {renderInputWrapper(
            'options',
            UI_CONTENT.FORM.LABELS.OPTIONS,
            <textarea
              name="options"
              value={input.options}
              onChange={handleChange}
              rows={4}
              placeholder={UI_CONTENT.FORM.PLACEHOLDERS.OPTIONS}
              className="w-full bg-slate-950/50 border border-slate-700/60 rounded-xl p-4 pb-14 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-inner resize-none text-sm custom-scrollbar"
            />,
            true
          )}
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
            UI_CONTENT.FORM.BUTTONS.ANALYZE
          )}
        </button>
      </form>
    </div>
  );
};

export default InputForm;

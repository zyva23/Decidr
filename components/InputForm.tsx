import React, { useState, useEffect } from 'react';
import { DecisionInput, BrainstormResult, DecisionSession } from '../types';
import { exploreBrainstorm } from '../services/geminiService';
import DocumentUpload from './DocumentUpload';
import { Attachment } from '../types';
import { UI_CONTENT } from '../src/constants/uiContent';

interface InputFormProps {
  initialValues: DecisionInput;
  onSubmit: (input: DecisionInput) => void;
  isLoading: boolean;
  sessions: DecisionSession[];
}

const InputForm: React.FC<InputFormProps> = ({ initialValues, onSubmit, isLoading, sessions }) => {
  const [input, setInput] = useState<DecisionInput>(initialValues);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showHistoryLink, setShowHistoryLink] = useState(false);

  useEffect(() => { setInput(initialValues); }, [initialValues]);

  const [listeningField, setListeningField] = useState<keyof DecisionInput | null>(null);
  const [activeBrainstorm, setActiveBrainstorm] = useState<'constraints' | 'options' | 'context' | null>(null);
  const [brainstormLoading, setBrainstormLoading] = useState(false);
  const [brainstormData, setBrainstormData] = useState<BrainstormResult | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('Personal');

  const isTitleReady = input.title.trim().length > 3;
  const isContextReady = isTitleReady && input.context.trim().length > 10;

  const [loadingStage, setLoadingStage] = useState(0);
  const handleDocumentUpload = (newAttachments: Attachment[]) => setAttachments(newAttachments);
  const stages = UI_CONTENT.LOADING_STAGES;

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      setLoadingStage(0);
      interval = setInterval(() => { setLoadingStage(prev => (prev + 1) % stages.length); }, 2500);
    } else { setLoadingStage(0); }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.title && input.context) {
      let finalContext = input.context;
      if (attachments.length > 0) {
        const docsText = attachments.map(a => `[Document: ${a.name}]\n${a.extractedText}`).join("\n\n");
        finalContext = `${finalContext}\n\n--- ATTACHED DOCUMENTS ---\n${docsText}`;
      }
      onSubmit({ ...input, context: finalContext });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInput(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleVoiceInput = (field: keyof DecisionInput) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert(UI_CONTENT.FORM.MESSAGES.VOICE_NOT_SUPPORTED);
      return;
    }
    if (listeningField === field) { setListeningField(null); return; }
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onstart = () => setListeningField(field);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => {
        const current = prev[field];
        return { ...prev, [field]: current ? `${current} ${transcript}` : transcript };
      });
      setListeningField(null);
    };
    recognition.onerror = () => setListeningField(null);
    recognition.onend = () => setListeningField(null);
    recognition.start();
  };

  const handleBrainstorm = async (field: 'constraints' | 'options' | 'context') => {
    if (field === 'context' ? !isTitleReady : !isContextReady) return;
    if (activeBrainstorm === field) { setActiveBrainstorm(null); setBrainstormData(null); setCurrentQuestionIndex(0); return; }
    setActiveBrainstorm(field);
    setBrainstormLoading(true);
    setBrainstormData(null);
    setCurrentQuestionIndex(0);
    try {
      const result = await exploreBrainstorm(field, input.title, input.context);
      setBrainstormData(result);
    } catch (e) { console.error(e); setActiveBrainstorm(null); } finally { setBrainstormLoading(false); }
  };

  const selectBrainstormOption = (question: string, option: string) => {
    if (!activeBrainstorm) return;
    const currentVal = input[activeBrainstorm];
    const separator = currentVal.trim().length > 0 ? '\n\n' : '';
    const newVal = currentVal + separator + `Q: ${question}\nA: ${option}`;
    setInput(prev => ({ ...prev, [activeBrainstorm]: newVal }));
    if (brainstormData && currentQuestionIndex < brainstormData.structuredQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setActiveBrainstorm(null);
      setBrainstormData(null);
    }
  };

  const addSuggestion = (suggestion: string) => {
    if (!activeBrainstorm) return;
    const currentVal = input[activeBrainstorm];
    const separator = currentVal.trim().length > 0 ? '\n• ' : '• ';
    setInput(prev => ({ ...prev, [activeBrainstorm]: currentVal + separator + suggestion }));
  };

  const handleLinkHistory = (session: DecisionSession) => {
    setInput(prev => ({
      ...prev,
      title: `Evolved: ${session.input.title}`,
      parentId: session.id,
      context: `Continuing from my previous deliberation on "${session.input.title}". Selected path was: ${session.commitment?.selectedOption || 'Not locked'}.\n\nNew developments: `
    }));
    setShowHistoryLink(false);
  };

  const renderInputWrapper = (field: keyof DecisionInput, label: string, component: React.ReactNode, hasAI: boolean = false, aiIconType: 'sparkle' | 'question' = 'sparkle') => {
    const isListening = listeningField === field;
    const isAiActive = activeBrainstorm === field;
    const isAiEnabled = field === 'context' ? isTitleReady : isContextReady;
    const aiTooltip = isAiEnabled 
      ? (field === 'context' ? UI_CONTENT.FORM.TOOLTIPS.AI_CONTEXT : UI_CONTENT.FORM.TOOLTIPS.AI_GENERAL)
      : (field === 'context' ? UI_CONTENT.FORM.TOOLTIPS.AI_DISABLED_TITLE : UI_CONTENT.FORM.TOOLTIPS.AI_DISABLED_GENERAL);

    return (
      <div className="relative group w-full">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1">{label}</label>
        <div className="relative">
          {component}
          <div className="absolute right-3 bottom-3 flex items-center gap-2 z-10">
            {hasAI && (
              <button type="button" onClick={() => handleBrainstorm(field as any)} disabled={!isAiEnabled} title={aiTooltip}
                className={`p-1.5 rounded-full transition-all duration-300 backdrop-blur-md border ${isAiActive ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : isAiEnabled ? 'bg-slate-800/80 text-indigo-400 border-slate-600 hover:bg-indigo-500 hover:text-white hover:border-indigo-400' : 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'}`}>
                {aiIconType === 'question' ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>}
              </button>
            )}
            <button type="button" onClick={() => handleVoiceInput(field)} className={`p-1.5 rounded-full transition-all duration-300 backdrop-blur-md border ${isListening ? 'bg-red-500 text-white border-red-400 animate-pulse' : 'bg-slate-800/80 text-slate-400 border-slate-600 hover:text-white hover:border-slate-400'}`}>
              {isListening ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>}
            </button>
          </div>
        </div>
        {hasAI && activeBrainstorm === field && (
          <div className="mt-3 p-6 bg-slate-900 border border-indigo-500/30 rounded-xl animate-fade-in relative shadow-2xl">
             <button onClick={() => { setActiveBrainstorm(null); setBrainstormData(null); }} className="absolute top-3 right-3 text-slate-500 hover:text-slate-300"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>
            {brainstormLoading ? (
              <div className="flex flex-col h-40 items-center justify-center py-8 animate-pulse">
                <div className="relative w-12 h-12 mb-4">
                  <div className="absolute inset-0 bg-indigo-400 rounded-full animate-ping opacity-25"></div>
                  <div className="relative w-12 h-12 bg-indigo-500/20 border border-indigo-500/50 rounded-full flex items-center justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg></div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400/70">Architecting structured inquiry...</span>
              </div>
            ) : brainstormData ? (
              <div className="space-y-6">
                {brainstormData.structuredQuestions.length > 0 && (
                  <div className="animate-fade-in">
                    <div className="flex justify-between items-center mb-4">
                       <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Question {currentQuestionIndex + 1} of {brainstormData.structuredQuestions.length}</span>
                       <div className="flex gap-1">{brainstormData.structuredQuestions.map((_, i) => (<div key={i} className={`w-4 h-1 rounded-full transition-all ${i === currentQuestionIndex ? 'bg-indigo-500' : i < currentQuestionIndex ? 'bg-indigo-900' : 'bg-slate-800'}`} />))}</div>
                    </div>
                    <h4 className="text-sm font-bold text-white mb-4 leading-relaxed min-h-[40px]">{brainstormData.structuredQuestions[currentQuestionIndex].question}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">{brainstormData.structuredQuestions[currentQuestionIndex].options.map((opt, i) => (<button key={i} onClick={() => selectBrainstormOption(brainstormData.structuredQuestions[currentQuestionIndex].question, opt)} className="p-3 text-left bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-400 text-slate-200 text-xs rounded-lg transition-all active:scale-95 group"><span className="opacity-50 mr-2 font-mono">{String.fromCharCode(65 + i)}.</span> {opt}</button>))}</div>
                    <div className="flex justify-between pt-4 border-t border-slate-800">
                       <button disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(prev => prev - 1)} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white disabled:opacity-0 transition-all">Previous</button>
                       <button onClick={() => { if (currentQuestionIndex < brainstormData.structuredQuestions.length - 1) { setCurrentQuestionIndex(prev => prev + 1); } else { setActiveBrainstorm(null); } }} className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-all">{currentQuestionIndex === brainstormData.structuredQuestions.length - 1 ? 'Finish' : 'Skip Question'}</button>
                    </div>
                  </div>
                )}
                <div className="pt-4 border-t border-slate-800/50">
                  <h4 className="text-[9px] font-black uppercase text-slate-500 mb-2 tracking-[0.2em]">Nuance Suggestions</h4>
                  <div className="flex flex-wrap gap-2">{brainstormData.suggestions.map((s, i) => (<button key={i} type="button" onClick={() => addSuggestion(s)} className="text-[10px] bg-slate-950/50 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 text-slate-400 py-1 px-2.5 rounded transition-all">+ {s}</button>))}</div>
                </div>
              </div>
            ) : (<div className="text-red-400 text-xs py-10 text-center font-bold">Inquiry generation failed. Please try again.</div>)}
          </div>
        )}
      </div>
    );
  };

  const categorizedTemplates: Record<string, any[]> = {
    'Personal': [
      { label: 'Buying a Home', title: 'Acquiring a Primary Residence vs. Geographic Liquidity', context: 'I am currently renting in a vibrant urban center. The opportunity to purchase a home has arisen, which would anchor me to this geography for at least 5-7 years...', constraints: 'Mortgage rates high. Down payment is 80% of liquid net worth.', options: 'Path A: Purchase residence. Path B: Continue renting. Path C: Rent-to-own.' },
      { label: 'Parenthood', title: 'Initiating Parenthood: Expanding the Family Unit', context: 'We are contemplating having our first child. We value our autonomy and deep focus, but feel a growing desire for the profound meaning of legacy...', constraints: 'Childcare costs $3k/mo. No family support nearby. Biological window factor.', options: 'Path A: Start now. Path B: Freeze embryos. Path C: Defer for 18 months.' },
      { label: 'Relationships', title: 'Terminating a Partnership vs. Salvaging Resonance', context: ' partnership for seven years. Deep history but diverging visions. Operating on different emotional frequencies...', constraints: 'Shared lease. One partner in professional crisis. Emotional exhaustion.', options: 'Path A: Conscious decoupling. Path B: intensive therapy. Path C: Separation trial.' },
      { label: 'Risking a Connection', title: ' Friend to Romance: The Direct Ask', context: 'Developed feelings for a close friend. current dynamic is restorative. Risking awkwardness vs living in repression...', constraints: 'Tight-knit social group. They recently ended a relationship.', options: 'Path A: Direct Disclosure. Path B: Subtle escalation. Path C: Compartmentalization.' }
    ],
    'Career': [
      { label: 'Starting a Company', title: 'Entrepreneurial Risk: Burning the Boats', context: 'Validated idea for a new category. Currently in high-paying exec role. known ceiling vs unknown floor...', constraints: '12 months runway. No outside funding. Spouse values stability.', options: 'Path A: Resign and fund MVP. Path B: Side-quest build. Path C: Seek lead investor first.' },
      { label: 'Industry Pivot', title: 'Changing Industry: Transferring Human Capital', context: '10 years expertise in Finance. Want to pivot into Climate Tech. Pay cut for higher meaning vs re-entry friction...', constraints: 'Domain gaps. Network is 90% in old industry.', options: 'Path A: Aggressive pivot. Path B: Bridge Strategy. Path C: Academic Reset.' },
      { label: 'Internal Shift', title: 'IC to Management: Changing the Nature of Craft', context: 'Top IC offered Management role. enjoy the craft vs leverage through leading others. Loss of flow state...', constraints: '20% raise. Team under-performing. No training.', options: 'Path A: Leadership leap. Path B: Principal IC path. Path C: Trial management project.' }
    ],
    'Business': [
      { label: 'Picking a Cofounder', title: 'Strategic Partner: Competence vs. Compatibility', context: 'technical cofounder search. World-class engineer vs value-aligned partner. velocity vs stability...', constraints: 'Alpha in 3 months. Equity split now. Competing offers.', options: 'Path A: Select Candidate A. Path B: Select Candidate B. Path C: Trial sprint.' },
      { label: 'US Entry', title: 'Geographic Expansion: Launching into the US', context: 'Ready for US entry. Massive capital outlay vs speculative global dominance. Relocating leadership...', constraints: '$2M budget. 10x larger competitors. Regulatory hurdles.', options: 'Path A: Full US Launch. Path B: Digital beachhead. Path C: Partnership.' },
      { label: 'Integrating AI', title: 'Technological Evolution: Adding AI to Core Product', context: 'Legacy SaaS platform needs AI relevance. build proprietary model vs API wrapper. Defensibility vs Speed...', constraints: 'Limited LLM experience. Investors demand roadmap. Inference costs.', options: 'Path A: Custom fine-tuned layer. Path B: API Integration. Path C: Acquisition.' }
    ],
    'Life & Legacy': [
      { label: 'Activism', title: 'The Act of Dissent: Civic Protest vs. Professional Safety', context: 'Moral imperative to participate in high-visibility protest. Professional role values neutrality. job loss risk...', constraints: 'Strict conduct policy. Primary earner. Controversial movement.', options: 'Path A: Full Participation. Path B: Silent Support. Path C: Internal Reform.' },
      { label: 'Strategic Voting', title: 'Voting: Principal Alignment vs. Pragmatic Outcomes', context: 'Idealist candidate with no chance vs Flawed candidate who can win and block a catastrophic alternative...', constraints: 'First-past-the-post system. Industry stakes. Family split.', options: 'Path A: Vote Idealist. Path B: Vote Pragmatist. Path C: Abstention.' },
      { label: 'Sabbatical', title: 'Experiential Expansion: The 3-Month Reset', context: 'Worked at high intensity for six years. Solo journey to reconnect. re-entry friction vs promotion track...', constraints: 'Total cost $15k. AI-driven industry shifts. 4-week role guarantee.', options: 'Path A: Full reset. Path B: Intensive mini-break. Path C: Remote-work sabbatical.' }
    ]
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl h-full flex flex-col overflow-hidden">
      <div className="flex-shrink-0 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="12" x2="12" y1="18" y2="12"/><line x1="9" x2="15" y1="15" y2="15"/></svg>
            {UI_CONTENT.FORM.TITLE}
          </h2>
          {isContextReady && <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">{UI_CONTENT.FORM.MESSAGES.READY}</span>}
        </div>
        
        <div className="space-y-4">
          <div className="flex gap-4 border-b border-slate-800 pb-2 overflow-x-auto custom-scrollbar no-scrollbar">
            {Object.keys(categorizedTemplates).map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={`text-[10px] font-black uppercase tracking-widest pb-1 transition-all border-b-2 ${activeCategory === cat ? 'border-indigo-500 text-white' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>{cat}</button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 animate-fade-in" key={activeCategory}>
            {categorizedTemplates[activeCategory].map(t => (
              <button key={t.label} type="button" onClick={() => setInput({ title: t.title, context: t.context, constraints: t.constraints, options: t.options })} className="text-[10px] bg-slate-800/50 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 text-slate-300 px-2.5 py-1 rounded-full transition-all">{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2">
        {renderInputWrapper('title', UI_CONTENT.FORM.LABELS.TITLE, <input type="text" name="title" value={input.title} onChange={handleChange} placeholder={UI_CONTENT.FORM.PLACEHOLDERS.TITLE} className="w-full bg-slate-950/50 border border-slate-700/60 rounded-xl p-4 pr-16 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-inner font-medium text-lg" required />)}
        <div className="pt-2"><DocumentUpload onDocumentsChange={handleDocumentUpload} /></div>
        {renderInputWrapper('context', UI_CONTENT.FORM.LABELS.CONTEXT, <textarea name="context" value={input.context} onChange={handleChange} rows={5} placeholder={UI_CONTENT.FORM.PLACEHOLDERS.CONTEXT} className="w-full bg-slate-950/50 border border-slate-700/60 rounded-xl p-4 pb-14 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-inner resize-none leading-relaxed custom-scrollbar" required />, true, 'question')}
        <div className="grid grid-cols-1 gap-6">
          {renderInputWrapper('constraints', UI_CONTENT.FORM.LABELS.CONSTRAINTS, <textarea name="constraints" value={input.constraints} onChange={handleChange} rows={4} placeholder={UI_CONTENT.FORM.PLACEHOLDERS.CONSTRAINTS} className="w-full bg-slate-950/50 border border-slate-700/60 rounded-xl p-4 pb-14 pr-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-inner resize-none text-sm custom-scrollbar" />, true)}
          {renderInputWrapper('options', UI_CONTENT.FORM.LABELS.OPTIONS, <textarea name="options" value={input.options} onChange={handleChange} rows={4} placeholder={UI_CONTENT.FORM.PLACEHOLDERS.OPTIONS} className="w-full bg-slate-950/50 border border-slate-700/60 rounded-xl p-4 pb-14 pr-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-inner resize-none text-sm custom-scrollbar" />, true)}
        </div>

        {/* Evolutionary Linking - Repositioned to Bottom */}
        <div className="pt-4 border-t border-slate-800/50 space-y-4">
          <div className="flex items-center justify-between">
             <div className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Strategic Continuity</div>
             {sessions.length > 0 && (
                <button 
                  type="button"
                  onClick={() => setShowHistoryLink(!showHistoryLink)}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-all flex items-center gap-1.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  {input.parentId ? 'Change Parent' : 'Link from History'}
                </button>
             )}
          </div>

          {showHistoryLink && (
            <div className="p-4 bg-slate-950/80 border border-indigo-500/30 rounded-xl animate-fade-in max-h-40 overflow-y-auto custom-scrollbar">
               <div className="space-y-1">
                  {sessions.filter(s => s.id !== input.parentId).map(s => (
                    <button key={s.id} type="button" onClick={() => handleLinkHistory(s)} className="w-full text-left p-2 rounded hover:bg-slate-800 text-xs text-slate-300 truncate transition-colors flex items-center gap-2">
                       <span className="w-1 h-1 rounded-full bg-indigo-500"></span>
                       {s.input.title}
                    </button>
                  ))}
               </div>
            </div>
          )}

          {input.parentId && (
            <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-xl animate-fade-in">
               <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.7 1.5-1.7 1.5-2.7 0-1.5-1-2.8-2.5-2.8-1.7 0-2.5 1-2.5 2.8M9 14c-.2-1-.7-1.7-1.5-2.5-1-.7-1.5-1.7-1.5-2.7 0-1.5 1-2.8 2.5-2.8 1.7 0 2.5 1 2.5 2.8M12 21v-4M12 3v4"/></svg>
                    Evolutionary Branch
                  </div>
                  <button type="button" onClick={() => setInput(prev => ({...prev, parentId: undefined}))} className="text-[10px] text-slate-500 hover:text-red-400 font-bold transition-colors">Unlink</button>
               </div>
               <div className="text-xs text-white font-bold truncate pl-1 border-l border-indigo-500/40">
                  {sessions.find(s => s.id === input.parentId)?.input.title || "Linked Inquiry"}
               </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !isContextReady}
          className={`w-full py-4 px-6 rounded-xl font-bold text-lg text-white shadow-xl transition-all duration-300 transform border border-white/10 shrink-0 ${
            isLoading 
              ? 'bg-slate-800 cursor-not-allowed' 
              : !isContextReady 
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right hover:scale-[1.01] active:scale-[0.99] shadow-indigo-500/25'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              <span className="animate-pulse">{stages[loadingStage]}</span>
            </span>
          ) : UI_CONTENT.FORM.BUTTONS.ANALYZE}
        </button>
      </form>
    </div>
  );
};

export default InputForm;

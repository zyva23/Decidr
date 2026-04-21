import React, { useState, useEffect } from 'react';
import { DecisionInput, BrainstormResult, DecisionSession } from '../types';
import { exploreBrainstorm, extractDeepInquiry } from '../services/geminiService';
import DocumentUpload from './DocumentUpload';
import { Attachment, DeepInquiryResult } from '../types';
import { UI_CONTENT } from '../src/constants/uiContent';

interface Props {
  initialValues: DecisionInput;
  onSubmit: (input: DecisionInput) => void;
  isLoading: boolean;
  sessions: DecisionSession[];
  isLocked: boolean;
  onUnlock: () => void;
  showPrompt: (config: any) => void;
}

const InputForm: React.FC<Props> = ({ initialValues, onSubmit, isLoading, sessions, isLocked, onUnlock, showPrompt }) => {
  const [input, setInput] = useState<DecisionInput>(initialValues);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showHistoryLink, setShowHistoryLink] = useState(false);

  useEffect(() => { 
    setInput(initialValues); 
    setLinkedPrefix(''); // Reset prefix when loading a different session
  }, [initialValues]);

  const [listeningField, setListeningField] = useState<keyof DecisionInput | null>(null);
  const [activeBrainstorm, setActiveBrainstorm] = useState<'constraints' | 'options' | 'context' | null>(null);
  const [brainstormLoading, setBrainstormLoading] = useState(false);
  const [isLoadingBrainstorm, setIsLoadingBrainstorm] = useState(false);
  const [brainstormData, setBrainstormData] = useState<BrainstormResult | null>(null);
  const [brainstormCache, setBrainstormCache] = useState<Record<string, BrainstormResult>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState('Personal');
  const [activeExample, setActiveExample] = useState<string | null>(null);
  const [hasChangesSinceSelection, setHasChangesSinceSelection] = useState(false);

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
    
    // Requirement: Personalization Nudge with three options
    if (activeExample && !hasChangesSinceSelection) {
      showPrompt({
        type: 'confirm',
        title: 'Personalize for Precision',
        message: 'You are using an example template. To get the most accurate archetypal deliberation, we recommend tailoring it to your unique situation.',
        confirmLabel: 'Continue anyway',
        cancelLabel: 'Personalize',
        extraLabel: 'Personalize with AI',
        onConfirm: () => proceedSubmit(),
        onCancel: () => {
          // Just close and let user edit - focus the context box
          const contextEl = document.getElementsByName('context')[0];
          if (contextEl) contextEl.focus();
        },
        onExtraAction: async () => {
          try {
            // Trigger AI Enrichment in background
            setIsLoadingBrainstorm(true);
            
            // Run extraction and brainstorming in parallel for both fields
            const [enriched, contextRes, constraintsRes] = await Promise.all([
              extractDeepInquiry(input),
              exploreBrainstorm('context', input.title, input.context),
              exploreBrainstorm('constraints', input.title, input.context)
            ]);

            const newCache: Record<string, BrainstormResult> = {};

            if (contextRes) {
              newCache['context'] = {
                ...contextRes,
                suggestions: [...enriched.situationalNuances, ...contextRes.suggestions]
              };
            }

            if (constraintsRes) {
              newCache['constraints'] = {
                ...constraintsRes,
                suggestions: [...enriched.frictionalRealities, ...constraintsRes.suggestions]
              };
            }

            setBrainstormCache(newCache);
            setHasChangesSinceSelection(true);
            setIsLoadingBrainstorm(false);

            // Automatically open the Context AI Help panel with the cached data
            setActiveBrainstorm('context');
            setBrainstormData(newCache['context']);
            setCurrentQuestionIndex(0);

          } catch (err) {
            console.error("AI Personalization failed:", err);
            setIsLoadingBrainstorm(false);
          }
        }
      });
      return;
    }

    proceedSubmit();
  };

  const proceedSubmit = () => {
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
    if (activeExample) {
      setHasChangesSinceSelection(true);
    }
  };

  const handleTemplateClick = (t: any) => {
    // Requirement 1: Toggle example (unclick to remove)
    if (activeExample === t.label) {
      if (hasChangesSinceSelection) {
        showPrompt({
          type: 'confirm',
          title: 'Discard Modifications?',
          message: 'This will clear your modifications to this example. Continue?',
          onConfirm: () => {
            setInput({ title: '', context: '', constraints: '', options: '' });
            setActiveExample(null);
            setHasChangesSinceSelection(false);
          }
        });
        return;
      }
      setInput({ title: '', context: '', constraints: '', options: '' });
      setActiveExample(null);
      setHasChangesSinceSelection(false);
      return;
    }

    // Requirement 2: Warning if modified
    if (hasChangesSinceSelection) {
      showPrompt({
        type: 'confirm',
        title: 'Switch Example?',
        message: 'You have modified the current example. Switching will lose your changes. Continue?',
        onConfirm: () => {
          setInput({ title: t.title, context: t.context, constraints: t.constraints, options: t.options });
          setActiveExample(t.label);
          setHasChangesSinceSelection(false);
        }
      });
      return;
    }

    setInput({ title: t.title, context: t.context, constraints: t.constraints, options: t.options });
    setActiveExample(t.label);
    setHasChangesSinceSelection(false);
  };

  const handleVoiceInput = (field: keyof DecisionInput) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showPrompt({
        type: 'alert',
        title: 'Voice Not Supported',
        message: UI_CONTENT.FORM.MESSAGES.VOICE_NOT_SUPPORTED
      });
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
    setCurrentQuestionIndex(0);

    // 1. Check Cache first
    if (brainstormCache[field]) {
      setBrainstormData(brainstormCache[field]);
      return;
    }

    setBrainstormLoading(true);
    setBrainstormData(null);

    try {
      if (field === 'context') {
        // Run deep inquiry and regular brainstorm in parallel
        const [enriched, result] = await Promise.all([
          extractDeepInquiry(input),
          exploreBrainstorm(field, input.title, input.context)
        ]);

        const mergedResult: BrainstormResult = {
          ...result,
          suggestions: [...(enriched.situationalNuances || []), ...result.suggestions]
        };

        setBrainstormData(mergedResult);
        setBrainstormCache(prev => ({ ...prev, [field]: mergedResult }));
      } else {
        const result = await exploreBrainstorm(field, input.title, input.context);
        setBrainstormData(result);
        setBrainstormCache(prev => ({ ...prev, [field]: result }));
      }
    } catch (e) { 
      console.error(e); 
      setActiveBrainstorm(null); 
    } finally { 
      setBrainstormLoading(false); 
    }
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

  const [linkedPrefix, setLinkedPrefix] = useState<string>('');
  const [isTemplatesExpanded, setIsTemplatesExpanded] = useState(false);

  const handleLinkHistory = (session: DecisionSession) => {
    const prefix = `Continuing from my previous deliberation on "${session.input.title}". Selected path was: ${session.commitment?.selectedOption || 'Not locked'}.\n\n`;
    setLinkedPrefix(prefix);
    setInput(prev => ({
      ...prev,
      parentId: session.id,
      context: `${prefix}${prev.context}`
    }));
    setShowHistoryLink(false);
    // Reset example state
    setActiveExample(null);
    setHasChangesSinceSelection(false);
  };

  const handleUnlink = () => {
    setInput(prev => {
      let newContext = prev.context;
      if (linkedPrefix && newContext.startsWith(linkedPrefix)) {
        newContext = newContext.substring(linkedPrefix.length);
      }
      return { ...prev, parentId: undefined, context: newContext };
    });
    setLinkedPrefix('');
  };

  const renderInputWrapper = (field: keyof DecisionInput, label: string, component: React.ReactNode, hasAI: boolean = false, aiIconType: 'sparkle' | 'question' = 'sparkle') => {
    const isListening = listeningField === field;
    const isAiActive = activeBrainstorm === field;
    const isAiEnabled = (field === 'context' ? isTitleReady : isContextReady) && !isLocked;
    const aiTooltip = isLocked ? "Unlock to use AI assistance" : isAiEnabled 
      ? (field === 'context' ? UI_CONTENT.FORM.TOOLTIPS.AI_CONTEXT : UI_CONTENT.FORM.TOOLTIPS.AI_GENERAL)
      : (field === 'context' ? UI_CONTENT.FORM.TOOLTIPS.AI_DISABLED_TITLE : UI_CONTENT.FORM.TOOLTIPS.AI_DISABLED_GENERAL);

    return (
      <div className="relative group w-full">
        <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-1">{label}</label>
        <div className="relative">
          {React.cloneElement(component as React.ReactElement, { disabled: isLocked || isLoading })}
          <div className="absolute right-3 bottom-3 flex items-center gap-2 z-10">
            {hasAI && (
              <button 
                type="button" 
                onClick={() => handleBrainstorm(field as any)} 
                disabled={!isAiEnabled || isLocked} 
                title={aiTooltip}
                aria-label={`AI ${field}`}
                className={`p-1.5 rounded-full transition-all duration-300 backdrop-blur-md border ${isAiActive ? 'bg-indigo-500 text-white border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : isAiEnabled ? 'bg-slate-800/80 text-indigo-400 border-slate-600 hover:bg-indigo-500 hover:text-white hover:border-indigo-400' : 'bg-slate-900/50 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'}`}>
                {aiIconType === 'question' ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>}
              </button>
            )}
            <button type="button" disabled={isLocked} onClick={() => handleVoiceInput(field)} className={`p-1.5 rounded-full transition-all duration-300 backdrop-blur-md border ${isListening ? 'bg-red-500 text-white border-red-400 animate-pulse' : isLocked ? 'bg-slate-900/50 text-slate-700 border-slate-800 cursor-not-allowed' : 'bg-slate-800/80 text-slate-400 border-slate-600 hover:text-white hover:border-slate-400'}`}>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">{brainstormData.structuredQuestions[currentQuestionIndex].options.map((opt, i) => (<button key={i} type="button" onClick={() => selectBrainstormOption(brainstormData.structuredQuestions[currentQuestionIndex].question, opt)} className="p-3 text-left bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-400 text-slate-200 text-xs rounded-lg transition-all active:scale-95 group"><span className="opacity-50 mr-2 font-mono">{String.fromCharCode(65 + i)}.</span> {opt}</button>))}</div>
                    <div className="flex justify-between pt-4 border-t border-slate-800">
                       <button type="button" disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(prev => prev - 1)} className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white disabled:opacity-0 transition-all">Previous</button>
                       <button type="button" onClick={() => { if (currentQuestionIndex < brainstormData.structuredQuestions.length - 1) { setCurrentQuestionIndex(prev => prev + 1); } else { setActiveBrainstorm(null); } }} className="text-[10px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-all">{currentQuestionIndex === brainstormData.structuredQuestions.length - 1 ? 'Finish' : 'Skip Question'}</button>
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
      { 
        label: 'Buying a Home', 
        title: 'Primary Residence vs. Geographic Liquidity', 
        context: 'I am currently renting in a vibrant urban center that provides high optionality. An opportunity to purchase a home has arisen in a quieter district. This would stabilize my long-term costs but anchor me to this geography for 7-10 years. I worry about "lifestyle creep" and the loss of the psychological freedom that comes with renting. My partner is eager for the stability, but I feel an underlying dread about the finality of the decision.', 
        constraints: 'Mortgage rates are at a 10-year high. The down payment represents 75% of my liquid safety net. One of our incomes is variable (freelance).', 
        options: 'Path A: Commit to the purchase and lean into stability. Path B: Continue renting to maintain geographic agility. Path C: Look for a smaller "starter" investment property elsewhere.' 
      },
      { 
        label: 'Parenthood', 
        title: 'The Leap to Parenthood: Identity & Meaning', 
        context: 'We are contemplating having our first child. We both value our current autonomy, deep creative focus, and spontaneous travel. We feel a growing desire for the profound meaning of legacy, but also fear the "identity death" that often accompanies early parenthood. We are high-performers who are used to being in control of our schedules, and the inherent chaos of a child feels both beautiful and terrifying.', 
        constraints: 'Private childcare in our city is $3.5k/month. We have no family support within a 5-hour radius. We are both in high-stress career phases.', 
        options: 'Path A: Initiate the journey now. Path B: Freeze embryos to extend the biological window and revisit in 24 months. Path C: Defer indefinitely and focus on child-free meaning.' 
      },
      { 
        label: 'Relationships', 
        title: 'Partnership Divergence: Growth vs. Comfort', 
        context: 'I have been in a partnership for eight years. We have a deep, restorative history, but our visions for the future are beginning to diverge significantly on core values (location, ambition, social circles). We are operating on different emotional frequencies; I am in a phase of rapid expansion while they prefer the current equilibrium. There is no "crisis," just a slow, quiet drift that feels like a betrayal of our past.', 
        constraints: 'We share a mortgage and a tight social circle. One partner is currently navigating a professional transition and is emotionally fragile.', 
        options: 'Path A: Initiate a "Conscious Decoupling" process. Path B: Commit to a 6-month intensive therapy sprint. Path C: Trial a 3-month physical separation to test the "missing" factor.' 
      }
    ],
    'Career': [
      { 
        label: 'Starting a Company', 
        title: 'Entrepreneurial Risk: The Known Ceiling vs. Unknown Floor', 
        context: 'I have validated a "pain point" in a niche market and have a working MVP. I am currently a high-paid Director at a stable tech firm. I have reached a "known ceiling" where my growth is incremental. Leaving would mean trading a $300k salary for the "unknown floor" of a self-funded startup. I have the technical skill, but the psychological weight of being the sole provider for my household is creating significant friction.', 
        constraints: '14 months of personal runway. No outside funding secured yet. Non-compete clause in current contract may limit initial client list.', 
        options: 'Path A: Resign immediately and burn the boats. Path B: Moonlight for 6 months to reach a revenue milestone first. Path C: Seek a lead investor/cofounder before quitting.' 
      },
      { 
        label: 'Industry Pivot', 
        title: 'The Mid-Career Pivot: Re-indexing Human Capital', 
        context: 'After 12 years in traditional Finance, I want to pivot into Climate Tech. I am highly competent in my current domain, but I find no "soul-resonance" in the work. A pivot would likely require a 40% pay cut and a "re-entry friction" where I am seen as a generalist rather than an expert. I am weighing the "regret of inaction" against the risk of professional irrelevance if the pivot fails.', 
        constraints: 'Domain gap in technical climate science. My professional network is 95% legacy finance. Family expenses are calibrated to current high salary.', 
        options: 'Path A: Aggressive pivot into a Series A startup. Path B: "Bridge Strategy" (Consulting in Finance for Climate firms). Path C: 1-year specialized Master\'s program.' 
      },
      { 
        label: 'Leadership Leap', 
        title: 'IC to Management: The Loss of the Craft', 
        context: 'I am a top-performing individual contributor (IC) who has been offered a VP of Engineering role. I love the "flow state" of deep technical work, which I would lose in favor of "people systems" and organizational politics. I am attracted to the increased leverage and scale of impact, but I fear that my technical skills will atrophy, making me less employable if the leadership path doesn\'t suit my temperament.', 
        constraints: '25% compensation increase. The team is currently under-performing and requires a cultural overhaul. No formal management training provided.', 
        options: 'Path A: Accept the leadership leap. Path B: Push for a "Principal Engineer" track that stays technical. Path C: Negotiate a 6-month "Acting VP" trial.' 
      }
    ],
    'Business': [
      { 
        label: 'Picking a Cofounder', 
        title: 'The Cofounder Dilemma: Competence vs. Compatibility', 
        context: 'I am choosing between two potential cofounders for a new AI venture. Candidate A is a world-class researcher with "alpha" temperament but low emotional intelligence. Candidate B is a long-term friend with high value-alignment and solid (but not elite) technical skills. I am weighing the "velocity" provided by Candidate A against the "stability" and trust of Candidate B. In high-stress environments, I tend to value loyalty over raw output.', 
        constraints: 'Need to ship an Alpha in 10 weeks. Equity split must be decided now. Candidate A has a competing offer from a Big Tech firm.', 
        options: 'Path A: Partner with Candidate A for maximum velocity. Path B: Partner with Candidate B for long-term resilience. Path C: Proceed as a solo founder and hire A as a lead.' 
      },
      { 
        label: 'Market Expansion', 
        title: 'Geographic Expansion: Launching into the US Market', 
        context: 'Our European SaaS has reached a plateau. A US entry is the only path to "venture-scale" growth, but it requires a massive capital outlay and the relocation of our founding team. The US market is 10x larger but significantly more aggressive. We risk our core European stability for the chance of global dominance. Our leadership team is split: some want to "defend the fort," others want to "conquer the world."', 
        constraints: '$2.5M dedicated expansion budget. No existing US network. Domestic competitors are 5x better funded.', 
        options: 'Path A: Full US HQ relocation. Path B: "Digital Beachhead" (Remote US sales team). Path C: Joint Venture with a US partner.' 
      },
      { 
        label: 'Integrating AI', 
        title: 'Technological Evolution: Proprietary Model vs. API Wrapper', 
        context: 'Our legacy product needs a generative AI layer to remain relevant. We are debating whether to build a proprietary fine-tuned model (high defensibility, high cost, slow) or use an "API wrapper" approach (low cost, fast, zero defensibility). Our investors are demanding an "AI Roadmap" by next quarter. We have limited internal LLM expertise but a massive proprietary dataset.', 
        constraints: 'Inference costs could kill our margins. Talent for custom model training is expensive and scarce. 3-month window before competitors launch.', 
        options: 'Path A: Custom fine-tuned proprietary layer. Path B: Rapid "wrapper" deployment using GPT-4. Path C: Acquisition of a smaller AI-first startup.' 
      }
    ],
    'Life & Legacy': [
      { 
        label: 'The Act of Dissent', 
        title: 'Moral Imperative vs. Professional Safety', 
        context: 'I feel a deep moral imperative to participate in a high-visibility civic protest regarding a controversial human rights issue. However, my professional role requires a high degree of "perceived neutrality," and my employer has a history of retaliating against political activism. I am weighing my "historical integrity"—the person I want to be able to look back on—against the immediate risk of losing my primary income and professional reputation.', 
        constraints: 'Strict "Code of Conduct" policy. I am the primary earner for my household. No "safe" anonymous way to participate.', 
        options: 'Path A: Full public participation. Path B: Anonymous financial/logistical support. Path C: Internal reform advocacy within the company.' 
      },
      { 
        label: 'The Sabbatical', 
        title: 'The Experiential Reset: 6 Months of Unstructured Time', 
        context: 'I have worked at a high intensity for eight years without a break longer than a week. I am experiencing "soul-fatigue." I want to take a 6-month sabbatical to travel solo and reconnect with my non-professional self. I fear the "re-entry friction"—that the industry will move past me, or that I will lose the "hunger" that made me successful. But I also fear that if I don\'t stop now, I will reach a point of permanent burnout.', 
        constraints: 'Total cost $25k. No "guaranteed" role upon return. AI is rapidly shifting my industry\'s talent requirements.', 
        options: 'Path A: Full unstructured sabbatical. Path B: "Prototyping" break (1 month off, then assess). Path C: Remote-work "Workation" to maintain relevance.' 
      },
      { 
        label: 'Legacy Endowment', 
        title: 'Capital Allocation: Immediate Impact vs. Perpetual Endowment', 
        context: 'I have come into a significant windfall. I am debating whether to deploy 90% of it immediately into a high-impact, high-risk philanthropic project (direct action) or to create a perpetual endowment/trust that provides smaller, steady support for 50+ years. I am weighing the "now" (urgent human need) against the "forever" (institutional legacy). I distrust large institutions, but I also worry about the "efficiency of deployment" for immediate cash.', 
        constraints: 'Complexity of managing a private foundation. High inflation eroding future value. Urgent crisis in the target domain.', 
        options: 'Path A: Direct Immediate Deployment. Path B: Perpetual Endowment structure. Path C: 5-year aggressive "Spend-Down" trust.' 
      }
    ]
  };


  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl h-full flex flex-col overflow-hidden text-left relative">
      {/* Background Agent Loading Overlay */}
      {isLoadingBrainstorm && (
        <div className="absolute inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center rounded-2xl animate-fade-in">
           <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center text-2xl animate-pulse">🧠</div>
           </div>
           <div className="text-center px-8">
              <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-2 italic">Background Agent Active</h3>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest animate-pulse max-w-xs leading-relaxed">
                Extracting situational nuances and frictional realities from your strategic inquiry...
              </p>
           </div>
        </div>
      )}

      {/* Example Templates Section (Expandable) */}
      <div className="flex-shrink-0 mb-4 bg-slate-950/40 border border-slate-800/60 rounded-xl overflow-hidden transition-all duration-500">
        <button 
          onClick={() => setIsTemplatesExpanded(!isTemplatesExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between text-left group hover:bg-indigo-500/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-indigo-400 transition-colors">Example Templates</span>
            {activeExample && <span className="ml-2 px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-black uppercase rounded-full">Active</span>}
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={`text-slate-600 transition-transform duration-300 ${isTemplatesExpanded ? 'rotate-180' : ''}`}><path d="m6 9 6 6 6-6"/></svg>
        </button>

        {isTemplatesExpanded && (
          <div className="px-4 pb-4 pt-2 space-y-4 animate-slide-up">
            <div className="flex gap-4 border-b border-slate-800 pb-2 overflow-x-auto custom-scrollbar no-scrollbar">
              {Object.keys(categorizedTemplates).map(cat => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`text-[9px] font-black uppercase tracking-widest pb-1 transition-all border-b-2 ${activeCategory === cat ? 'border-indigo-500 text-white' : 'border-transparent text-slate-600 hover:text-slate-300'}`}>{cat}</button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 animate-fade-in" key={activeCategory}>
              {categorizedTemplates[activeCategory].map(t => (
                <button 
                  key={t.label} 
                  type="button" 
                  onClick={() => handleTemplateClick(t)} 
                  className={`text-[9px] border px-2.5 py-1 rounded-full font-bold transition-all ${activeExample === t.label ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_10px_rgba(99,102,241,0.3)]' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-700 hover:border-slate-600'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <p className="text-[8px] text-slate-500 font-medium italic">Templates provide a structural starting point. Select one to auto-populate the fields below.</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 mb-4 px-1">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]"></span>
            Your Inquiry
          </h2>
          <div className="flex items-center gap-3">
            {isLocked && (
              <button 
                type="button" 
                onClick={onUnlock}
                title="Modify Strategic Parameters"
                className="p-1.5 text-indigo-400 border border-indigo-500/30 rounded-lg hover:bg-indigo-500/10 transition-all flex items-center justify-center shadow-lg shadow-indigo-900/10"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </button>
            )}
            {isContextReady && <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded border border-emerald-400/20">Analysis Ready</span>}
          </div>
        </div>

        {/* Active Template Tag */}
        {activeExample && (
          <div className="flex animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/10 border border-indigo-500/30 rounded-full group">
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Using: {activeExample}</span>
              <button 
                type="button"
                onClick={() => {
                  const t = Object.values(categorizedTemplates).flat().find(x => x.label === activeExample);
                  if (t) handleTemplateClick(t);
                }}
                className="hover:text-red-400 transition-colors"
                title="Clear Template"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar space-y-6 pr-2 text-left">
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
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.7 1.5-1.7 1.5-2.7 0-1.5-1-2.8-2.5-2.8-1.7 0-2.5 1-2.5 2.8M9 14c-.2-1-.7-1.7-1.5-2.5-1-.7-1.5-1.7-1.5-2.7 0-1.5-1-2.8-2.5-2.8 1.7 0 2.5 1 2.5 2.8M12 21v-4M12 3v4"/></svg>
                    Evolutionary Branch
                  </div>
                  <button type="button" onClick={handleUnlink} className="text-[10px] text-slate-500 hover:text-red-400 font-bold transition-colors">Unlink</button>
               </div>
               <div className="text-xs text-white font-bold truncate pl-1 border-l border-indigo-500/40">
                  {sessions.find(s => s.id === input.parentId)?.input.title || "Linked Inquiry"}
               </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || (!isContextReady && !isLocked)}
          className={`w-full py-4 px-6 rounded-xl font-bold text-lg text-white shadow-xl transition-all duration-300 transform border border-white/10 shrink-0 ${
            isLoading 
              ? 'bg-slate-800 cursor-not-allowed' 
              : (!isContextReady && !isLocked)
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : isLocked 
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:scale-[1.01] active:scale-[0.99] shadow-indigo-500/25 border-indigo-400/30'
                  : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right hover:scale-[1.01] active:scale-[0.99] shadow-indigo-500/25'
          }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
              <span className="animate-pulse">{stages[loadingStage]}</span>
            </span>
          ) : isLocked ? 'Rerun Deliberation' : UI_CONTENT.FORM.BUTTONS.ANALYZE}
        </button>
      </form>
    </div>
  );
};

export default InputForm;

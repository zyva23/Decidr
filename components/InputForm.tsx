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

  // Sync state when initialValues change
  useEffect(() => {
    setInput(initialValues);
  }, [initialValues]);

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
      { 
        label: 'Buying a Home', 
        title: 'Acquiring a Primary Residence vs. Geographic Liquidity', 
        context: 'I am currently renting in a vibrant urban center. The opportunity to purchase a home has arisen, which would anchor me to this geography for at least 5-7 years to reach a financial break-even point. While homeownership represents a "psychological anchor" and a forced savings vehicle, I fear the loss of professional optionality. If a transformative opportunity arises in another city, the house becomes a high-friction anchor rather than an asset. I am navigating the tension between my desire for "roots" and my need for "reach."', 
        constraints: 'Current mortgage rates are at a 15-year high. My down payment represents 80% of my liquid net worth. The local market is showing signs of cooling after a 40% run-up.', 
        options: 'Path A: Purchase the residence (Commitment to Stability). Path B: Continue renting and deploy capital into high-growth liquid indices (Wealth focus). Path C: Rent-to-own or buy a smaller "starter" property in a less central area (Hedged approach).' 
      },
      { 
        label: 'Marriage', 
        title: 'Formalizing a Partnership: Legal Fortification vs. Evolving Bond', 
        context: 'We have been in a committed relationship for five years. We function effectively as a unit, yet the question of legal marriage remains a point of friction. One partner views marriage as a necessary ritual of social and legal fortification; the other views it as an outdated bureaucratic overlay on a naturally evolving emotional bond. We are debating if the legal protections (inheritance, taxes, medical) outweigh the perceived loss of individual autonomy and the risk of "institutionalizing" the romance.', 
        constraints: 'Pressure from extended family is mounting. Disparity in individual assets and debt. Potential for international relocation requiring dependent visas.', 
        options: 'Path A: Legal marriage with a robust pre-nuptial agreement. Path B: Maintain the status quo (Organic Commitment). Path C: A non-legal symbolic ceremony to satisfy social expectations without state involvement.' 
      },
      { 
        label: 'Getting a Dog', 
        title: 'Integrating a Canine Companion into a High-Performance Lifestyle', 
        context: 'I desire the emotional grounding and discipline that comes with caring for a dog. However, my life is characterized by frequent travel and erratic working hours. I am weighing the joy of companionship against the logistical complexity of pet care, the financial overhead of boarding, and the potential reduction in my spontaneous mobility. The friction lies in whether I can actually adapt my lifestyle or if the dog will suffer from my ambition.', 
        constraints: 'Living in a 700 sq ft apartment without private outdoor access. Travel occurs 1-2 times per month. Total pet care budget capped at $400/mo.', 
        options: 'Path A: Adopt a high-energy rescue (Commitment to Lifestyle Shift). Path B: Foster a dog temporarily to test integration. Path C: Defer adoption until professional stability increases.' 
      }
    ],
    'Career': [
      { 
        label: 'Startup Offer', 
        title: 'Accepting a Senior Role at a Stealth Startup vs. Big Tech Stability', 
        context: 'I am currently at a Tier-1 Tech firm with high compensation and low risk. A stealth-stage startup has offered me a Senior Role with significant equity. The startup has high-quality founders but no guaranteed product-market fit. I am deciding between the "guaranteed" path of institutional wealth and the "speculative" path of category-defining impact. The friction is between my current comfort and my long-term career hunger.', 
        constraints: 'Startup runway is only 14 months. Equity cliff is 1 year. I have a mortgage and young children.', 
        options: 'Path A: Accept the startup role (High-Beta Growth). Path B: Stay at current firm and seek a more challenging internal transfer (Safety). Path C: Negotiate an advisory role at the startup first.' 
      },
      { 
        label: 'Founder to CEO', 
        title: 'Succession Planning: Transitioning from Founder to Professional Management', 
        context: 'I have led this organization from inception to 200 employees. I recognize that my "wartime" founder instincts are beginning to create friction with the operational excellence now required. I worry that stepping back will dilute the original soul of the company, but staying in the CEO role may bottleneck our maturity. It is a deliberation on ego vs. institutional longevity.', 
        constraints: 'Board of Directors expects a 12-month transition. Internal candidates are sensitive to external hires. I must maintain a majority stake.', 
        options: 'Path A: Hire an external veteran CEO (Disruption). Path B: Promote the current COO (Continuity). Path C: Adopt a Co-CEO model for 18 months (Gradualism).' 
      },
      { 
        label: 'Therapy', 
        title: 'Initiating Psychotherapeutic Inquiry for Preventive Maintenance', 
        context: 'I am not in a state of crisis, but I recognize recurring patterns of stress and a subtle "existential drift." I am considering hiring a high-performance therapist to map my cognitive biases. The deliberation is whether this investment of time and capital is more effective than self-directed practices like meditation. The friction is my skepticism toward "talk therapy" vs. my desire for deeper self-awareness.', 
        constraints: 'Quality practitioners have a 3-month waitlist. Out-of-pocket cost is $250/hour. Time commitment: 2 hours/week including travel.', 
        options: 'Path A: Begin weekly sessions (Professional Guidance). Path B: Structured self-optimization through journaling and philosophy. Path C: Group-based support or high-level masterminds.' 
      }
    ],
    'Business': [
      { 
        label: 'The Big Pivot', 
        title: 'Pivoting from a Service Agency to a Product-Led SaaS Company', 
        context: 'Our agency is profitable but we are trading hours for dollars. We have built an internal tool that solves a client pain point and we want to turn it into a SaaS product. This requires a total shift in DNA—from "yes-man" service culture to "no-man" product engineering. It means potentially firing current high-revenue clients to focus on a high-margin future that isnt guaranteed.', 
        constraints: 'Current cash runway: 8 months if we stop agency work. 60% of current staff have a service mindset, not a product mindset.', 
        options: 'Path A: All-in pivot (The "Burn the Boats" strategy). Path B: Run both models in parallel (The Slow Transition). Path C: Spin out the software as a separate entity with new funding.' 
      },
      { 
        label: 'EU Expansion', 
        title: 'Market Entry: Scaling Operations into the European Market', 
        context: 'We have seen significant organic growth from EU-based users. Expanding requires setting up a legal entity, navigating GDPR at a deeper level, and hiring local staff. The friction is the massive operational overhead and cultural nuance of the European market vs. the efficiency of staying focused on the US. Is the TAM expansion worth the complexity?', 
        constraints: 'Initial expansion budget: $500k. Regulatory landscape is shifting. Competitive local players are well-entrenched.', 
        options: 'Path A: Direct entry with a London or Berlin hub. Path B: Partnership with a local distributor (Low-Cap). Path C: Digital-only expansion with local currency support.' 
      }
    ],
    'Spiritual & Philosophical': [
      { 
        label: 'Sabbatical', 
        title: 'A 3-Month Sabbatical: Experiential Expansion vs. Career Momentum', 
        context: 'I have been working at a high intensity for six years. I feel a deep need for a "reset"—a solo journey through Southeast Asia to reconnect with my values. However, I am concerned that stepping out of the market now will result in "re-entry friction" and the loss of a promotion track that is currently opening up. Is the experiential wealth of travel worth the potential career deceleration?', 
        constraints: 'Total cost $15k. The industry is undergoing rapid AI-driven shifts. My current manager can only guarantee my role for 4 weeks of absence.', 
        options: 'Path A: Take the full 3-month sabbatical (Total Reset). Path B: A 2-week intensive "mini-break" followed by a role change. Path C: Negotiate a remote-work sabbatical (Digital Nomadism).' 
      },
      { 
        label: 'Ethical Dilemma', 
        title: 'Whistleblowing vs. Internal Reform: Navigating Systemic Misalignment', 
        context: 'I have discovered a systemic issue in my organization that violates my personal ethics but is technically legal within current regulations. I am weighing the impact of public disclosure (Whistleblowing) against the potential for slow, internal change. Whistleblowing may protect the public but will certainly end my career in this niche. Internal reform is safer but may be futile.', 
        constraints: 'Signed a restrictive NDA. Only 6 months of liquid savings. High risk of industry blacklisting.', 
        options: 'Path A: Public disclosure (Transparency). Path B: Lead an internal "Quiet Reform" effort. Path C: Resign quietly and distance yourself (Neutrality).' 
      },
      { 
        label: 'Digital Minimalism', 
        title: 'Deleting All Social Media Presence to Reclaim Cognitive Focus', 
        context: 'I feel my focus is being fragmented by algorithmic attention-traps. I am considering a total digital "blackout" to reclaim my mind. However, I worry about professional irrelevance and social isolation. The friction is between my "existential focus" and my "professional reach." Can I survive in the modern economy without a digital avatar?', 
        constraints: 'Professional network relies heavily on LinkedIn. Family lives abroad and uses social platforms for connection.', 
        options: 'Path A: Total account deletion (The Radical Break). Path B: Extreme curation (Remove all mobile apps, desktop-only). Path C: Scheduled usage (1 hour per week strictly).' 
      }
    ]
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex flex-col mb-6">
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {renderInputWrapper('title', UI_CONTENT.FORM.LABELS.TITLE, <input type="text" name="title" value={input.title} onChange={handleChange} placeholder={UI_CONTENT.FORM.PLACEHOLDERS.TITLE} className="w-full bg-slate-950/50 border border-slate-700/60 rounded-xl p-4 pr-16 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-inner font-medium text-lg" required />)}
        <div className="pt-2"><DocumentUpload onDocumentsChange={handleDocumentUpload} /></div>
        {renderInputWrapper('context', UI_CONTENT.FORM.LABELS.CONTEXT, <textarea name="context" value={input.context} onChange={handleChange} rows={5} placeholder={UI_CONTENT.FORM.PLACEHOLDERS.CONTEXT} className="w-full bg-slate-950/50 border border-slate-700/60 rounded-xl p-4 pb-14 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-inner resize-none leading-relaxed custom-scrollbar" required />, true, 'question')}
        <div className="grid grid-cols-1 gap-6">
          {renderInputWrapper('constraints', UI_CONTENT.FORM.LABELS.CONSTRAINTS, <textarea name="constraints" value={input.constraints} onChange={handleChange} rows={4} placeholder={UI_CONTENT.FORM.PLACEHOLDERS.CONSTRAINTS} className="w-full bg-slate-950/50 border border-slate-700/60 rounded-xl p-4 pb-14 pr-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-inner resize-none text-sm custom-scrollbar" />, true)}
          {renderInputWrapper('options', UI_CONTENT.FORM.LABELS.OPTIONS, <textarea name="options" value={input.options} onChange={handleChange} rows={4} placeholder={UI_CONTENT.FORM.PLACEHOLDERS.OPTIONS} className="w-full bg-slate-950/50 border border-slate-700/60 rounded-xl p-4 pb-14 pr-4 text-white placeholder-slate-600 focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 outline-none transition-all shadow-inner resize-none text-sm custom-scrollbar" />, true)}
        </div>
        <button type="submit" disabled={isLoading || !isContextReady} className={`w-full py-4 px-6 rounded-xl font-bold text-lg text-white shadow-xl transition-all duration-300 transform border border-white/10 ${isLoading ? 'bg-slate-800 cursor-not-allowed' : !isContextReady ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 bg-[length:200%_auto] hover:bg-right hover:scale-[1.01] active:scale-[0.99] shadow-indigo-500/25'}`}>
          {isLoading ? <span className="flex items-center justify-center gap-3"><svg className="animate-spin h-5 w-5 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span className="animate-pulse">{stages[loadingStage]}</span></span> : UI_CONTENT.FORM.BUTTONS.ANALYZE}
        </button>
      </form>
    </div>
  );
};

export default InputForm;

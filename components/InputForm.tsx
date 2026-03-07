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
        label: 'Parenthood', 
        title: 'Initiating Parenthood: Expanding the Family Unit', 
        context: 'We are contemplating having our first child. We both value our current autonomy, deep focus on professional projects, and the ability to travel spontaneously. However, we feel a growing desire for the profound meaning and biological legacy of parenthood. The friction is between the "infinite responsibility" of a child and the "finite freedom" of our current lifestyle. We worry about the impact on our relationship synergy and individual career trajectories.', 
        constraints: 'Current annual income is stable but childcare costs in our city are $3k/mo. No extended family nearby for support. Biological window is a factor.', 
        options: 'Path A: Begin trying for a child now (Total Lifestyle Shift). Path B: Freeze embryos/eggs to extend the window by 3 years. Path C: Defer for 18 months to hit a specific financial/career milestone.' 
      },
      { 
        label: 'Relationships', 
        title: 'Terminating a Long-Term Partnership vs. Salvaging Resonance', 
        context: 'I have been in a partnership for seven years. While there is deep history and mutual respect, the "shared vision" has begun to diverge significantly. We are operating on different emotional frequencies. I am debating whether to end the relationship to allow both parties to find true resonance elsewhere, or to commit to intensive reparative work. The friction is the "sunk cost" of our history vs. the "opportunity cost" of my future happiness.', 
        constraints: 'Shared lease and social circle. One partner is currently going through a professional crisis. Emotional exhaustion is high.', 
        options: 'Path A: Initiate a conscious decoupling (The Clean Break). Path B: Commit to a 6-month intensive "Relational Sabbatical" with therapy. Path C: Trial a temporary separation to test the value of independence.' 
      },
      { 
        label: 'Risking a Connection', 
        title: 'The "Direct Ask": Transitioning a Friendship to Romance', 
        context: 'I have developed deep feelings for a close friend. Our current dynamic is restorative and safe. I want to ask them out, but I recognize the high "frictional risk": if they don\'t reciprocate, the friendship may become too awkward to sustain. If I stay silent, I am living in a state of emotional repression. The friction is between the safety of the status quo and the speculative leap into romance.', 
        constraints: 'We are part of a tight-knit weekly social group. They recently ended another relationship. I value their presence in my life regardless of the outcome.', 
        options: 'Path A: The Direct Disclosure (High Risk/High Reward). Path B: Subtle escalation of physical/emotional proximity (The Test). Path C: Compartmentalization (Commitment to the Friendship).' 
      }
    ],
    'Career': [
      { 
        label: 'Starting a Company', 
        title: 'Founding a Venture: From Professional Security to Entrepreneurial Risk', 
        context: 'I have a validated idea for a new category of service. I am currently in a high-paying executive role. I am debating whether to resign and "burn the boats" to build this company or to stay in the safety of my career. The friction is between the "known ceiling" of my current path and the "unknown floor" of a startup. I hunger for the ownership, but fear the isolation and high failure rate of early-stage ventures.', 
        constraints: 'Personal runway: 12 months. No current outside funding. My spouse values financial stability highly.', 
        options: 'Path A: Resign and fund the MVP from savings (All-in). Path B: Build the MVP as a "Side-Quest" for 6 months while working. Path C: Seek a lead investor before resigning.' 
      },
      { 
        label: 'Industry Pivot', 
        title: 'Changing Industry: Transferring Human Capital to a New Domain', 
        context: 'I have 10 years of expertise in a traditional industry (e.g., Finance). I want to pivot into a frontier domain (e.g., Climate Tech). I am willing to take a pay cut for higher meaning, but I worry about "re-entry friction" and being perceived as a novice despite my senior years. The friction is between my "vertical expertise" and my "existential alignment."', 
        constraints: 'Domain-specific knowledge gaps. Current professional network is 90% in the old industry. Need to maintain 70% of current salary.', 
        options: 'Path A: Aggressive Pivot (Accept a mid-level role in the new domain). Path B: The "Bridge" Strategy (Consult in the new domain using old skills). Path C: Academic Reset (Masters or specialized bootcamp).' 
      },
      { 
        label: 'Internal Shift', 
        title: 'Changing Role: Individual Contributor to Management', 
        context: 'I am a top-tier Individual Contributor (IC). I have been offered a Management role. I enjoy the "craft" of the work, but I recognize that leverage only comes through leading others. I fear the loss of "flow state" in my craft and the friction of navigating organizational politics. The friction is between my love for the "how" and the necessity of the "who."', 
        constraints: 'Management role comes with a 20% raise. Team is currently under-performing. No prior formal management training.', 
        options: 'Path A: Accept the role (The Leadership Leap). Path B: Stay as a Principal IC (The Craft Path). Path C: Trial management for a "Bridge Project" before committing.' 
      }
    ],
    'Business': [
      { 
        label: 'Picking a Cofounder', 
        title: 'Selecting a Strategic Partner: Competence vs. Compatibility', 
        context: 'I am looking for a technical cofounder for my venture. I have two candidates: Candidate A is a world-class engineer with a difficult personality; Candidate B is a strong engineer who is perfectly aligned with my values. The friction is between "technical velocity" and "relational stability." I know that cofounder conflict is the #1 killer of startups, but so is slow execution.', 
        constraints: 'Need to ship the alpha in 3 months. Equity split must be determined now. Both candidates have competing offers.', 
        options: 'Path A: Select Candidate A (Velocity focus). Path B: Select Candidate B (Culture focus). Path C: Work with both on a 2-week "Trial Sprint" before choosing.' 
      },
      { 
        label: 'US Market Entry', 
        title: 'Geographic Expansion: Launching into the US Market', 
        context: 'Our product is dominant in its local market. We are ready for US entry. This requires a massive capital outlay, potential relocation of the leadership team, and competing in the most aggressive market on earth. The friction is between the "safe local fortress" and the "speculative global dominance." If we fail, we may bankrupt the local entity.', 
        constraints: 'Expansion budget: $2M. US competitors are 10x our size in funding. Regulatory hurdles are complex.', 
        options: 'Path A: Full US Launch (Relocate CEO, high spend). Path B: Digital-only "Beachhead" strategy. Path C: Partnership with a US-based incumbent.' 
      },
      { 
        label: 'Integrating AI', 
        title: 'Technological Evolution: Adding Generative AI to the Core Product', 
        context: 'We are a legacy SaaS platform. We need to integrate AI to remain relevant. I am debating whether to build our own proprietary models (high cost/moat) or to simply wrap an existing API (low cost/low moat). The friction is between "long-term defensibility" and "short-term speed-to-market." I worry that a "wrapper" is a commodity, but building from scratch will drain our resources.', 
        constraints: 'Engineering team has limited LLM experience. Investors are demanding an AI roadmap by Q3. High inference cost risk.', 
        options: 'Path A: Build a custom fine-tuned layer (Defensibility). Path B: Rapid API Integration (Speed). Path C: Acquire a small AI-native startup to integrate their tech.' 
      }
    ],
    'Life & Legacy': [
      { 
        label: 'Protest & Activism', 
        title: 'The Act of Dissent: Participating in High-Stakes Civic Protest', 
        context: 'A systemic issue has reached a breaking point. I feel a moral imperative to participate in a high-visibility protest. However, I occupy a professional role that values "neutrality," and my participation may result in reputational friction or job loss. The friction is between my "civic duty" and my "professional safety." Is the impact of my presence worth the risk to my livelihood?', 
        constraints: 'Company has a strict social media/public conduct policy. I am the primary earner for my family. The movement is controversial in my local community.', 
        options: 'Path A: Full Public Participation (Maximum Impact). Path B: "Silent Support" (Financial contribution/backstage help). Path C: Institutional Reform (Work for change from within my current role).' 
      },
      { 
        label: 'The Voting Choice', 
        title: 'Strategic Voting: Principal Alignment vs. Pragmatic Outcomes', 
        context: 'In an upcoming election, I am torn between a candidate who perfectly aligns with my values but has no chance of winning (The Idealist) and a candidate who is deeply flawed but can win and block a catastrophic alternative (The Pragmatist). The friction is between the "purity of my vote" and the "utility of the outcome." Am I a participant in a system or a witness to it?', 
        constraints: 'First-past-the-post voting system. High stakes for my specific industry. Family is split on the choice.', 
        options: 'Path A: Vote for the Idealist (Moral Alignment). Path B: Vote for the Pragmatist (Damage Control). Path C: Abstention as a form of protest.' 
      },
      { 
        label: 'Sabbatical', 
        title: 'A 3-Month Sabbatical: Experiential Expansion vs. Career Momentum', 
        context: 'I have been working at a high intensity for six years. I feel a deep need for a "reset"—a 3-month solo journey through Southeast Asia to reconnect with my values. However, I am concerned that stepping out of the market now will result in "re-entry friction" and the loss of a promotion track that is currently opening up. Is the experiential wealth of travel worth the potential career deceleration?', 
        constraints: 'Total cost $15k. The industry is undergoing rapid AI-driven shifts. My current manager can only guarantee my role for 4 weeks of absence.', 
        options: 'Path A: Take the full 3-month sabbatical (Total Reset). Path B: A 2-week intensive "mini-break" followed by a role change. Path C: Negotiate a remote-work sabbatical (Digital Nomadism).' 
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

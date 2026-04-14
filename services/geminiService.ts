import { GoogleGenAI, Type } from "@google/genai";
import { DecisionInput, CouncilResult, BrainstormResult, ChatMessage, ActionPlan, PartialCouncilResult, DecisionTree } from "../types";
import { AnalystAgent } from "./agents/AnalystAgent";
import { StrategistAgent } from "./agents/StrategistAgent";
import { SkepticAgent } from "./agents/SkepticAgent";
import { MediatorAgent } from "./agents/MediatorAgent";

/**
 * CORE SERVICE: Decision Council Orchestrator
 */

let aiInstance: GoogleGenAI | null = null;
const getAI = () => {
  const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'undefined') {
    throw new Error("Strategic API Key is missing. Please set VITE_GEMINI_API_KEY in your environment.");
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

const MASTER_MODEL = "gemini-3-flash-preview"; 

const truncateContext = (text: string, maxChars: number = 2000): string => {
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars) + "... [Context truncated for efficiency]";
};

/**
 * NEW STEP: Strategic Data Point Identification
 * Analyzes the request to find 8-10 essential metrics/factors.
 */
export async function identifyStrategicDataPoints(input: DecisionInput): Promise<string[]> {
  const prompt = `
    DECISION INQUIRY: "${input.title}"
    CONTEXT: ${input.context}
    
    As a Strategic Research Lead, analyze this request. 
    Identify 8-10 specific data points (metrics, dates, or qualitative factors) that are absolutely essential for a comprehensive, high-fidelity analysis of this specific topic.
    
    REQUIREMENTS:
    1. Precision: Use specific industry terms.
    2. Variety: Include a mix of financial, market, risk, and human factors.
    3. Actionability: These points will guide 4 expert agents in their research.
    
    Output ONLY a JSON array of 8-10 strings.
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MASTER_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        } as any,
        temperature: 0.2,
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Data Point Identification Error:", error);
    return [];
  }
}

export async function synthesizeOnly(input: DecisionInput, agents: PartialCouncilResult, humanPerspectives?: Contribution[]): Promise<CouncilResult> {
  const { analyst, strategist, skeptic, mediator } = agents;
  if (!analyst || !strategist || !skeptic || !mediator) {
    throw new Error("Missing agent perspectives for synthesis.");
  }

  let humanInsightAddendum = "";
  if (humanPerspectives && humanPerspectives.length > 0) {
    humanInsightAddendum = `
    INCORPORATED HUMAN PERSPECTIVES:
    ${humanPerspectives.map(p => `- ${p.name}: ${p.content}`).join('\n    ')}
    
    IMPORTANT: Integrate these human insights into your final verdict and refined paths. Weigh their contextual nuances against the agent models.
    `;
  }

  const prompt = `
    DECISION: "${input.title}"
    AGENT REPORTS:
    1. Analyst: ${analyst.analysis} (Score: ${analyst.score})
    2. Strategist: ${strategist.analysis} (Score: ${strategist.score})
    3. Skeptic: ${skeptic.analysis} (Score: ${skeptic.score})
    4. Mediator: ${mediator.analysis} (Score: ${mediator.score})
    ${humanInsightAddendum}

    Synthesize into a final recommendation.
    
    REQUIREMENTS:
    1. VERDICT: A clear, high-level summary of the best direction.
    2. RECOMMENDATION: Detailed justification for the verdict.
    3. REFINED PATHS: Provide 3-4 distinct strategic paths.
    4. METRICS: Provide scores 0-100 for risk, speed, cost, impact, feasibility.
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MASTER_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: synthesisSchema as any,
        temperature: 0.4,
      }
    });

    const synthesisData = JSON.parse(response.text || "{}");
    return { analyst, strategist, skeptic, mediator, synthesis: synthesisData, strategicDataPoints: [] };
  } catch (error) {
    console.warn("Synthesis fallback triggered in synthesizeOnly...", error);
    try {
      const ai = getAI();
      const fallbackResponse = await ai.models.generateContent({
        model: MASTER_MODEL,
        contents: `${prompt}\n\nIMPORTANT: Return a valid JSON object. Focus on Verdict and Recommendation.`,
        config: { responseMimeType: "application/json", temperature: 0.7 }
      });
      const synthesisData = JSON.parse(fallbackResponse.text || "{}");
      return { 
        analyst, strategist, skeptic, mediator, 
        synthesis: {
          verdict: synthesisData.verdict || "Conditional Proceed",
          recommendation: synthesisData.recommendation || "Synthesis partially failed.",
          refinedPaths: synthesisData.refinedPaths || ["Proceed with caution"],
          metrics: synthesisData.metrics || { risk: 50, speed: 50, cost: 50, impact: 50, feasibility: 50 }
        },
        strategicDataPoints: []
      };
    } catch (fallbackError) {
      throw new Error("Council Deadlock: Persistent synthesis failure.");
    }
  }
}

/**
 * CENTRALIZED RESEARCH PHASE
 * Gathers all necessary data points at the start to prevent redundant searching.
 */
export async function performComprehensiveResearch(input: DecisionInput, strategicPoints: string[]): Promise<string> {
  const prompt = `
    DECISION INQUIRY: "${input.title}"
    CONTEXT: ${input.context}
    CONSTRAINTS: ${input.constraints}
    STRATEGIC PILLARS TO INVESTIGATE:
    ${strategicPoints.map(p => `- ${p}`).join('\n')}
    
    You are a Senior Strategic Researcher. Your goal is to gather a comprehensive "Intelligence Dossier" for a Council of Experts.
    
    RESEARCH TASKS (Using googleSearch):
    1. Financial Benchmarks: Find specific ROI, CAGR, and cost data relevant to the strategic pillars.
    2. Competitive Intelligence: Identify top competitors, their recent pivots, and market positioning.
    3. Risk Landscape: Find historical failure modes, regulatory hurdles, and macro-economic threats.
    4. Human Factors: Look for culture trends, stakeholder sentiment, and ethical considerations in this sector.
    
    REQUIREMENTS:
    1. THOROUGHNESS: Provide detailed data points, not just summaries.
    2. CITATIONS: You MUST include the URLs for every major finding.
    3. STRUCTURE: Organize by "Financial", "Strategic", "Risk", and "Human/Ethical" categories.
    
    Output a detailed research report that will be used by other agents.
  `;

  try {
    const ai = getAI();
    // Using a slightly higher temperature for research to ensure broad exploration
    const response = await ai.models.generateContent({
      model: MASTER_MODEL,
      contents: prompt,
      config: { 
        tools: [{ googleSearch: {} }] as any,
        temperature: 0.5 
      }
    });

    let groundingText = "";
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      const chunks = response.candidates[0].groundingMetadata.groundingChunks;
      groundingText = "\n\nSOURCES FOUND:\n" + chunks.map((chunk: any) => 
        chunk.web?.uri ? `${chunk.web.title || 'Source'}: ${chunk.web.uri}` : ""
      ).filter(Boolean).join('\n');
    }

    return (response.text || "Research phase completed with no specific narrative output.") + groundingText;
  } catch (error) {
    console.error("Comprehensive Research Error:", error);
    return "The centralized research phase encountered an error. Agents will rely on internal training data.";
  }
}

async function determineNextAgent(input: DecisionInput, history: string, remainingAgents: string[], loopsLeft: number): Promise<string> {
  if (remainingAgents.length === loopsLeft) {
    return remainingAgents[0]; // Force remaining agents to run if we are running out of loops
  }
  
  const prompt = `
    DECISION INQUIRY: "${input.title}"
    CONTEXT: ${input.context}
    
    You are the Decision Council Supervisor.
    CONVERSATION HISTORY SO FAR:
    ${history || "No history yet. This is the first turn."}
    
    AGENTS WHO HAVEN'T SPOKEN YET: ${remainingAgents.join(', ')}
    LOOPS REMAINING: ${loopsLeft}
    
    Which agent should speak next to best advance this deliberation?
    Available agents: Analyst, Strategist, Skeptic, Mediator.
    If all agents have spoken and the conversation has reached a natural conclusion, you may output "End".
    
    Output ONLY a JSON object: { "nextAgent": "Analyst" | "Strategist" | "Skeptic" | "Mediator" | "End", "reason": "string" }
  `;
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MASTER_MODEL,
      contents: prompt,
      config: { responseMimeType: "application/json", temperature: 0.3 }
    });
    const data = JSON.parse(response.text || "{}");
    const agent = data.nextAgent;
    if (['Analyst', 'Strategist', 'Skeptic', 'Mediator', 'End'].includes(agent)) {
      return agent;
    }
  } catch (e) {}
  
  // Fallback to remaining
  return remainingAgents.length > 0 ? remainingAgents[0] : 'End';
}

export async function analyzeDecision(
  input: DecisionInput, 
  onProgress?: (partial: PartialCouncilResult) => void,
  cachedResearch?: string // NEW: To allow re-use of research
): Promise<CouncilResult> {
  const optimizedInput: DecisionInput = {
    ...input,
    context: truncateContext(input.context)
  };

  const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'undefined') {
     throw new Error("Strategic API Key is missing.");
  }

  // STEP 1: Identify Strategic Data Points
  const strategicPoints = await identifyStrategicDataPoints(optimizedInput);
  console.log("Strategic Data Points Identified:", strategicPoints);

  // STEP 2: Centralized Research (Cached or New)
  let researchData = cachedResearch;
  if (!researchData) {
    console.log("Initiating comprehensive research phase...");
    researchData = await performComprehensiveResearch(optimizedInput, strategicPoints);
    if (onProgress) onProgress({ researchData });
  } else {
    console.log("Utilizing existing research data.");
  }

  const analystAgent = new AnalystAgent(apiKey as string);
  const strategistAgent = new StrategistAgent(apiKey as string);
  const skepticAgent = new SkepticAgent(apiKey as string);
  const mediatorAgent = new MediatorAgent(apiKey as string);

  // STEP 3: Supervisor Loop Execution
  let historyTranscript = "";
  let remainingAgents = ['Analyst', 'Strategist', 'Skeptic', 'Mediator'];
  const maxLoops = 5;
  let currentLoop = 0;
  
  let analyst: any = null;
  let strategist: any = null;
  let skeptic: any = null;
  let mediator: any = null;

  while (currentLoop < maxLoops) {
    const loopsLeft = maxLoops - currentLoop;
    let nextAgentName = await determineNextAgent(optimizedInput, historyTranscript, remainingAgents, loopsLeft);
    
    // Force agent if we need to make sure everyone speaks
    if (remainingAgents.length === loopsLeft) {
      nextAgentName = remainingAgents[0];
    }
    
    if (nextAgentName === 'End') {
      if (remainingAgents.length > 0) nextAgentName = remainingAgents[0]; // don't end if someone hasn't spoken
      else break; // Natural end if everyone has spoken
    }

    console.log(`Supervisor selected: ${nextAgentName} (Loop ${currentLoop + 1}/${maxLoops})`);

    let agentResponse;
    try {
      if (nextAgentName === 'Analyst') {
        agentResponse = await analystAgent.run(optimizedInput, strategicPoints, historyTranscript, researchData);
        analyst = agentResponse;
        if (onProgress) onProgress({ analyst });
      } else if (nextAgentName === 'Strategist') {
        agentResponse = await strategistAgent.run(optimizedInput, strategicPoints, historyTranscript, researchData);
        strategist = agentResponse;
        if (onProgress) onProgress({ strategist });
      } else if (nextAgentName === 'Skeptic') {
        agentResponse = await skepticAgent.run(optimizedInput, strategicPoints, historyTranscript, researchData);
        skeptic = agentResponse;
        if (onProgress) onProgress({ skeptic });
      } else if (nextAgentName === 'Mediator') {
        agentResponse = await mediatorAgent.run(optimizedInput, strategicPoints, historyTranscript, researchData);
        mediator = agentResponse;
        if (onProgress) onProgress({ mediator });
      }
      
      remainingAgents = remainingAgents.filter(a => a !== nextAgentName);
      if (agentResponse) {
        historyTranscript += `\n\n--- ${nextAgentName} ---\n${agentResponse.analysis}`;
      }
    } catch (e) {
      console.error(`Error running ${nextAgentName}:`, e);
      // Fallback: just remove from remaining to avoid infinite crash loops
      remainingAgents = remainingAgents.filter(a => a !== nextAgentName);
    }

    currentLoop++;
  }

  const prompt = `
    DECISION: "${optimizedInput.title}"
    AGENT REPORTS:
    1. Analyst: ${analyst.analysis} (Score: ${analyst.score})
    2. Strategist: ${strategist.analysis} (Score: ${strategist.score})
    3. Skeptic: ${skeptic.analysis} (Score: ${skeptic.score})
    4. Mediator: ${mediator.analysis} (Score: ${mediator.score})

    Synthesize into a final recommendation.
    
    REQUIREMENTS:
    1. VERDICT: A clear, high-level summary of the best direction.
    2. RECOMMENDATION: Detailed justification for the verdict.
    3. REFINED PATHS: Provide 3-4 distinct strategic paths.
    4. METRICS: Provide scores 0-100 for risk, speed, cost, impact, feasibility.
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MASTER_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: synthesisSchema as any,
        temperature: 0.4, // Reduced slightly for more deterministic synthesis
      }
    });

    const synthesisData = JSON.parse(response.text || "{}");
    return { analyst, strategist, skeptic, mediator, synthesis: synthesisData, strategicDataPoints: strategicPoints };
  } catch (error) {
    console.warn("Primary synthesis failed, attempting safe fallback...", error);
    
    // FALLBACK: If JSON mode fails (common with complex schemas), try a simpler unstructured synthesis
    try {
      const ai = getAI();
      const fallbackResponse = await ai.models.generateContent({
        model: MASTER_MODEL,
        contents: `${prompt}\n\nIMPORTANT: Return a valid JSON object. If you cannot fulfill all requirements, focus on providing a clear Verdict and Recommendation at minimum.`,
        config: {
          responseMimeType: "application/json",
          temperature: 0.7, // Higher temperature for the retry to explore a different path
        }
      });
      
      const synthesisData = JSON.parse(fallbackResponse.text || "{}");
      
      // Ensure minimum fields exist
      const finalizedSynthesis = {
        verdict: synthesisData.verdict || "Conditional Proceed",
        recommendation: synthesisData.recommendation || "Synthesis partially failed. Please review individual agent perspectives for full context.",
        refinedPaths: synthesisData.refinedPaths || ["Proceed with caution", "Re-evaluate constraints"],
        metrics: synthesisData.metrics || { risk: 50, speed: 50, cost: 50, impact: 50, feasibility: 50 }
      };

      return { analyst, strategist, skeptic, mediator, synthesis: finalizedSynthesis, strategicDataPoints: strategicPoints };
    } catch (fallbackError) {
      console.error("Critical Failure: Master Model Deadlock", fallbackError);
      throw new Error("Council Deadlock: The Master Model failed to synthesize perspectives even after fallback.");
    }
  }
}

export async function exploreBrainstorm(field: 'constraints' | 'options' | 'context', title: string, context: string): Promise<BrainstormResult> {
  const prompt = `
    Decision Inquiry: ${title}. 
    Current Context: ${context}
    
    You are a Strategic Architect. Help the user flesh out the "${field}" field.
    
    REQUIREMENTS:
    1. STRUCTURED QUESTIONS: Generate 7 high-impact, binary or multiple-choice questions that clarify fundamental missing information.
    2. OPTIONS: Each question must have 3-4 distinct options (e.g., "Yes", "No", "Uncertain" or specific strategic choices).
    3. TONE: Sophisticated and precise.
    4. SUGGESTIONS: Provide 5 short one-line suggestions for topics they haven't mentioned yet.
    
    Output in JSON format matching the schema.
  `;
  
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MASTER_MODEL, 
      contents: prompt,
      config: { 
        responseMimeType: "application/json", 
        responseSchema: brainstormSchema as any, 
        temperature: 0.7 
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    console.error("Brainstorm error:", e);
    return { structuredQuestions: [], suggestions: [] };
  }
}

export async function chatWithCouncil(history: ChatMessage[], newMessage: string, councilResult: CouncilResult, input: DecisionInput): Promise<string> {
  const contextPrompt = `You are the Chairperson of the Decision Council. Verdict: ${councilResult.synthesis.verdict}.`;
  const chatHistoryGemini = [
    { role: 'user', parts: [{ text: contextPrompt }] },
    ...history.slice(-10).map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
  ];

  try {
    const ai = getAI();
    const chat = ai.chats.create({ model: "gemini-3-flash-preview", history: chatHistoryGemini });
    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "";
  } catch (e) {
    return "Error communicating with the council.";
  }
}

export async function generateActionPlan(input: DecisionInput, councilResult: CouncilResult): Promise<ActionPlan> {
  const prompt = `
    You are a Senior Project Manager and Strategic Consultant.
    Develop a comprehensive, tactical implementation roadmap for the following decision:
    
    TITLE: "${input.title}"
    DECISION CONTEXT: ${input.context}
    FINAL RECOMMENDATION: ${councilResult.synthesis.recommendation}
    
    AGENT PERSPECTIVES:
    - Analyst: ${councilResult.analyst.analysis}
    - Strategist: ${councilResult.strategist.analysis}
    - Skeptic: ${councilResult.skeptic.analysis}
    - Mediator: ${councilResult.mediator.analysis}

    REQUIREMENTS:
    1. METHODOLOGY: Use a hybrid of Agile (for execution) and OKRs (for measurement).
    2. STRUCTURE: Break the plan into 3-4 distinct chronological phases (e.g., Preparation, Pilot, Scale, Optimization).
    3. TASKS: For each phase, provide 3-4 specific, granular tasks.
    4. PITFALLS (New): For each phase, list 2-3 critical errors or "antipatterns" the user must avoid.
    5. SUCCESS CRITERIA (New): For each phase, list 2-3 specific conditions or metrics that must be met to safely transition to the next phase.
    6. MEASUREMENT: Each task MUST have a clear KPI (Key Performance Indicator).
    7. TRIPWIRES: Suggest 3 strategic 'Pivot Points' - specific conditions (market changes, technical failures, cost overruns) that should trigger a re-evaluation of the strategy.
    
    Output the plan in the requested JSON format.
  `;
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: actionPlanSchema as any, temperature: 0.4 }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Action Plan Error:", error);
    return { executiveSummary: "Failed to generate tactical plan.", phases: [], pivotPoints: [] };
  }
}

export async function generateDecisionTree(problem: string, councilResult?: CouncilResult): Promise<DecisionTree> {
  const prompt = `
    You are a Strategic Futurist and Decision Architect. 
    Analyze the following problem and generate a comprehensive Decision Tree of possible outcomes.
    
    PROBLEM: "${problem}"
    ${councilResult ? `COUNCIL VERDICT: "${councilResult.synthesis.verdict}"` : ''}
    ${councilResult ? `RECOMMENDATION: "${councilResult.synthesis.recommendation}"` : ''}
    
    REQUIREMENTS:
    1. STRUCTURE: Create a node-link diagram (Decision Tree).
    2. DEPTH & BRANCHING: The tree must go 4-5 levels deep.
    3. SENTIMENT TAGGING: 
       - Mark nodes that align with the RECOMMENDED path as "positive".
       - Mark nodes that represent high-risk, failed, or UNDESIRABLE outcomes as "negative".
       - All other nodes should be "neutral".
    4. NODES: Each node represents a state. Include a 'sentiment' field ('positive', 'negative', or 'neutral') in the data object.
    5. LAYOUT: Provide (x, y) coordinates for a hierarchical vertical layout.
    6. EDGES: Each edge represents a causal link.
    7. OUTPUT: Return ONLY a strict JSON object matching the schema.
  `;
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { 
        responseMimeType: "application/json", 
        responseSchema: decisionTreeSchema as any, 
        temperature: 0.6 
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Decision Tree Error:", error);
    return { nodes: [], edges: [] };
  }
}

const synthesisSchema = {
  type: Type.OBJECT,
  properties: {
    verdict: { type: Type.STRING },
    recommendation: { type: Type.STRING },
    refinedPaths: { type: Type.ARRAY, items: { type: Type.STRING } },
    metrics: {
      type: Type.OBJECT,
      properties: { 
        risk: { type: Type.NUMBER }, 
        speed: { type: Type.NUMBER }, 
        cost: { type: Type.NUMBER }, 
        impact: { type: Type.NUMBER },
        feasibility: { type: Type.NUMBER }
      },
      required: ["risk", "speed", "cost", "impact", "feasibility"]
    }
  },
  required: ["verdict", "recommendation", "refinedPaths", "metrics"]
};

const brainstormSchema = {
  type: Type.OBJECT,
  properties: { 
    structuredQuestions: { 
      type: Type.ARRAY, 
      items: { 
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["question", "options"]
      } 
    }, 
    suggestions: { type: Type.ARRAY, items: { type: Type.STRING } } 
  },
  required: ["structuredQuestions", "suggestions"]
};

const actionPlanSchema = {
  type: Type.OBJECT,
  properties: { 
    executiveSummary: { type: Type.STRING }, 
    phases: { 
      type: Type.ARRAY, 
      items: { 
        type: Type.OBJECT, 
        properties: { 
          name: { type: Type.STRING }, 
          duration: { type: Type.STRING }, 
          objective: { type: Type.STRING }, 
          tasks: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT, 
              properties: { 
                id: { type: Type.STRING }, 
                description: { type: Type.STRING }, 
                owner: { type: Type.STRING }, 
                kpi: { type: Type.STRING }, 
                status: { type: Type.STRING, enum: ["pending", "done"] } 
              }, 
              required: ["id", "description", "owner", "kpi", "status"] 
            } 
          },
          pitfalls: { type: Type.ARRAY, items: { type: Type.STRING } },
          successCriteria: { type: Type.ARRAY, items: { type: Type.STRING } }
        }, 
        required: ["name", "duration", "objective", "tasks", "pitfalls", "successCriteria"] 
      } 
    }, 
    pivotPoints: { 
      type: Type.ARRAY, 
      items: { 
        type: Type.OBJECT, 
        properties: { 
          trigger: { type: Type.STRING }, 
          reaction: { type: Type.STRING }, 
          owner: { type: Type.STRING } 
        }, 
        required: ["trigger", "reaction", "owner"] 
      } 
    } 
  },
  required: ["executiveSummary", "phases", "pivotPoints"]
};

const decisionTreeSchema = {
  type: Type.OBJECT,
  properties: {
    nodes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          position: {
            type: Type.OBJECT,
            properties: {
              x: { type: Type.NUMBER },
              y: { type: Type.NUMBER }
            },
            required: ["x", "y"]
          },
          data: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING },
              sentiment: { type: Type.STRING, enum: ["positive", "negative", "neutral"] }
            },
            required: ["label"]
          }
        },
        required: ["id", "position", "data"]
      }
    },
    edges: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          source: { type: Type.STRING },
          target: { type: Type.STRING },
          label: { type: Type.STRING }
        },
        required: ["id", "source", "target"]
      }
    }
  },
  required: ["nodes", "edges"]
};

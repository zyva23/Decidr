import { GoogleGenAI, Type } from "@google/genai";
import { DecisionInput, CouncilResult, BrainstormResult, ChatMessage, ActionPlan, PartialCouncilResult, DecisionTree, Contribution } from "../types";
import { AnalystAgent } from "./agents/AnalystAgent";
import { StrategistAgent } from "./agents/StrategistAgent";
import { SkepticAgent } from "./agents/SkepticAgent";
import { MediatorAgent } from "./agents/MediatorAgent";

/**
 * CORE SERVICE: Decision Council Orchestrator
 */

export interface CouncilTraceStep {
  phase: string;
  agent?: string;
  query: any;
  response: any;
  timestamp: number;
}

export interface CouncilTrace {
  steps: CouncilTraceStep[];
  fullTranscript: string;
}

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

const MASTER_MODEL = "gemini-1.5-flash"; 

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
 * CENTRALIZED RESEARCH PHASE (Robust Version)
 * Gathers all necessary data points with retry logic and query decomposition.
 */
export async function performComprehensiveResearch(input: DecisionInput, strategicPoints: string[], retries = 2): Promise<string> {
  const executeResearch = async (queryContext: string) => {
    const prompt = `
      DECISION INQUIRY: "${input.title}"
      CONTEXT: ${input.context}
      CONSTRAINTS: ${input.constraints}
      STRATEGIC PILLARS TO INVESTIGATE:
      ${queryContext}
      
      You are a Senior Strategic Researcher. Your goal is to gather a comprehensive "Intelligence Dossier" for a Council of Experts.
      
      RESEARCH TASKS (Using googleSearch):
      1. Financial Benchmarks: Find specific ROI, CAGR, and cost data.
      2. Competitive Intelligence: Identify top competitors and their recent pivots.
      3. Risk Landscape: Find historical failure modes and macro threats.
      4. Human Factors: Look for culture trends and stakeholder sentiment.
      
      REQUIREMENTS:
      - Provide detailed data points and URLs for findings.
      - If specific data is missing, find the closest industry proxy.
    `;

    try {
      const ai = getAI();
      return await ai.models.generateContent({
        model: MASTER_MODEL,
        contents: prompt,
        config: { 
          tools: [{ googleSearch: {} }] as any,
          temperature: 0.4 // Slightly lower for more focused searching
        }
      });
    } catch (e: any) {
      console.error("[RESEARCH] executeResearch API Error:", e);
      throw e;
    }
  };

  try {
    console.log(`[RESEARCH] Starting research for: ${input.title}`);
    let response = await executeResearch(strategicPoints.join('\n'));
    
    // Check if we got actual grounding or just a generic response
    const hasGrounding = !!response.candidates?.[0]?.groundingMetadata?.groundingChunks?.length;
    
    if (!hasGrounding && retries > 0) {
      console.warn(`[RESEARCH] Initial search yielded no grounding. Retrying with decomposed queries...`);
      // Decompose: Try searching for just the top 3 pillars to reduce complexity
      const subset = strategicPoints.slice(0, 3).join(', ');
      response = await executeResearch(`FOCUS ON THESE TOP PILLARS: ${subset}`);
    }

    let groundingText = "";
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      const chunks = response.candidates[0].groundingMetadata.groundingChunks;
      groundingText = "\n\nSOURCES FOUND:\n" + chunks.map((chunk: any) => 
        chunk.web?.uri ? `${chunk.web.title || 'Source'}: ${chunk.web.uri}` : ""
      ).filter(Boolean).join('\n');
    }

    const researchOutput = (response.text || "Research phase completed.") + groundingText;
    
    if (researchOutput.length < 100 && retries > 0) {
      throw new Error("Research output too sparse");
    }

    return researchOutput;

  } catch (error: any) {
    if (retries > 0) {
      const delay = 2000 * (3 - retries);
      console.error(`[RESEARCH] Error: ${error.message}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return performComprehensiveResearch(input, strategicPoints, retries - 1);
    }
    console.error("[RESEARCH] All research retries failed.", error);
    return "The centralized research phase encountered a persistent error. Agents will rely on internal training data and the provided context. [CAUTION: No external grounding active]";
  }
}

async function determineNextAgent(
  input: DecisionInput, 
  history: string, 
  turnCounts: Record<string, number>, 
  maxTurns: number,
  currentTurn: number
): Promise<string> {
  const agents = ['Analyst', 'Strategist', 'Skeptic', 'Mediator'];
  
  // Mandatory Round 1 & 2 logic:
  // We want to ensure each agent speaks at least twice.
  // Turns 0-3: Round 1 (All speak once)
  // Turns 4-7: Round 2 (All speak again, seeing Round 1 results)
  if (currentTurn < 8) {
    const roundIndex = currentTurn % 4;
    return agents[roundIndex];
  }

  // Round 3 (Turns 8-11): Supervisor selects based on remaining gaps or "End"
  const prompt = `
    DECISION INQUIRY: "${input.title}"
    CONTEXT: ${input.context}
    
    You are the Decision Council Supervisor.
    The Council has already completed 2 full rounds of deliberation.
    
    CONVERSATION HISTORY:
    ${history}
    
    TURN COUNTS:
    Analyst: ${turnCounts.Analyst}, Strategist: ${turnCounts.Strategist}, Skeptic: ${turnCounts.Skeptic}, Mediator: ${turnCounts.Mediator}
    
    We are now in the "Closing Round" (Max 4 additional turns). 
    Which agent should speak next to provide a final refinement or resolve a specific conflict?
    If the deliberation is complete and you have sufficient information for a Master Verdict, output "End".
    
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
  
  return 'End';
}

export async function analyzeDecision(
  input: DecisionInput, 
  onProgress?: (partial: PartialCouncilResult) => void,
  cachedResearch?: string 
): Promise<CouncilResult> {
  const trace: CouncilTrace = { steps: [], fullTranscript: "" };
  const addTrace = (phase: any, agent: string | undefined, query: string, response: any) => {
    const step = { phase, agent, query, response, timestamp: Date.now() };
    trace.steps.push(step);
    trace.fullTranscript += `\n\n[${new Date(step.timestamp).toISOString()}] PHASE: ${phase}${agent ? ` | AGENT: ${agent}` : ""}\nQUERY: ${query}\nRESPONSE: ${typeof response === 'string' ? response : JSON.stringify(response, null, 2)}`;
    console.log(`[TRACE][${phase}]`, agent || "", response);
  };

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
  addTrace('Identification', undefined, 'identifyStrategicDataPoints', strategicPoints);

  // STEP 2: Centralized Research
  let researchData = cachedResearch;
  if (!researchData) {
    researchData = await performComprehensiveResearch(optimizedInput, strategicPoints);
    addTrace('Research', 'Researcher', 'performComprehensiveResearch', researchData);
    if (onProgress) onProgress({ researchData });
  } else {
    addTrace('Research', 'Researcher', 'Cached Research Used', researchData);
  }

  const analystAgent = new AnalystAgent(apiKey as string);
  const strategistAgent = new StrategistAgent(apiKey as string);
  const skepticAgent = new SkepticAgent(apiKey as string);
  const mediatorAgent = new MediatorAgent(apiKey as string);

  // STEP 3: Supervisor Loop Execution (3 Rounds)
  let historyTranscript = "";
  const turnCounts: Record<string, number> = { Analyst: 0, Strategist: 0, Skeptic: 0, Mediator: 0 };
  const maxTurns = 12; // 2 mandatory rounds (8) + up to 4 optional supervisor turns
  let currentTurn = 0;
  
  let analyst: any = null;
  let strategist: any = null;
  let skeptic: any = null;
  let mediator: any = null;

  while (currentTurn < maxTurns) {
    const nextAgentName = await determineNextAgent(optimizedInput, historyTranscript, turnCounts, maxTurns, currentTurn);
    
    if (nextAgentName === 'End') {
      addTrace('Supervisor', 'Supervisor', 'Deliberation concluded by Supervisor.', { currentTurn, turnCounts });
      break;
    }

    console.log(`Council Turn ${currentTurn + 1}: ${nextAgentName}`);
    addTrace('Supervisor', 'Supervisor', `Selecting turn ${currentTurn + 1}`, { nextAgent: nextAgentName, currentTurn });

    let agentResponse: AgentResponse | undefined;
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
      
      if (agentResponse) {
        turnCounts[nextAgentName]++;
        addTrace('Agent', nextAgentName, `Turn ${turnCounts[nextAgentName]} for ${nextAgentName}`, agentResponse);
        historyTranscript += `\n\n--- ${nextAgentName} (Turn ${turnCounts[nextAgentName]}) ---\n${agentResponse.analysis}`;
      }
    } catch (e) {
      console.error(`Error running ${nextAgentName}:`, e);
    }

    currentTurn++;
  }

  const synthesisPrompt = `
    DECISION: "${optimizedInput.title}"
    AGENT REPORTS:
    1. Analyst: ${analyst?.analysis}
    2. Strategist: ${strategist?.analysis}
    3. Skeptic: ${skeptic?.analysis}
    4. Mediator: ${mediator?.analysis}
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MASTER_MODEL,
      contents: synthesisPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: synthesisSchema as any,
        temperature: 0.4,
      }
    });

    const synthesisData = JSON.parse(response.text || "{}");
    const finalResult = { analyst, strategist, skeptic, mediator, synthesis: synthesisData, strategicDataPoints: strategicPoints, researchData, trace };
    addTrace('Synthesis', 'Master', synthesisPrompt, synthesisData);
    return finalResult;
  } catch (error) {
    // Basic fallback result
    const finalResult = { 
      analyst, strategist, skeptic, mediator, 
      synthesis: { verdict: "Error in synthesis", recommendation: "Please check logs.", metrics: { risk: 0, speed: 0, cost: 0, impact: 0, feasibility: 0 }, refinedPaths: [] }, 
      strategicDataPoints: strategicPoints, 
      researchData, 
      trace 
    };
    return finalResult;
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
  const agentPerspectives = `
    AGENT REPORTS:
    1. Analyst: ${councilResult.analyst.analysis}
    2. Strategist: ${councilResult.strategist.analysis}
    3. Skeptic: ${councilResult.skeptic.analysis}
    4. Mediator: ${councilResult.mediator.analysis}
  `;

  const researchAddendum = councilResult.researchData ? `\n\nRESEARCH FINDINGS:\n${councilResult.researchData}` : "";

  const contextPrompt = `
    You are the Chairperson of the Decision Council. 
    The Council has reached a verdict for the decision: "${input.title}".
    
    VERDICT: ${councilResult.synthesis.verdict}
    RECOMMENDATION: ${councilResult.synthesis.recommendation}
    
    ${agentPerspectives}
    ${researchAddendum}
    
    Use the above reports and research to answer user questions about the decision. Be authoritative yet helpful.
    If the user provides new information, acknowledge it but stick to the council's current stance unless they specifically ask for a re-evaluation.
  `;

  const chatHistoryFormatted = history.slice(-10).map(m => 
    `${m.role === 'assistant' ? 'Chairperson' : 'User'}: ${m.content}`
  ).join('\n');

  const prompt = `
    ${contextPrompt}
    
    CHAT HISTORY:
    ${chatHistoryFormatted}
    
    NEW USER MESSAGE:
    ${newMessage}
    
    RESPONSE:
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MASTER_MODEL,
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    return response.text || "The Chairperson is currently unavailable.";
  } catch (e: any) {
    console.error("Chat with Council Error:", e);
    return `Error communicating with the council: ${e.message || 'Unknown error'}`;
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
      model: "gemini-1.5-flash",
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
      model: "gemini-1.5-flash",
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

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

export async function analyzeDecision(
  input: DecisionInput, 
  onProgress?: (partial: PartialCouncilResult) => void
): Promise<CouncilResult> {
  const optimizedInput: DecisionInput = {
    ...input,
    context: truncateContext(input.context)
  };

  const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey === 'undefined') {
     throw new Error("Strategic API Key is missing.");
  }

  const analystAgent = new AnalystAgent(apiKey as string);
  const strategistAgent = new StrategistAgent(apiKey as string);
  const skepticAgent = new SkepticAgent(apiKey as string);
  const mediatorAgent = new MediatorAgent(apiKey as string);

  const analystPromise = analystAgent.run(optimizedInput).then(res => {
    if (onProgress) onProgress({ analyst: res });
    return res;
  });
  const strategistPromise = strategistAgent.run(optimizedInput).then(res => {
    if (onProgress) onProgress({ strategist: res });
    return res;
  });
  const skepticPromise = skepticAgent.run(optimizedInput).then(res => {
    if (onProgress) onProgress({ skeptic: res });
    return res;
  });
  const mediatorPromise = mediatorAgent.run(optimizedInput).then(res => {
    if (onProgress) onProgress({ mediator: res });
    return res;
  });

  const [analyst, strategist, skeptic, mediator] = await Promise.all([
    analystPromise, strategistPromise, skepticPromise, mediatorPromise
  ]);

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
    3. REFINED PATHS: Provide 3-4 distinct, high-fidelity analyzed strategic paths based on the council's deliberation. Each path should be a short, actionable title (e.g., "The Conservative Pivot").
    4. METRICS: Provide scores between 0 and 100 for the radar chart.
  `;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MASTER_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: synthesisSchema as any,
        temperature: 0.5,
      }
    });

    const synthesisData = JSON.parse(response.text || "{}");
    return { analyst, strategist, skeptic, mediator, synthesis: synthesisData };
  } catch (error) {
    console.error("Error in synthesis:", error);
    throw error;
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

export async function generateDecisionTree(problem: string): Promise<DecisionTree> {
  const prompt = `
    You are a Strategic Futurist and Decision Architect. 
    Analyze the following problem and generate a comprehensive Decision Tree of possible outcomes.
    
    PROBLEM: "${problem}"
    
    REQUIREMENTS:
    1. STRUCTURE: Create a node-link diagram (Decision Tree).
    2. DEPTH & BRANCHING: The tree must go 4-5 levels deep. At each level, explore multiple divergent scenarios (at least 2-3 branches per node).
    3. SCENARIOS: Explicitly model different choices (e.g., Aggressive vs Conservative) and their cascading effects on Cost, Risk, and Strategic Impact.
    4. NODES: Each node represents a specific state, consequence, or scenario description.
    5. LAYOUT: Provide (x, y) coordinates for a clean, hierarchical vertical layout. (Root at top-center).
    6. EDGES: Each edge represents the causal link or choice. Provide clear labels for these choices.
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
              label: { type: Type.STRING }
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

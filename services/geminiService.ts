import { GoogleGenAI, Type } from "@google/genai";
import { DecisionInput, CouncilResult, BrainstormResult, ChatMessage, ActionPlan, PartialCouncilResult } from "../types";
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
    For the 'metrics' section, provide scores between 0 and 100:
    - risk: High risk = 100, Low risk = 0
    - speed: Fast execution = 100, Slow = 0
    - cost: High financial burden = 100, Low cost = 0
    - impact: High positive change = 100, Low = 0
    - feasibility: Easy to implement = 100, Difficult = 0
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
    4. MEASUREMENT: Each task MUST have a clear KPI (Key Performance Indicator).
    5. TRIPWIRES: Suggest 3 strategic 'Pivot Points' - specific conditions (market changes, technical failures, cost overruns) that should trigger a re-evaluation of the strategy.
    
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

const synthesisSchema = {
  type: Type.OBJECT,
  properties: {
    verdict: { type: Type.STRING },
    recommendation: { type: Type.STRING },
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
  required: ["verdict", "recommendation", "metrics"]
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
  properties: { executiveSummary: { type: Type.STRING }, phases: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, duration: { type: Type.STRING }, objective: { type: Type.STRING }, tasks: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, description: { type: Type.STRING }, owner: { type: Type.STRING }, kpi: { type: Type.STRING }, status: { type: Type.STRING, enum: ["pending", "done"] } }, required: ["id", "description", "owner", "kpi", "status"] } } }, required: ["name", "duration", "objective", "tasks"] } }, pivotPoints: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { trigger: { type: Type.STRING }, reaction: { type: Type.STRING }, owner: { type: Type.STRING } }, required: ["trigger", "reaction", "owner"] } } },
  required: ["executiveSummary", "phases", "pivotPoints"]
};

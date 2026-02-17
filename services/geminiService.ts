import { GoogleGenAI, Type } from "@google/genai";
import { DecisionInput, CouncilResult, BrainstormResult, ChatMessage, ActionPlan } from "../types";
import { AnalystAgent } from "./agents/AnalystAgent";
import { StrategistAgent } from "./agents/StrategistAgent";
import { SkepticAgent } from "./agents/SkepticAgent";
import { MediatorAgent } from "./agents/MediatorAgent";

// --- Service Configuration ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
const MASTER_MODEL = "gemini-3-flash-preview"; // Using Flash for all to preserve quota

const truncateContext = (text: string, maxChars: number = 2000): string => {
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars) + "... [Context truncated for efficiency]";
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Orchestrator Function ---
export async function analyzeDecision(input: DecisionInput): Promise<CouncilResult> {
  const optimizedInput: DecisionInput = {
    ...input,
    context: truncateContext(input.context)
  };

  const analystAgent = new AnalystAgent(process.env.API_KEY as string);
  const strategistAgent = new StrategistAgent(process.env.API_KEY as string);
  const skepticAgent = new SkepticAgent(process.env.API_KEY as string);
  const mediatorAgent = new MediatorAgent(process.env.API_KEY as string);

  // Staggering calls to avoid burst limit hits
  const analyst = await analystAgent.run(optimizedInput);
  await delay(800);
  const strategist = await strategistAgent.run(optimizedInput);
  await delay(800);
  const skeptic = await skepticAgent.run(optimizedInput);
  await delay(800);
  const mediator = await mediatorAgent.run(optimizedInput);
  await delay(800);

  const prompt = `
    DECISION: "${optimizedInput.title}"
    AGENT REPORTS:
    1. Analyst: ${analyst.analysis} (Score: ${analyst.score})
    2. Strategist: ${strategist.analysis} (Score: ${strategist.score})
    3. Skeptic: ${skeptic.analysis} (Score: ${skeptic.score})
    4. Mediator: ${mediator.analysis} (Score: ${mediator.score})

    Synthesize into a final recommendation.
  `;

  try {
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
  const fieldName = field === 'constraints' ? 'Constraint' : 'Option';
  const prompt = `Decision: ${title}. ${field === 'context' ? 'Help flesh out background.' : 'Suggest ' + fieldName + 's.'}`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview", 
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: brainstormSchema as any, temperature: 0.7 }
    });
    return JSON.parse(response.text || "{}");
  } catch (e) {
    return { questions: [], suggestions: [] };
  }
}

export async function chatWithCouncil(history: ChatMessage[], newMessage: string, councilResult: CouncilResult, input: DecisionInput): Promise<string> {
  const contextPrompt = `You are the Chairperson of the Decision Council. Verdict: ${councilResult.synthesis.verdict}.`;
  const chatHistoryGemini = [
    { role: 'user', parts: [{ text: contextPrompt }] },
    ...history.slice(-10).map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
  ];

  try {
    const chat = ai.chats.create({ model: "gemini-3-flash-preview", history: chatHistoryGemini });
    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "";
  } catch (e) {
    return "Error communicating with the council.";
  }
}

export async function generateActionPlan(input: DecisionInput, councilResult: CouncilResult): Promise<ActionPlan> {
  const prompt = `Plan for: ${input.title}. Recommendation: ${councilResult.synthesis.recommendation}.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: { responseMimeType: "application/json", responseSchema: actionPlanSchema as any, temperature: 0.4 }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return { executiveSummary: "Failed.", phases: [], pivotPoints: [] };
  }
}

const synthesisSchema = {
  type: Type.OBJECT,
  properties: {
    verdict: { type: Type.STRING },
    recommendation: { type: Type.STRING },
    metrics: {
      type: Type.OBJECT,
      properties: { risk: { type: Type.NUMBER }, speed: { type: Type.NUMBER }, cost: { type: Type.NUMBER }, impact: { type: Type.NUMBER } },
      required: ["risk", "speed", "cost", "impact"]
    }
  },
  required: ["verdict", "recommendation", "metrics"]
};

const brainstormSchema = {
  type: Type.OBJECT,
  properties: { questions: { type: Type.ARRAY, items: { type: Type.STRING } }, suggestions: { type: Type.ARRAY, items: { type: Type.STRING } } },
  required: ["questions", "suggestions"]
};

const actionPlanSchema = {
  type: Type.OBJECT,
  properties: { executiveSummary: { type: Type.STRING }, phases: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, duration: { type: Type.STRING }, objective: { type: Type.STRING }, tasks: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, description: { type: Type.STRING }, owner: { type: Type.STRING }, kpi: { type: Type.STRING }, status: { type: Type.STRING, enum: ["pending", "done"] } }, required: ["id", "description", "owner", "kpi", "status"] } } }, required: ["name", "duration", "objective", "tasks"] } }, pivotPoints: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { trigger: { type: Type.STRING }, reaction: { type: Type.STRING }, owner: { type: Type.STRING } }, required: ["trigger", "reaction", "owner"] } } },
  required: ["executiveSummary", "phases", "pivotPoints"]
};
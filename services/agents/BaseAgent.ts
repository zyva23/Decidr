
import { GoogleGenAI, Type } from "@google/genai";
import { DecisionInput, AgentResponse } from "../../types";

/**
 * SHARED AGENT SCHEMA
 * Defined here so all specific agents (Analyst, Strategist, etc.) return
 * uniform data structures that the UI can render predictably.
 */
export const agentResponseSchemaObj = {
  type: Type.OBJECT,
  properties: {
    analysis: { type: Type.STRING, description: "Detailed narrative (MAX 500 WORDS). MUST include 'Short-Term:' and 'Long-Term:' sections." },
    keyPoints: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-4 bullet points." },
    score: { type: Type.NUMBER, description: "0-100 score." },
    sequence: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          step: { type: Type.STRING },
          detail: { type: Type.STRING },
          impact: { type: Type.STRING, enum: ["positive", "negative", "neutral"] }
        },
        required: ["step", "detail", "impact"]
      },
      description: "Timeline events."
    },
    sources: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Citations found via search." },
    chartLabel: { type: Type.STRING, description: "Label for the Y-axis." },
    chartData: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
          value: { type: Type.NUMBER }
        },
        required: ["label", "value"]
      },
      description: "Data points."
    },
    alternativeScenarios: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          description: { type: Type.STRING },
          likelihood: { type: Type.STRING },
          outcome: { type: Type.STRING }
        },
        required: ["name", "description", "likelihood", "outcome"]
      },
      description: "Scenarios."
    }
  },
  required: ["analysis", "keyPoints", "score", "sequence", "chartLabel", "chartData", "alternativeScenarios"]
};

/**
 * BASE AGENT CLASS
 * Provides core utilities for LLM interaction, including:
 * - Exponential backoff for rate limiting.
 * - Robust JSON cleaning for LLM outputs.
 * - Unified grounding source extraction.
 */
export abstract class BaseAgent {
  protected ai: GoogleGenAI;
  protected modelName: string = "gemini-3-flash-preview";

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Helper to handle transient API errors (like 429 quota limits)
   */
  protected async withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      const isTransient = error.message?.includes('429') || error.status === 429 || 
                          error.message?.includes('503') || error.status === 503;
      if (retries > 0 && isTransient) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.withRetry(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  /**
   * Cleans LLM text output by stripping markdown code blocks and 
   * attempting multiple parsing strategies to recover a valid JSON object.
   */
  protected cleanAndParseJSON(text: string): any {
    if (!text) return null;
    let cleanText = text.trim();
    // Strip ```json ... ``` blocks if present
    const markdownMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch) {
      cleanText = markdownMatch[1].trim();
    }
    try {
      return JSON.parse(cleanText);
    } catch (e) {
      try {
        const sanitized = cleanText.replace(/\n/g, "\\n");
        return JSON.parse(sanitized);
      } catch (e2) {
        // Find first { and last } as a last resort
        const start = text.indexOf('{');
        const end = text.lastIndexOf('}');
        if (start !== -1 && end !== -1) {
            try {
                return JSON.parse(text.substring(start, end + 1));
            } catch (e3) { }
        }
      }
      return null;
    }
  }

  abstract run(input: DecisionInput, strategicDataPoints?: string[], conversationHistory?: string, researchData?: string): Promise<AgentResponse>;

  /**
   * Centralizes the actual call to the Gemini API.
   * Handles tool injection and metadata (grounding) extraction.
   */
  protected async executeCall(
    systemPrompt: string, 
    userPrompt: string, 
    tools: any[] = [],
    temperature: number = 0.7
  ): Promise<any> {
    const config: any = { 
      temperature,
      responseMimeType: "application/json",
      responseSchema: agentResponseSchemaObj as any
    };
    if (tools.length > 0) {
      config.tools = tools;
    }

    const contents = `${systemPrompt}\n\nUSER INPUT:\n${userPrompt}\n\nOUTPUT INSTRUCTIONS:\nReturn valid JSON adhering to schema. Analysis max 500 words.`;

    return this.withRetry(async () => {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: contents,
        config: config
      });

      const text = response.text || "";
      let sources: string[] = [];
      // Extract Google Search grounding URLs if they exist
      if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
         const chunks = response.candidates[0].groundingMetadata.groundingChunks;
         chunks.forEach((chunk: any) => {
           if (chunk.web?.uri) {
             sources.push(chunk.web.title ? `${chunk.web.title}: ${chunk.web.uri}` : chunk.web.uri);
           }
         });
      }

      const data = this.cleanAndParseJSON(text);
      if (!data) throw new Error("Failed to parse agent response");
      data.sources = [...(data.sources || []), ...sources];
      data._rawTrace = { systemPrompt, userPrompt }; // Attach trace info
      return data;
    });
  }
}

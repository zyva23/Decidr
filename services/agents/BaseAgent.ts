import { GoogleGenAI, Type } from "@google/genai";
import { DecisionInput, AgentResponse } from "../../types";

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

export abstract class BaseAgent {
  protected ai: GoogleGenAI;
  protected modelName: string = "gemini-3-flash-preview";

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  protected async withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (retries > 0 && (error.message?.includes('429') || error.status === 429)) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.withRetry(fn, retries - 1, delay * 2);
      }
      throw error;
    }
  }

  protected cleanAndParseJSON(text: string): any {
    if (!text) return null;
    let cleanText = text.trim();
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

  abstract run(input: DecisionInput): Promise<AgentResponse>;

  protected async executeCall(
    systemPrompt: string, 
    userPrompt: string, 
    tools: any[] = [],
    temperature: number = 0.7
  ): Promise<any> {
    const config: any = { temperature };
    if (tools.length > 0) {
      config.tools = tools;
    } else {
      config.responseMimeType = "application/json";
      config.responseSchema = agentResponseSchemaObj as any;
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
      return data;
    });
  }
}
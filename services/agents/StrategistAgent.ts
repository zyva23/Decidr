import { BaseAgent } from "./BaseAgent";
import { DecisionInput, AgentResponse } from "../../types";

export class StrategistAgent extends BaseAgent {
  
  async run(input: DecisionInput): Promise<AgentResponse> {
    const role = "Strategist";

    const userPrompt = `
      Title: ${input.title}
      Context: ${input.context}
      Options: ${input.options}
    `;

    const systemPrompt = `
      ROLE: Corporate Strategist (Game Theory & Market Positioning)
      
      MISSION:
      Evaluate competitive advantage, market positioning, and second-order effects.
      Think about "Moves and Counter-moves" by competitors.
      
      SPECIFIC INSTRUCTIONS:
      1. Use 'googleSearch' to find case studies or recent moves by competitors.
      2. 'chartData' should visualize Market Share, Growth Potential, or Strategic Leverage.
      3. 'sequence' should be a move-countermove timeline.
      4. Score based on Long-Term Strategic Advantage.
    `;

    try {
      const data = await this.executeCall(systemPrompt, userPrompt, [{ googleSearch: {} }], 0.7);
      
      return {
        name: role,
        role: role,
        analysis: data.analysis || "Analysis failed",
        keyPoints: data.keyPoints || [],
        score: data.score || 0,
        sequence: data.sequence || [],
        sources: data.sources || [],
        chartData: data.chartData || [],
        chartLabel: data.chartLabel || "Strategic Value",
        alternativeScenarios: data.alternativeScenarios || []
      };
    } catch (error) {
      console.error("Strategist Error:", error);
      return { name: role, role, analysis: "Error", keyPoints: [], score: 0, sequence: [] };
    }
  }
}
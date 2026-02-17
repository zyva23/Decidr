import { BaseAgent } from "./BaseAgent";
import { DecisionInput, AgentResponse } from "../../types";

export class MediatorAgent extends BaseAgent {
  
  async run(input: DecisionInput): Promise<AgentResponse> {
    const role = "Mediator";

    const userPrompt = `
      Title: ${input.title}
      Context: ${input.context}
    `;

    const systemPrompt = `
      ROLE: The Mediator (Stakeholder & Cultural Lens)
      
      MISSION:
      Evaluate the impact on people: Team morale, company culture, ethics, and brand reputation.
      Find the compromise between the Analyst (Money) and Skeptic (Risk).
      
      SPECIFIC INSTRUCTIONS:
      1. Focus on emotional intelligence and ethics.
      2. 'chartData' should visualize Stakeholder Buy-in or Team Morale.
      3. 'sequence' should be a Change Management timeline.
      4. Score based on Alignment/Ethics.
    `;

    try {
      const data = await this.executeCall(systemPrompt, userPrompt, [], 0.6);
      
      return {
        name: role,
        role: role,
        analysis: data.analysis || "Analysis failed",
        keyPoints: data.keyPoints || [],
        score: data.score || 0,
        sequence: data.sequence || [],
        sources: data.sources || [],
        chartData: data.chartData || [],
        chartLabel: data.chartLabel || "Stakeholder Buy-in",
        alternativeScenarios: data.alternativeScenarios || []
      };
    } catch (error) {
      console.error("Mediator Error:", error);
      return { name: role, role, analysis: "Error", keyPoints: [], score: 0, sequence: [] };
    }
  }
}
import { BaseAgent } from "./BaseAgent";
import { DecisionInput, AgentResponse } from "../../types";

export class AnalystAgent extends BaseAgent {
  
  async run(input: DecisionInput): Promise<AgentResponse> {
    const role = "Analyst";
    
    // Optimization: Analyst cares about Constraints (Budget) and Options. 
    // We can prioritize these in the prompt or strip out emotional context if needed later.
    const userPrompt = `
      Title: ${input.title}
      Context: ${input.context}
      Constraints: ${input.constraints}
      Options: ${input.options}
    `;

    const systemPrompt = `
      ROLE: Quantitative Analyst (Financial & Data Focused)
      
      MISSION:
      Perform a Cost-Benefit Analysis (CBA) and evaluate ROI.
      You must be objective, skeptical of optimism, and number-driven.
      
      SPECIFIC INSTRUCTIONS:
      1. Use 'googleSearch' to find real market data, competitor pricing, or industry benchmarks.
      2. 'chartData' MUST visualize a financial metric (e.g. Net Profit, CAC, Runway).
      3. 'sequence' must be a financial timeline (Cash flow events).
      4. Score the decision based on Financial Feasibility (0=Bankrupt, 100=High Profit).
    `;

    try {
      // Analyst uses search tools
      const data = await this.executeCall(systemPrompt, userPrompt, [{ googleSearch: {} }], 0.4);
      
      return {
        name: role,
        role: role,
        analysis: data.analysis || "Analysis failed",
        keyPoints: data.keyPoints || [],
        score: data.score || 0,
        sequence: data.sequence || [],
        sources: data.sources || [],
        chartData: data.chartData || [],
        chartLabel: data.chartLabel || "Financial Metric",
        alternativeScenarios: data.alternativeScenarios || []
      };
    } catch (error) {
      console.error("Analyst Error:", error);
      return this.getErrorResponse(role, error);
    }
  }

  private getErrorResponse(role: string, error: any): AgentResponse {
    return {
      name: role,
      role: role,
      analysis: `Error: ${error.message}`,
      keyPoints: [],
      score: 0,
      sequence: []
    };
  }
}
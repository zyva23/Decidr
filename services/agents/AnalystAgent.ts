
import { BaseAgent } from "./BaseAgent";
import { DecisionInput, AgentResponse } from "../../types";

/**
 * THE ANALYST (Enhanced)
 * Focuses on "The Hard Numbers".
 * Uses Google Search to find industry benchmarks, historical ROI data, 
 * and specific market sizing (TAM/SAM/SOM) to ground the decision in reality.
 */
export class AnalystAgent extends BaseAgent {
  
  async run(input: DecisionInput): Promise<AgentResponse> {
    const role = "Analyst";
    
    const userPrompt = `
      DECISION BRIEF:
      Title: ${input.title}
      Context: ${input.context}
      Constraints: ${input.constraints}
      Options: ${input.options}
    `;

    const systemPrompt = `
      ROLE: Senior Quantitative Analyst & Financial Modeler
      
      MISSION:
      Ground this decision in hard data. Your report must move beyond intuition into empirical evidence.
      
      RESEARCH REQUIREMENTS (Using googleSearch):
      1. Sourcing: Find at least 2 specific industry benchmarks (e.g., 'Average conversion for X industry', 'Standard CAC for Y').
      2. Market Trends: Identify 2024-2025 growth rates (CAGR) for this specific sector.
      3. Cost Basis: If a budget is mentioned, find current market rates for required resources.
      
      OUTPUT REQUIREMENTS:
      - ANALYSIS NARRATIVE: Must include a 'Data-Driven Benchmarks' section. MAX 500 WORDS.
      - SCORE: 0-100 based on 'Expected Net Present Value' and 'Resource Efficiency'.
      - CHART DATA: Must represent a 12-month ROI projection. Labels MUST be 'Month 1', 'Month 2', etc.
      - CHART LABEL: Use 'Projected Monthly Cash Balance' or 'Cumulative ROI (%)'.
      - SEQUENCE: Map 4 critical financial milestones. Each 'step' MUST include a time marker (e.g., 'Q1:', 'Month 6:').
      - CITATIONS: You MUST cite specific URLs found during search in the 'sources' array.
    `;

    try {
      // executeCall handles the tool integration and JSON parsing logic defined in BaseAgent
      const data = await this.executeCall(systemPrompt, userPrompt, [{ googleSearch: {} }], 0.3);
      
      return {
        name: role,
        role: role,
        analysis: data.analysis || "Financial simulation failed to produce a narrative.",
        keyPoints: data.keyPoints || [],
        score: data.score || 0,
        sequence: data.sequence || [],
        sources: data.sources || [],
        chartData: data.chartData || [],
        chartLabel: data.chartLabel || "Projected Financial Value",
        alternativeScenarios: data.alternativeScenarios || []
      };
    } catch (error) {
      console.error("Analyst Execution Error:", error);
      return this.getErrorResponse(role, error);
    }
  }

  private getErrorResponse(role: string, error: any): AgentResponse {
    return {
      name: role,
      role: role,
      analysis: `The Analyst encountered a calculation error: ${error.message}. Please check your context for missing data points.`,
      keyPoints: ["Model execution failure", "Insufficient data for financial grounding"],
      score: 0,
      sequence: []
    };
  }
}

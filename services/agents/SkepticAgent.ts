import { BaseAgent } from "./BaseAgent";
import { DecisionInput, AgentResponse } from "../../types";

export class SkepticAgent extends BaseAgent {
  
  async run(input: DecisionInput, strategicDataPoints?: string[], conversationHistory?: string, researchData?: string): Promise<AgentResponse> {
    const role = "Skeptic";

    const historyContext = conversationHistory ? `\nPREVIOUS COUNCIL DISCUSSION:\n${conversationHistory}` : "";
    const researchContext = researchData ? `\nCENTRALIZED RESEARCH FINDINGS:\n${researchData}` : "";

    // Optimization: The Skeptic focuses on Constraints and Options (Failure points).
    const userPrompt = `
      Title: ${input.title}
      Context: ${input.context}
      Constraints: ${input.constraints}
      Options: ${input.options}
      ${historyContext}
      ${researchContext}
    `;

    const strategicContext = strategicDataPoints && strategicDataPoints.length > 0 
      ? `\nCORE STRATEGIC DATA POINTS TO ANALYZE:\n${strategicDataPoints.map(p => `- ${p}`).join('\n')}`
      : "";

    const systemPrompt = `
      ROLE: The Skeptic (Pre-Mortem Analysis)
      
      MISSION:
      Assume the decision has ALREADY FAILED. Work backward to find the fatal flaw.
      Identify regulatory risks, hidden costs, and over-optimism.
      ${strategicContext}
      
      SPECIFIC INSTRUCTIONS:
      1. Do NOT look for upsides. Look for cracks in the plan.
      2. 'chartData' should visualize Risk Probability or Severity.
      3. 'sequence' should be the "Chain of Failure". Each 'step' MUST include a time marker (e.g., 'Day 1:', 'Week 2:', 'Month 6:').
      4. Score based on Safety/Risk (0=Extremely Risky, 100=Safe).
    `;

    try {
      // Skeptic often works better with pure reasoning, but we can enable tools if specific reg check is needed.
      // For now, keeping it pure LLM for speed/cost.
      const data = await this.executeCall(systemPrompt, userPrompt, [], 0.8); // Higher temp for creative failure scenarios
      
      return {
        name: role,
        role: role,
        analysis: data.analysis || "Analysis failed",
        keyPoints: data.keyPoints || [],
        score: data.score || 0,
        sequence: data.sequence || [],
        sources: data.sources || [],
        chartData: data.chartData || [],
        chartLabel: data.chartLabel || "Risk Severity",
        alternativeScenarios: data.alternativeScenarios || []
      };
    } catch (error) {
      console.error("Skeptic Error:", error);
      return { name: role, role, analysis: "Error", keyPoints: [], score: 0, sequence: [] };
    }
  }
}
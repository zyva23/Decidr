
import { BaseAgent } from "./BaseAgent";
import { DecisionInput, AgentResponse } from "../../types";

/**
 * THE ANALYST (Enhanced)
 * Focuses on "The Hard Numbers".
 * Uses Google Search to find industry benchmarks, historical ROI data, 
 * and specific market sizing (TAM/SAM/SOM) to ground the decision in reality.
 */
export class AnalystAgent extends BaseAgent {
  
  async run(
    input: DecisionInput, 
    strategicDataPoints?: string[], 
    conversationHistory?: string, 
    researchData?: string,
    previousResponse?: AgentResponse
  ): Promise<AgentResponse> {
    const role = "Analyst";
    
    const historyContext = conversationHistory ? `\nPREVIOUS COUNCIL DISCUSSION:\n${conversationHistory}` : "";
    const researchContext = researchData ? `\nCENTRALIZED RESEARCH FINDINGS:\n${researchData}` : "";
    const previousNarrativeContext = previousResponse ? `\nYOUR PREVIOUS ANALYSIS:\n${previousResponse.analysis}` : "";

    const userPrompt = `
      DECISION BRIEF:
      Title: ${input.title}
      Context: ${input.context}
      Constraints: ${input.constraints}
      Options: ${input.options}
      ${historyContext}
      ${researchContext}
      ${previousNarrativeContext}
    `;

    const stabilityClause = previousResponse ? `
      STABILITY PROTOCOL:
      1. Review the NEW INSIGHTS and PREVIOUS ANALYSIS.
      2. Determine the "Blast Radius": Does the new data fundamentally alter your previous calculations or conclusions?
      3. If YES: Rewrite ONLY the affected sections. Keep the rest of the text identical.
      4. If NO: You MUST return your previous 'analysis' text word-for-word. 
      5. CHANGE SUMMARY: In the 'changeSummary' field, briefly explain what you updated and why (or state 'No changes required').
    ` : "";

    const strategicContext = strategicDataPoints && strategicDataPoints.length > 0 
      ? `\nCORE STRATEGIC DATA POINTS TO ANALYZE:\n${strategicDataPoints.map(p => `- ${p}`).join('\n')}`
      : "";

    const systemPrompt = `
      ROLE: Senior Quantitative Analyst & Financial Modeler
      
      MISSION:
      Ground this decision in hard data. Your report must move beyond intuition into empirical evidence.
      Use the provided CENTRALIZED RESEARCH FINDINGS as your primary data source.
      ${strategicContext}
      ${stabilityClause}
      
      PHASE 2: EXECUTION & CROSS-QUESTIONING PROTOCOL:
      1. ANALYTICAL SYNTHESIS: Analyze industry benchmarks, historical ROI data, and specific market sizing from the provided research for the CORE STRATEGIC DATA POINTS.
      2. THE "CHECK YOUR WORK" LOOP: After gathering data, perform a mental stress test. Ask yourself: "If I were a skeptic trying to debunk this result, what missing data point would I point to?" 
      3. TARGETED GAP-FILLING: Use the research findings to specifically address the gaps identified in your stress test.
      
      OUTPUT REQUIREMENTS:
      - ANALYSIS NARRATIVE: Must include a 'Data-Driven Benchmarks' section and a 'Skeptic Cross-Examination' section. MAX 500 WORDS.
      - SCORE: 0-100 based on 'Expected Net Present Value' and 'Resource Efficiency'.
      - CHART DATA: Must represent a 12-month ROI projection. Labels MUST be 'Month 1', 'Month 2', etc.
      - CHART LABEL: Use 'Projected Monthly Cash Balance' or 'Cumulative ROI (%)'.
      - SEQUENCE: Map 4 critical financial milestones. Each 'step' MUST include a time marker (e.g., 'Q1:', 'Month 6:').
      - CITATIONS: Extract and list URLs from the research findings in the 'sources' array.
    `;

    try {
      const data = await this.executeCall(systemPrompt, userPrompt, [], 0.3);
      
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
        alternativeScenarios: data.alternativeScenarios || [],
        changeSummary: data.changeSummary || "Analysis complete."
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

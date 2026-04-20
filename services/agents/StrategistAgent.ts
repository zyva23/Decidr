
import { BaseAgent } from "./BaseAgent";
import { DecisionInput, AgentResponse } from "../../types";

/**
 * THE STRATEGIST (Enhanced)
 * Focuses on "The Chessboard".
 * Uses Google Search to identify competitor moves, disruptive technologies, 
 * and specific case studies of similar strategic decisions.
 */
export class StrategistAgent extends BaseAgent {
  
  async run(
    input: DecisionInput, 
    strategicDataPoints?: string[], 
    conversationHistory?: string, 
    researchData?: string,
    previousResponse?: AgentResponse
  ): Promise<AgentResponse> {
    const role = "Strategist";

    const historyContext = conversationHistory ? `\nPREVIOUS COUNCIL DISCUSSION:\n${conversationHistory}` : "";
    const researchContext = researchData ? `\nCENTRALIZED RESEARCH FINDINGS:\n${researchData}` : "";
    const previousNarrativeContext = previousResponse ? `\nYOUR PREVIOUS ANALYSIS:\n${previousResponse.analysis}` : "";

    const userPrompt = `
      STRATEGIC BRIEF:
      Title: ${input.title}
      Context: ${input.context}
      Proposed Options: ${input.options}
      ${historyContext}
      ${researchContext}
      ${previousNarrativeContext}
    `;

    const stabilityClause = previousResponse ? `
      STABILITY PROTOCOL:
      1. Review the NEW INSIGHTS and PREVIOUS ANALYSIS.
      2. Determine the "Blast Radius": Does the new data fundamentally alter your previous strategic pathway selection?
      3. If YES: Rewrite ONLY the affected sections. Keep the rest of the text identical.
      4. If NO: You MUST return your previous 'analysis' text word-for-word. 
      5. CHANGE SUMMARY: In the 'changeSummary' field, briefly explain what you updated and why (or state 'No changes required').
    ` : "";

    const strategicContext = strategicDataPoints && strategicDataPoints.length > 0 
      ? `\nCORE STRATEGIC DATA POINTS TO ANALYZE:\n${strategicDataPoints.map(p => `- ${p}`).join('\n')}`
      : "";

    const systemPrompt = `
      ROLE: Lead Corporate Strategist & Game Theorist
      
      MISSION:
      Map the competitive landscape. Your goal is to identify if this decision leads to a sustainable competitive advantage (Moat) or a commodity trap.
      Use the provided CENTRALIZED RESEARCH FINDINGS as your primary data source for market intelligence.
      ${strategicContext}
      ${stabilityClause}

      STRATEGIC EVALUATION PROTOCOL:
      1. PATHWAY GENERATION: Generate three distinct strategic pathways for this dilemma based on research.
      2. RISK/UPSIDE SCORING: For each pathway, assign a 'Risk Score' and an 'Upside Score' from 1-10.
      3. CRITICAL CRITIQUE: Provide a concise critique of all three pathways.
      4. STRATEGIC SELECTION: Discard the two pathways with the worst risk/reward ratio.
      5. FINAL RECOMMENDATION: Your final analysis and recommendation must be based SOLELY on the surviving "Alpha" pathway.
      
      OUTPUT REQUIREMENTS:
      - ANALYSIS NARRATIVE: Must focus on the selected Alpha Pathway. Include sections for 'Competitive Counter-Moves' and 'Alpha Pathway Justification'. MAX 500 WORDS.
      - SCORE: 0-100 based on 'Defensibility' and 'Long-term Market Positioning'.
      - SEQUENCE: Map the 'Move' (Decision) followed by 2 'Counter-moves' (Competitor reactions). Each 'step' MUST include a relative time marker (e.g., 'Immediate:', 'Month 3:', 'Year 1:').
      - CITATIONS: Extract and list URLs from the research findings in the 'sources' array.
    `;

    try {
      // Temperature 0.6 allows for creative strategic thinking while keeping research findings grounded
      const data = await this.executeCall(systemPrompt, userPrompt, [], 0.6);
      
      return {
        name: role,
        role: role,
        analysis: data.analysis || "Strategic simulation failed to reach a conclusion.",
        keyPoints: data.keyPoints || [],
        score: data.score || 0,
        sequence: data.sequence || [],
        sources: data.sources || [],
        chartData: data.chartData || [],
        chartLabel: data.chartLabel || "Strategic Leverage Index",
        alternativeScenarios: data.alternativeScenarios || [],
        changeSummary: data.changeSummary || "Strategy development complete."
      };
    } catch (error) {
      console.error("Strategist Execution Error:", error);
      return { 
        name: role, 
        role, 
        analysis: "Strategy engine offline. Could not map competitive landscape.", 
        keyPoints: ["Research failure", "Competitive data unavailable"], 
        score: 0, 
        sequence: [],
        changeSummary: "Error occurred during strategy development."
      };
    }
  }
}

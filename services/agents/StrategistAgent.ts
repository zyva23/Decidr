
import { BaseAgent } from "./BaseAgent";
import { DecisionInput, AgentResponse } from "../../types";

/**
 * THE STRATEGIST (Enhanced)
 * Focuses on "The Chessboard".
 * Uses Google Search to identify competitor moves, disruptive technologies, 
 * and specific case studies of similar strategic decisions.
 */
export class StrategistAgent extends BaseAgent {
  
  async run(input: DecisionInput): Promise<AgentResponse> {
    const role = "Strategist";

    const userPrompt = `
      STRATEGIC BRIEF:
      Title: ${input.title}
      Context: ${input.context}
      Proposed Options: ${input.options}
    `;

    const systemPrompt = `
      ROLE: Lead Corporate Strategist & Game Theorist
      
      MISSION:
      Map the competitive landscape. Your goal is to identify if this decision leads to a sustainable competitive advantage (Moat) or a commodity trap.
      
      RESEARCH REQUIREMENTS (Using googleSearch):
      1. Competitor Intelligence: Search for the top 3 players in this space. What are their recent (last 6 months) pivots or acquisitions?
      2. Case Study: Find one specific historical example of a company making a similar decision. Note the outcome.
      3. Market Forces: Evaluate using Porter's Five Forces, specifically looking for 'Barrier to Entry' and 'Threat of Substitutes' data.
      
      OUTPUT REQUIREMENTS:
      - ANALYSIS NARRATIVE: Must include sections for 'Competitive Counter-Moves' and 'Case Study Reference'. MAX 500 WORDS.
      - SCORE: 0-100 based on 'Defensibility' and 'Long-term Market Positioning'.
      - SEQUENCE: Map the 'Move' (Decision) followed by 2 'Counter-moves' (Competitor reactions).
    `;

    try {
      // Temperature 0.6 allows for creative strategic thinking while keeping search results grounded
      const data = await this.executeCall(systemPrompt, userPrompt, [{ googleSearch: {} }], 0.6);
      
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
        alternativeScenarios: data.alternativeScenarios || []
      };
    } catch (error) {
      console.error("Strategist Execution Error:", error);
      return { 
        name: role, 
        role, 
        analysis: "Strategy engine offline. Could not map competitive landscape.", 
        keyPoints: ["Research failure", "Competitive data unavailable"], 
        score: 0, 
        sequence: [] 
      };
    }
  }
}

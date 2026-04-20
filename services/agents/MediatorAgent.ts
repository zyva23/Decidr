import { BaseAgent } from "./BaseAgent";
import { DecisionInput, AgentResponse } from "../../types";

export class MediatorAgent extends BaseAgent {
  
  async run(
    input: DecisionInput, 
    strategicDataPoints?: string[], 
    conversationHistory?: string, 
    researchData?: string,
    previousResponse?: AgentResponse
  ): Promise<AgentResponse> {
    const role = "Mediator";

    const historyContext = conversationHistory ? `\nPREVIOUS COUNCIL DISCUSSION:\n${conversationHistory}` : "";
    const researchContext = researchData ? `\nCENTRALIZED RESEARCH FINDINGS:\n${researchData}` : "";
    const previousNarrativeContext = previousResponse ? `\nYOUR PREVIOUS ANALYSIS:\n${previousResponse.analysis}` : "";

    const userPrompt = `
      Title: ${input.title}
      Context: ${input.context}
      ${historyContext}
      ${researchContext}
      ${previousNarrativeContext}
    `;

    const stabilityClause = previousResponse ? `
      STABILITY PROTOCOL:
      1. Review the NEW INSIGHTS and PREVIOUS ANALYSIS.
      2. Determine the "Blast Radius": Does the new data fundamentally alter your previous perspective on stakeholder impact?
      3. If YES: Rewrite ONLY the affected sections. Keep the rest of the text identical.
      4. If NO: You MUST return your previous 'analysis' text word-for-word. 
      5. CHANGE SUMMARY: In the 'changeSummary' field, briefly explain what you updated and why (or state 'No changes required').
    ` : "";

    const strategicContext = strategicDataPoints && strategicDataPoints.length > 0 
      ? `\nCORE STRATEGIC DATA POINTS TO ANALYZE:\n${strategicDataPoints.map(p => `- ${p}`).join('\n')}`
      : "";

    const systemPrompt = `
      ROLE: The Mediator (Stakeholder & Cultural Lens)
      
      MISSION:
      Evaluate the impact on people: Team morale, company culture, ethics, and brand reputation.
      Find the compromise between the Analyst (Money) and Skeptic (Risk).
      ${strategicContext}
      ${stabilityClause}
      
      SPECIFIC INSTRUCTIONS:
      1. Focus on emotional intelligence and ethics.
      2. 'chartData' should visualize Stakeholder Buy-in or Team Morale.
      3. 'sequence' should be a Change Management timeline. Each 'step' MUST include a time marker (e.g., 'Kickoff:', 'Month 1:', 'Steady State:').
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
        alternativeScenarios: data.alternativeScenarios || [],
        changeSummary: data.changeSummary || "Mediation complete."
      };
    } catch (error) {
      console.error("Mediator Error:", error);
      return { 
        name: role, 
        role, 
        analysis: "Error", 
        keyPoints: [], 
        score: 0, 
        sequence: [],
        changeSummary: "Error occurred during mediation."
      };
    }
  }
}
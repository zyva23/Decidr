# Decidr - Project Context (Development Branch)

## Advanced Architecture Overview
This branch implements the **Supervisor-Worker Orchestration** pattern, moving beyond parallel agent execution into a sequential, multi-round deliberation system.

## Tech Stack
- **Frontend**: React 19, Tailwind CSS, Recharts (Visualizations).
- **AI Core**: `@google/genai` (Gemini API - Gemini 3 Flash).
- **Orchestration**: Custom Supervisor-Worker loop with stateful conversation history.
- **Backend/DB**: Firebase Firestore for session persistence and **Research Caching**.

## Core Council Workflows (v2.0)
1. **Strategic Pillar Identification**: 
   - Before deliberation, a "Research Lead" agent analyzes the user request to identify 8-10 essential data points (metrics, benchmarks, or qualitative factors).
2. **Centralized Research Phase (The Dossier)**:
   - A robust research module runs once to gather factual data for all identified pillars using `googleSearch`.
   - **Resilience**: Features exponential retry logic and "Query Decomposition" (breaking complex searches into granular steps) to ensure successful grounding.
   - **Fact Alignment**: All expert agents operate from this shared "Intelligence Dossier" to ensure data consistency.
3. **The Deliberation (3-Round Loop)**:
   - **Round 1 (Foundation)**: All 4 agents (Analyst, Strategist, Skeptic, Mediator) speak once to establish their initial positions.
   - **Round 2 (Cross-Examination)**: Agents speak a second time, specifically reacting to and critiquing the findings of their peers.
   - **Round 3 (Supervisor Closing)**: An intelligent Supervisor analyzes the conversation gaps and specifically directs agents for final refinements (Max 12 total turns).
4. **Enhanced Agent Protocols**:
   - **The Analyst**: Uses a "Check Your Work" loop to identify and fill analytical gaps.
   - **The Strategist**: Generates 3 pathways, scores them for risk/reward, and promotes only the single "Alpha Pathway."
5. **System Transparency (Tracing)**:
   - Implements a `CouncilTrace` logging system that records every internal query, supervisor decision, and raw agent response for auditing and testing.

## Stability & Integrity
- **Research Caching**: Research findings are stored in the session. Re-running an analysis reuses cached data to save API costs and improve speed.
- **Supervisor Guards**: The supervisor ensures all agents speak at least twice before allowing the deliberation to conclude.
- **Grounding Validation**: The system verifies the presence of external sources before proceeding to the deliberation phase.

## Environment Requirements
- `VITE_GEMINI_API_KEY`: Strategic API access.
- `VITE_FIREBASE_*`: Full Firebase suite.
- **Domain Authorization**: Dev Vercel domains must be added to Firebase Authorized Domains to prevent `auth/unauthorized-domain` errors.

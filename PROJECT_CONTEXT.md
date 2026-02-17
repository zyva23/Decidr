# Decision Council AI - Project Context

## Overview
An agentic Decision Support System (DSS) that uses Google Gemini (Gemini 3 Flash) to simulate a "Council of Experts" deliberating on complex user-provided problems.

## Tech Stack
- **Frontend**: React 19, Tailwind CSS, Recharts (Visualizations), Lucide-inspired SVG icons.
- **AI Backend**: `@google/genai` (Gemini API) using a multi-agent orchestration pattern.
- **Database/Auth**: Firebase (Google Cloud) for session persistence and activity logging.
- **Infrastructure**: Vite (Build system), Vercel (Deployment config).

## Architecture & Data Flow
1. **Input Phase**: `InputForm.tsx` captures title, context, constraints, and options. Includes AI-assisted brainstorming.
2. **Analysis Phase**: `geminiService.ts` orchestrates 4 distinct agents in parallel:
   - **Analyst**: Quantitative/Financial lens.
   - **Strategist**: Competitive/Game Theory lens.
   - **Skeptic**: Pre-mortem/Risk lens.
   - **Mediator**: Stakeholder/Ethical lens.
3. **Synthesis Phase**: A master model (`gemini-3-flash-preview`) evaluates all agent reports and provides a final verdict and radar metrics.
4. **Persistence**: Sessions are saved to `localStorage` (Guest) or Firestore (Auth).

## Key Logic Locations
- **Orchestration**: `src/services/geminiService.ts`
- **Structured AI Output**: `src/services/agents/BaseAgent.ts` (Handles JSON parsing and retries).
- **Visualization Mapping**: `src/components/RadarViz.tsx` and `src/components/AgentCard.tsx`.

## Critical Environment Variables
- `API_KEY`: Gemini API Key.
- `VITE_FIREBASE_*`: Firebase configuration keys.

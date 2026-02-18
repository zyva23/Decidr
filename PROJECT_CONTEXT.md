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
3. **Synthesis Phase**: A master model (`gemini-3-flash-preview`) evaluates all agent reports and provides a final verdict and a 5-point radar metric (Risk, Speed, Cost, Impact, Feasibility).
4. **Planning Phase (Optional)**: If the user approves, a PM agent generates a tactical roadmap (Agile/OKR hybrid) with specific tasks, KPIs, and strategic pivot points.
5. **Persistence**: Sessions are synced between `localStorage` and Firebase Firestore (if authenticated).

## Key Logic Locations
- **Orchestration**: `src/services/geminiService.ts`
- **Structured AI Output**: `src/services/agents/BaseAgent.ts` (Handles JSON parsing and 429/503 retries).
- **Visualization Mapping**: `src/components/RadarViz.tsx` (5-point pentagon) and `src/components/VerdictElaboration.tsx` (Multi-track timeline and ROI chart).
- **Tactical Roadmap**: `src/components/ActionPlanModal.tsx` and `generateActionPlan` service.
- **Reporting**: `src/services/pdfService.ts` (A4 export with automatic alignment and citations page).
- **Storage**: `src/services/storageService.ts` (Hybrid Firestore/Local sync).

## Critical Environment Variables
- `VITE_GEMINI_API_KEY`: Gemini API Key.
- `VITE_FIREBASE_*`: Firebase configuration keys.

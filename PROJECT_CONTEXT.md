# Decidr - Project Context (Development Branch)

## Advanced Architecture Overview
This branch implements the **Supervisor-Worker Orchestration** pattern, moving beyond parallel agent execution into a sequential, multi-round deliberation system.

## Tech Stack
- **Frontend**: React 19, Tailwind CSS, Recharts (Visualizations).
- **AI Core**: `@google/genai` (Gemini API - Gemini 3 Flash / Fallback to 1.5 Flash).
- **Orchestration**: Custom Supervisor-Worker loop with stateful conversation history.
- **Backend/DB**: Firebase Firestore for session persistence and **Recursive Research Caching**.

## Core Council Workflows (v3.0 - Intelligence Layer)
1. **Recursive Research Engine**: 
   - **Phase 1 (Broad Horizon Scan)**: Analyzes the request across financial, competitor, and macro-economic pillars.
   - **Phase 2 (Gap Analysis Deep-Dive)**: The model identifies "Missing Data Gaps" from Phase 1 and executes targeted second-round searches.
   - **Grounding Density**: Aims for 15-20 distinct, URL-backed data points per Intelligence Dossier.
2. **Causal Reasoning Layer**:
   - Implements a "Logic Audit" between versions. 
   - When a user re-deliberates, the Council generates a human-readable **Causal Summary** explaining exactly *why* the strategy pivoted based on specific input changes.
3. **High-Fidelity Audit Trail**:
   - Stores full **CouncilSnapshots** (Inputs + 4 Agent Reports + Verdict) for every iteration.
   - Visual word-based diffing engine highlights added/removed intelligence across all archetypes.
4. **Self-Thought Cognitive Synthesis**:
   - User thoughts are refined via the Council's intelligence before being committed.
   - Converts raw queries into sophisticated strategic insights grounded in existing session data.
5. **Dynamic Model Fallback**:
   - Prioritizes Gemini 3 Flash for advanced reasoning.
   - Automatically pivots to Gemini 1.5 Flash if 404/Quota errors are detected, ensuring high uptime.

## UI/UX Engineering
- **Centered Modal Architecture**: Standardized centered, non-scrolling modals for all deep-dives (Sources, Timeline, Audit).
- **Smart-Anchor Tooltips**: Dynamic positioning to prevent screen-edge clipping of deliberation context.
- **Collapsible Workspace**: Left panel can be shrunk for a focused, full-screen strategic view.
- **Master Verdict Hierarchy**: Prioritizes Master Verdict → Human Intelligence → Agent Archetypes.

## Stability & Performance
- **Deliberation Timer**: Measures and logs precise execution time (ms) for performance benchmarking.
- **Error Telemetry**: Logs exactly when and why a deliberation failed, including the elapsed time at failure.
- **Firestore Sanitizer**: Recursive utility to strip `undefined` values, preventing fatal Firebase serialization errors.

## Environment Requirements
- `VITE_GEMINI_API_KEY`: Strategic API access.
- `VITE_FIREBASE_*`: Full Firebase suite.
- **Domain Authorization**: Dev Vercel domains must be added to Firebase Authorized Domains.

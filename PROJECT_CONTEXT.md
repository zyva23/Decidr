# Decidr - Project Context

## Overview
Decidr is a sophisticated, intellectually-toned Decision Support System (DSS). It uses a multi-agent orchestration pattern (Google Gemini 3 Flash) to simulate a "Council of Experts" that deliberates on complex life and business inquiries.

## Tech Stack
- **Frontend**: React 19, Tailwind CSS, Recharts (Visualizations).
- **AI Core**: `@google/genai` (Gemini API) using parallel streaming agents.
- **Backend/DB**: Firebase Firestore for session persistence, user profiles, and activity logging.
- **PDF Core**: `@react-pdf/renderer` & `html2canvas` for reporting; `pdfjs-dist` (legacy build) for extraction.
- **OCR**: `tesseract.js` for image-based text extraction.

## Core Philosophical Workflows
1. **The Inquiry (Input)**: 
   - `InputForm.tsx` supports high-fidelity, "thick descriptions" of complex realities.
   - **Smart Context Architect**: A guided wizard that helps users build nuanced briefs.
   - **High-Fidelity Scenarios**: Detailed, category-specific templates (Personal, Career, Business, Life & Legacy) that model deep strategic inquiry.
2. **The Deliberation (Analysis)**:
   - `geminiService.ts` runs 4 specialized agents in parallel (The Rationalist, The Architect, The Realist, The Ethicist).
   - **Partial Recovery Logic**: If the synthesis step fails, individual agent reports are preserved, allowing for a **Synthesis Retry** without re-running agents.
3. **The Synthesis (Verdict)**:
   - A master model evaluations reports to provide a final verdict, 5-point radar metrics, and **Refined Strategic Paths**.
   - **Council Deadlock Fallback**: Implements a robust fallback mechanism that automatically attempts a safer synthesis if the primary model encounters parsing or complexity issues.
4. **The Interval of Intent (Commitment)**:
   - `MindfulCommitModal.tsx` enforces a 60-second pause with a pulsing breathing graphic for final gut resonance.
5. **The Strategic Continuity (Linking)**:
   - Inquiries can be linked into **Evolutionary Branches**, either automatically via "Evolve to Next" or manually via **Link from History**.
6. **Executive Reporting**:
   - `DecisionPDF` (via `@react-pdf/renderer`) generates cinematic A4 reports featuring:
     - Premium dark-themed Cover Page with SVG graphics.
     - Auto-repeating footers with smart page numbering.
     - Detailed **Execution Roadmaps** with phased tasks, KPIs, pitfalls, and success criteria.
     - Visual agent identities (avatars and archetype labels) matching the website.

## Key System Modules
- **State Management**: `App.tsx` handles parallel agent state, cloud-synced progression (XP/Rank), and **Session Transition Guards** (confirmations for unsaved/ongoing work).
- **Cloud Storage**: `storageService.ts` implements a "Cloud-First" merge logic ensuring history and rank sync across all devices.
- **Agent Logic**: Individual agent prompts reside in `src/services/agents/`.
- **UI Content**: Centrally managed in `src/constants/uiContent.ts` to ensure a consistent, sophisticated tone.

## Stability & Integrity
- **Error Handling**: Uses a Global Error Boundary and specific synthesis fallback paths to prevent deliberation deadlocks.
- **PDF Stability**: Switched from jsPDF to a declarative flexbox engine (`@react-pdf/renderer`) to eliminate text overlapping and layout artifacts.
- **Vite/Build Optimization**: Implemented Buffer polyfills and pako resolution aliases to support complex Node-centric libraries in browser environments.

## Environment Requirements
- `VITE_GEMINI_API_KEY`: Strategic API access.
- `VITE_FIREBASE_*`: Full Firebase suite for Auth and Cloud Firestore.
- `EINVALIDTAGNAME`: Avoid '#' in package dependencies.

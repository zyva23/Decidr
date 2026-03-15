# Decidr - Project Context

## Overview
Decidr is a sophisticated, intellectually-toned Decision Support System (DSS). It uses a multi-agent orchestration pattern (Google Gemini 3 Flash) to simulate a "Council of Experts" that deliberates on complex life and business inquiries.

## Tech Stack
- **Frontend**: React 19, Tailwind CSS, Recharts (Visualizations).
- **AI Core**: `@google/genai` (Gemini API) using parallel streaming agents.
- **Backend/DB**: Firebase Firestore for session persistence, user profiles, and activity logging.
- **PDF Core**: `jspdf` & `html2canvas` for reporting; `pdfjs-dist` (legacy build) for extraction.
- **OCR**: `tesseract.js` for image-based text extraction.

## Core Philosophical Workflows
1. **The Inquiry (Input)**: 
   - `InputForm.tsx` supports "thick descriptions" of frictional realities.
   - **Smart Context Architect**: A 7-question guided wizard that helps users build high-fidelity briefs.
   - **Categorized Scenarios**: Relatable templates across Personal, Career, Business, and **Life & Legacy**.
2. **The Deliberation (Analysis)**:
   - `geminiService.ts` runs 4 specialized agents in parallel (The Rationalist, The Architect, The Realist, The Ethicist).
   - Results stream in real-time, guarded by a global **Error Boundary** and robust **Skeleton Loaders**.
3. **The Synthesis (Verdict)**:
   - A master model evaluates reports to provide a final verdict, 5-point radar metrics, and **Refined Strategic Paths**.
4. **The Interval of Intent (Commitment)**:
   - `MindfulCommitModal.tsx` enforces a 60-second pause with a pulsing breathing graphic for final gut resonance.
5. **The Strategic Continuity (Linking)**:
   - Inquiries can be linked into **Evolutionary Branches**, either automatically via "Evolve to Next" or manually via **Link from History**.
6. **Executive Reporting**:
   - `pdfService.ts` generates premium A4 reports with Title Pages, Table of Contents, and Archetype Icons.

## Key System Modules
- **State Management**: `App.tsx` handles parallel agent state, cloud-synced progression (XP/Rank), and session lifecycle.
- **Cloud Storage**: `storageService.ts` implements a "Cloud-First" merge logic ensuring history and rank sync across all devices.
- **Agent Logic**: Individual agent prompts reside in `src/services/agents/`.
- **UI Content**: Centrally managed in `src/constants/uiContent.ts` to ensure a consistent, sophisticated tone.

## Stability & Integrity
- **Error Handling**: Uses a Global Error Boundary to prevent "black screen" crashes, providing diagnostic logs instead.
- **PDF Stability**: Uses PDF.js legacy build with a version-locked CDN worker (4.4.168) to ensure reliable extraction in browser environments.
- **Null Safety**: All streaming components (AgentCards, RadarViz) implement defensive rendering for partially loaded data.

## Environment Requirements
- `VITE_GEMINI_API_KEY`: Strategic AI access.
- `VITE_FIREBASE_*`: Full Firebase suite for Auth and Cloud Firestore.
- `EINVALIDTAGNAME`: Avoid '#' in package dependencies.

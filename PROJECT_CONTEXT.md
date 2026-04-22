# Decidr - Project Context (Development Branch)

## Advanced Architecture Overview
This branch implements the **Supervisor-Worker Orchestration** pattern, featuring an **Incremental Delta-Update** system that minimizes text churn while surgically incorporating new data.

## Core Council Workflows (v4.7 - High-Fidelity Refinements)

1. **Recruitment Gate & Identity Flow**:
   - **The Strategic Summons**: Shared links trigger a "Recruitment Gate" for unauthenticated users (Verified Expert vs. Guest Observer).
   - **Automatic Session Recovery**: Persistent `localStorage` tracking for `pendingShareId` ensures seamless transition after login.
   - **One-Shot Guest Policy**: To maintain deliberation focus, guest users are restricted to a single primary perspective. The interface "seals" the form upon submission, unless a revision is explicitly requested.

2. **High-Fidelity Human Intelligence Layer**:
   - **Chronological Intelligence Feed**: Strict timestamp-based sorting ensures the newest strategic data points always anchor the top of the feed.
   - **Identity-Aware Labeling**: Differentiates between "High-Fidelity Strategic Thoughts" (Owner-refined) and "Strategic Thoughts" (Peer-submitted).
   - **Interactive Refinement Flow**: "Refinement-first" logic where the Council synthesizes chat history (<100 words) and presents an **editable modal** for final polishing.
   - **Authoritative Management**: Owners can **Select**, **Discard**, or **Permanently Delete** self-insights with robust Firestore `deleteDoc` integration.

3. **Intelligent Personalization (The Background Agent)**:
   - **Automated Enrichment**: "Personalize with AI" extracts Situational Nuances and Frictional Realities in the background.
   - **Cache-Driven Assistance**: AI suggestions populate a non-destructive cache, keeping user input clean while providing tactical choices (Questions for Context, Real Options for Constraints).

4. **UI/UX Engineering (Integrated Aesthetic)**:
   - **Full-Modal Loading**: The "Architecting Intelligence" animation now covers the entire Council modal level, providing high-fidelity visual feedback during synthesis.
   - **Custom Prompt Engine**: Enhanced `PromptModal` with support for editable text areas and field-specific logic.

## Stability & Performance
- **Dynamic Model Fallback**: Proactive detection of 503/429 errors with automatic stable-model pivoting.
- **Incremental Data Patching**: Contributions stored in a dedicated `human_perspectives` Firestore sub-collection with identity-based security rules.

## Environment Requirements
- `VITE_GEMINI_API_KEY`: Strategic API access.
- `VITE_FIREBASE_*`: Full Firebase suite.
- **Domain Authorization**: Dev Vercel domains must be added to Firebase Authorized Domains.

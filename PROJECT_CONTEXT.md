# Decidr - Project Context (Development Branch)

## Advanced Architecture Overview
This branch implements the **Supervisor-Worker Orchestration** pattern, featuring an **Incremental Delta-Update** system that minimizes text churn while surgically incorporating new data.

## Core Council Workflows (v4.6 - The Expert Network)

1. **Recruitment Gate & Identity Flow**:
   - **The Strategic Summons**: Shared links now trigger a "Recruitment Gate" for unauthenticated users, offering two distinct paths:
     - *Verified Expert*: Triggers Google Auth to link identity and unlock full deliberation power.
     - *Guest Observer*: Preserves anonymous exploration and contribution.
   - **Automatic Session Recovery**: Authenticated users bypass the gate; newly logged-in users are automatically restored to their pending shared session via `localStorage` state persistence.
   - **Persistent Identity**: Implemented `guestId` tracking and `UserProfile.displayName` synchronization to ensure high-fidelity attribution in the intelligence feed.

2. **High-Fidelity Human Intelligence Layer**:
   - **Intelligent Chat Synthesis**: "Incorporate Insights" now uses a specialized LLM lead to transform raw chat logs into concise (<100 words), professional strategic thoughts.
   - **Interactive Refinement Flow**: New "refinement-first" logic where the Council architects the insight and presents an **editable modal** to the user for final polishing before integration.
   - **Dynamic Batch Management**: The system intelligently tracks which chat messages have been synthesized and disables incorporation buttons when no new strategic data exists.
   - **Surgical Feed Controls**: Owners have full authority to **Select**, **Discard**, or **Permanently Delete** their own insights, while guest advice remains protected for objective peer review.

3. **Intelligent Personalization (The Background Agent)**:
   - **Automated Enrichment**: "Personalize with AI" triggers a background architect to extract Situational Nuances and Frictional Realities.
   - **Field-Specific Intelligence**: 
     - *Background*: Provides structured Q&A and nuances.
     - *Constraints/Options*: Generates direct "Real Options" for rapid selection.
   - **Cache-Driven Assistance**: AI suggestions populate a non-destructive cache, keeping user input clean while providing tactical choices.

4. **UI/UX Engineering (Integrated Aesthetic)**:
   - **Full-Modal Themed Loading**: Relocated the "Architecting Intelligence" animation to cover the entire Council modal, providing high-fidelity feedback during synthesis and refinement.
   - **Refined Peer Metrics**: Fixed `SessionHistory` logic to provide accurate "Peer Insight" counts, strictly excluding self-thoughts and AI-refined entries.
   - **Custom Prompt Engine**: Enhanced `PromptModal` with support for editable text areas and three-button strategic choice models.

## Stability & Performance
- **Dynamic Model Fallback**: Proactive detection of 503 (High Demand) and 429 (Rate Limit) errors with automatic pivoting to stable models.
- **Incremental Data Patching**: Contributions are stored in a dedicated `human_perspectives` Firestore sub-collection with owner-restricted management rules.

## Environment Requirements
- `VITE_GEMINI_API_KEY`: Strategic API access.
- `VITE_FIREBASE_*`: Full Firebase suite.
- **Domain Authorization**: Dev Vercel domains must be added to Firebase Authorized Domains.

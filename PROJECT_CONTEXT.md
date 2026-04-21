# Decidr - Project Context (Development Branch)

## Advanced Architecture Overview
This branch implements the **Supervisor-Worker Orchestration** pattern, featuring an **Incremental Delta-Update** system that minimizes text churn while surgically incorporating new data.

## Core Council Workflows (v4.5 - Intelligence & Experience)

1. **Incremental Delta-Update System (The Gatekeeper)**:
   - **Triage Phase**: Pre-deliberation check (ALREADY_COVERED, NO_RESEARCH_NEEDED, NEW_RESEARCH_NEEDED).
   - **Targeted Intelligence Patching**: Instead of re-researching everything, the system executes gap-specific queries and patches the Intelligence Dossier.
   - **Blast Radius Agent Logic**: Agents use strict "Stability Protocols" to prevent stylistic churn when data remains logically consistent.

2. **Human Intelligence Layer (v3.0)**:
   - **Multi-Modal Strategic Pathways**: 
     - *Direct Strategic Insight*: Modal-based flow for session owners to add high-fidelity observations without UI clutter.
     - *Refine via Council*: Leverages the Council's current stance to elevate raw thoughts into professional strategic insights.
     - *Expert Deliberation Channel*: Guest flow for external peer review with prominent recruitment interfaces.
   - **Non-Destructive AI Assistance**: AI help now populates a **Brainstorm Cache** rather than injecting text directly into fields. Users select which specific nuances or options to incorporate.

3. **Intelligent Personalization (The Background Agent)**:
   - **Automated Enrichment**: "Personalize with AI" triggers a background architect to extract Situational Nuances and Frictional Realities.
   - **Field-Specific Intelligence**: 
     - *Background*: Provides structured Q&A and nuances.
     - *Constraints/Options*: Generates direct "Real Options" for rapid selection.

4. **UI/UX Engineering (Integrated Aesthetic)**:
   - **Themed Prompt System**: Custom `PromptModal` replaces browser-default alerts/confirms with a sophisticated, three-option interaction model (Personalize / AI Enrich / Continue).
   - **Example Templates v2**: Dedicated, collapsible library with active template tags and instant-clear functionality.
   - **Deliberation Animation**: Enhanced transmission logs accounting for human-in-the-loop insights.

## Stability & Performance
- **Dynamic Model Fallback (Resilient)**: Proactive detection of 503 (High Demand) and 429 (Rate Limit) errors with automatic pivoting to stable models.
- **Brainstorm Caching**: Prevents redundant AI calls when switching between fields or re-opening help sections.

## Environment Requirements
- `VITE_GEMINI_API_KEY`: Strategic API access.
- `VITE_FIREBASE_*`: Full Firebase suite.
- **Domain Authorization**: Dev Vercel domains must be added to Firebase Authorized Domains.

# Decidr - Project Context (Development Branch)

## Advanced Architecture Overview
This branch implements the **Supervisor-Worker Orchestration** pattern, featuring an **Incremental Delta-Update** system that minimizes text churn while surgically incorporating new data.

## Core Council Workflows (v4.0 - Collective Intelligence & Stability)

1. **Incremental Delta-Update System (The Gatekeeper)**:
   - **Triage Phase**: Pre-deliberation check (ALREADY_COVERED, NO_RESEARCH_NEEDED, NEW_RESEARCH_NEEDED).
   - **Targeted Intelligence Patching**: Instead of re-researching everything, the system executes gap-specific queries and patches the Intelligence Dossier, removing outdated facts to prevent context bloat.
   - **Blast Radius Agent Logic**: Agents use strict "Stability Protocols." If new data doesn't logically affect their specific domain, they return their previous analysis word-for-word, preventing stylistic churn.

2. **Human Intelligence Layer (v2.0)**:
   - **Three Strategic Pathways**: 
     - *Direct Insight*: Rapid-track submission for raw observations.
     - *Refine via Council*: Rough thoughts are elevated using Council Intelligence into high-fidelity strategic insights.
     - *Expert Deliberation Channel*: Dedicated flow for inviting peer reviewers and external expert reviews.
   - **Council Chat Promotion**: Direct promotion of chat-session insights into the collective intelligence dossier.

3. **High-Fidelity Audit Trail (v2.0)**:
   - **Temporal Pivot Navigation**: Side-by-side version comparison with mobile-responsive stacked navigation.
   - **Causal Reasoning Layer**: AI-generated logic bridges that explain the evolution between deliberation versions.

4. **Recursive Research Engine**: 
   - Multi-phase scan (Horizon Scan → Gap Analysis) with a grounding density of 15-20 URL-backed data points.

## UI/UX Engineering (Collective Intelligence)
- **Summoned Expert Interface**: Colorful, high-impact recruitment banners for guests in shared sessions.
- **Collective Intelligence Core**: Deliberation animation centered around a "Human Intelligence Hub" (Brain icon), visually demonstrating the grounding of agents in human intuition.
- **Mobile-Responsive Audit Modals**: Specialized layouts for narrow screens ensuring version comparisons remain legible.
- **Sanitized Sharing**: Public links surgically strip version history and technical traces to protect deliberation privacy.

## Stability & Performance
- **Executive Change Logs**: Synthesis engine builds concise (max 50 words) logs of what shifted between versions.
- **Dynamic Model Fallback**: Prioritizes Gemini 3 Flash with automatic pivoting to Gemini 1.5 Flash for high uptime.
- **Firestore Sanitizer**: Strips `undefined` values to prevent serialization errors.

## Environment Requirements
- `VITE_GEMINI_API_KEY`: Strategic API access.
- `VITE_FIREBASE_*`: Full Firebase suite.
- **Domain Authorization**: Dev Vercel domains must be added to Firebase Authorized Domains.

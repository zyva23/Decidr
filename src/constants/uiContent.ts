/**
 * UI CONTENT CONSTANTS
 * Sophisticated, intellectual tone for the educated decision-maker.
 */

export const UI_CONTENT = {
  APP_NAME: "Decidr",
  APP_TAGLINE: "A laboratory for high-stakes deliberation and cognitive clarity",
  
  // Input Form
  FORM: {
    TITLE: "The Inquiry",
    EXAMPLES_LABEL: "Foundational Scenarios:",
    LABELS: {
      TITLE: "The Core Inquiry",
      CONTEXT: "Situational Nuance & Background",
      CONSTRAINTS: "Frictional Realities (Constraints)",
      OPTIONS: "Paths of Action",
    },
    PLACEHOLDERS: {
      TITLE: "What fundamental question is driving this moment of choice?",
      CONTEXT: "Describe the underlying dynamics, the human element, and the weight of the current moment...",
      CONSTRAINTS: "Identify the boundaries: biological time, capital, ethical lines, or social physics...",
      OPTIONS: "Delineate the distinct paths you are weighing...",
    },
    TOOLTIPS: {
      AI_CONTEXT: "Extract deeper inquiry from the situational noise",
      AI_GENERAL: "Invite the collective intelligence to expand the field",
      AI_DISABLED_TITLE: "Define the inquiry to enable intellectual assistance",
      AI_DISABLED_GENERAL: "Provide nuance to enable the generative engine",
    },
    BUTTONS: {
      ANALYZE: "Begin Deliberation",
      RUNNING: "Synthesizing Perspectives...",
      ATTACH: "Incorporate External Briefs (PDF/OCR)",
    },
    MESSAGES: {
      READY: "Coherent",
      VOICE_NOT_SUPPORTED: "Voice transcription is unavailable in this environment.",
      UNSUPPORTED_FILE: "The format provided lies outside our current processing capability.",
      FILE_ERROR: "The document resisted extraction. Please provide a standard legible file.",
    }
  },

  // Results Section
  RESULTS: {
    FINAL_VERDICT: "The Synthesis",
    CONSULT_COUNCIL: "Consult the Collective",
    ELABORATION: "Intellectual Depth",
    HIDE: "Condense",
    PLANNING: "The Roadmap",
    EXPORT: "Manifest Report",
    HELP_IMPROVE: "Refine the Deliberative Engine",
  },

  // Idle State (Council Introduction)
  IDLE: {
    TITLE: "The Mind is a Council.",
    DESCRIPTION: "Submit your inquiry to engage four distinct archetypes of reason in a parallel simulation of your future.",
    AGENTS: [
      { name: 'The Rationalist', color: 'text-blue-400', desc: 'Quantitative logic, ROI, and empirical benchmarks' },
      { name: 'The Architect', color: 'text-purple-400', desc: 'Systems thinking, competitive game theory, and long-term vision' },
      { name: 'The Realist', color: 'text-red-400', desc: 'Pre-mortem analysis, friction points, and failure modes' },
      { name: 'The Ethicist', color: 'text-emerald-400', desc: 'Human impact, values alignment, and stakeholder integrity' }
    ]
  },

  // Commitment Protocol
  COMMITMENT: {
    TITLE: "The Act of Intent",
    DESCRIPTION: "The period of observation has passed. To integrate these insights, you must now move from the abstract to the concrete through a formal declaration of intent.",
    LABEL_PATH: "The Chosen Path",
    LABEL_WHY: "The Justification of Will",
    PLACEHOLDER_WHY: "Articulate the reasoning that bridges your values with this specific choice...",
    BUTTON_COMMIT: "Lock My Intent",
    LOCKED_TITLE: "Path Declared",
    BUTTON_BRANCH: "Evolve to Next Inquiry",
    BUTTON_REEVALUATE: "Re-examine the Synthesis",
  },

  // Feedback
  FEEDBACK: {
    TITLE: "Refining the Deliberative Quality",
    PLACEHOLDER: "In what way did this synthesis fail to capture the necessary nuance?",
    SUCCESS: "Your critique has been integrated into the system's history.",
    BUTTON_SUBMIT: "Transmit Critique",
    BUTTON_CANCEL: "Dismiss",
  },

  // Loading Stages
  LOADING_STAGES: [
    "Gathering cognitive archetypes...",
    "Calculating rational benchmarks...",
    "Modeling systemic second-order effects...",
    "Inhabiting failure modes (Pre-mortem)...",
    "Weighting human and ethical variables...",
    "Distilling the divergent paths into synthesis..."
  ]
};

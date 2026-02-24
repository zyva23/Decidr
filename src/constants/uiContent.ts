/**
 * UI CONTENT CONSTANTS
 * Centralized file for all customer-facing strings.
 * Makes it easy to change placeholders, labels, and instructional text in one place.
 */

export const UI_CONTENT = {
  APP_NAME: "Decision Council AI",
  APP_TAGLINE: "Strategic multi-model analysis engine",
  
  // Input Form
  FORM: {
    TITLE: "Decision Brief",
    EXAMPLES_LABEL: "Examples:",
    LABELS: {
      TITLE: "Decision Title",
      CONTEXT: "Context & Background",
      CONSTRAINTS: "Constraints",
      OPTIONS: "Options",
    },
    PLACEHOLDERS: {
      TITLE: "What is the core question?",
      CONTEXT: "Describe the situation, stakeholders, and urgency...",
      CONSTRAINTS: "Budget, timeline, legal...",
      OPTIONS: "Option A, Option B...",
    },
    TOOLTIPS: {
      AI_CONTEXT: "Ask AI for clarifying questions",
      AI_GENERAL: "Explore ideas with AI",
      AI_DISABLED_TITLE: "Enter a Title to enable AI help",
      AI_DISABLED_GENERAL: "Fill Title & Context to enable AI",
    },
    BUTTONS: {
      ANALYZE: "Analyze Decision",
      RUNNING: "Running Simulations...",
      ATTACH: "Attach Brief, CV, or Photo",
    },
    MESSAGES: {
      READY: "Ready",
      VOICE_NOT_SUPPORTED: "Your browser does not support voice input.",
      UNSUPPORTED_FILE: "Unsupported file type.",
      FILE_ERROR: "Failed to process document. Please try a different file.",
    }
  },

  // Results Section
  RESULTS: {
    FINAL_VERDICT: "Final Verdict",
    CONSULT_COUNCIL: "Consult Council",
    ELABORATION: "Elaboration",
    HIDE: "Hide",
    PLANNING: "Planning",
    EXPORT: "Export",
    HELP_IMPROVE: "Help us improve the Council",
  },

  // Idle State (Council Introduction)
  IDLE: {
    TITLE: "The Council Awaits.",
    DESCRIPTION: "Submit your decision brief to receive a multi-dimensional analysis from our specialized strategic agents.",
    AGENTS: [
      { name: 'Analyst', color: 'text-blue-400', desc: 'Financial ROI & Market Data' },
      { name: 'Strategist', color: 'text-purple-400', desc: 'Game Theory & Competition' },
      { name: 'Skeptic', color: 'text-red-400', desc: 'Risk & Failure Modes' },
      { name: 'Mediator', color: 'text-emerald-400', desc: 'Ethics & Stakeholders' }
    ]
  },

  // Commitment Protocol
  COMMITMENT: {
    TITLE: "The Commitment Protocol",
    DESCRIPTION: "Deliberation is over. To lock in your results and earn a Strategic Commitment Badge (+150 XP), you must choose your path.",
    LABEL_PATH: "Choose Your Path",
    LABEL_WHY: "Why are you choosing this?",
    PLACEHOLDER_WHY: "State your reasoning. This enhances psychological commitment.",
    BUTTON_COMMIT: "I Commit to this Decision",
    LOCKED_TITLE: "Decision Locked",
    BUTTON_BRANCH: "Branch to Next Step",
    BUTTON_REEVALUATE: "Re-evaluate Path",
  },

  // Feedback
  FEEDBACK: {
    TITLE: "Help us improve the Council",
    PLACEHOLDER: "What could have been better? Be as specific as possible...",
    SUCCESS: "Thank you for your feedback!",
    BUTTON_SUBMIT: "Submit Feedback",
    BUTTON_CANCEL: "Cancel",
  },

  // Loading Stages
  LOADING_STAGES: [
    "Convening the Council...",
    "Analyzing Financials (Analyst)...",
    "Mapping Strategy (Strategist)...",
    "Evaluating Risks (Skeptic)...",
    "Reviewing Ethics (Mediator)...",
    "Synthesizing Verdict..."
  ]
};

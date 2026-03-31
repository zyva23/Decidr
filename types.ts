
export interface DecisionInput {
  title: string;
  context: string;
  constraints: string;
  options: string;
  parentId?: string; // Links to a previous inquiry session
}

export interface SequenceEvent {
  step: string;
  detail: string;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface ChartDataPoint {
  label: string;
  value: number;
  benchmark?: number;
}

export interface AlternativeScenario {
  name: string;
  description: string;
  likelihood: string;
  outcome: string;
}

export interface AgentResponse {
  name: string;
  role: string;
  analysis: string;
  keyPoints: string[];
  score: number;
  sequence: SequenceEvent[];
  sources?: string[];
  chartData?: ChartDataPoint[];
  chartLabel?: string;
  alternativeScenarios?: AlternativeScenario[];
}

export interface RadarMetrics {
  risk: number;
  speed: number;
  cost: number;
  impact: number;
  feasibility: number;
}

export interface SynthesisResult {
  verdict: string;
  recommendation: string;
  metrics: RadarMetrics;
  refinedPaths: string[]; // High-fidelity analyzed options
}

export interface CouncilResult {
  analyst: AgentResponse;
  strategist: AgentResponse;
  skeptic: AgentResponse;
  mediator: AgentResponse;
  synthesis: SynthesisResult;
  feedback?: 'helpful' | 'not-helpful'; // User feedback
}

export interface PartialCouncilResult {
  analyst?: AgentResponse;
  strategist?: AgentResponse;
  skeptic?: AgentResponse;
  mediator?: AgentResponse;
}

export interface BrainstormQuestion {
  question: string;
  options: string[];
}

export interface BrainstormResult {
  structuredQuestions: BrainstormQuestion[];
  suggestions: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface Contribution {
  id: string;
  name: string;
  content: string;
  timestamp: number;
  type: 'risk' | 'variable' | 'alternative';
  status?: 'pending' | 'accepted' | 'dismissed';
  notified?: boolean;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
  OUT_OF_CREDITS = 'OUT_OF_CREDITS',
  SHARED_VIEW = 'SHARED_VIEW'
}

export interface DecisionSession {
  id: string;
  user_id?: string;
  timestamp: number;
  input: DecisionInput;
  result: CouncilResult | null;
  status: AnalysisStatus;
  chatHistory?: ChatMessage[];
  actionPlan?: ActionPlan;
  decisionTree?: DecisionTree;
  isPublic?: boolean;
  contributions?: Contribution[];
  commitment?: {
    selectedOption: string;
    justification: string;
    timestamp: number;
  };
}

export interface ActionPlan {
  phases: PlanPhase[];
  pivotPoints: PivotPoint[];
  executiveSummary: string;
}

export interface PlanPhase {
  name: string;
  duration: string;
  objective: string;
  tasks: PlanTask[];
  pitfalls: string[]; // What to avoid
  successCriteria: string[]; // What to track/verify to move to next phase
}

export interface PlanTask {
  id: string;
  description: string;
  owner: string;
  kpi: string;
  status: 'pending' | 'done';
}

export interface PivotPoint {
  trigger: string;
  reaction: string;
  owner: string;
}

export interface UserProfile {
  id: string;
  email: string;
  xp: number;
  level: number;
}

export interface Attachment {
  name: string;
  type: string;
  extractedText: string;
}

export interface DecisionTree {
  nodes: {
    id: string;
    position: { x: number; y: number };
    data: { label: string; sentiment?: 'positive' | 'negative' | 'neutral' };
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    label?: string;
  }[];
}


export interface DecisionInput {
  title: string;
  context: string;
  constraints: string;
  options: string;
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
}

export interface SynthesisResult {
  verdict: string;
  recommendation: string;
  metrics: RadarMetrics;
}

export interface CouncilResult {
  analyst: AgentResponse;
  strategist: AgentResponse;
  skeptic: AgentResponse;
  mediator: AgentResponse;
  synthesis: SynthesisResult;
  feedback?: 'helpful' | 'not-helpful'; // User feedback
}

export interface BrainstormResult {
  questions: string[];
  suggestions: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR',
  OUT_OF_CREDITS = 'OUT_OF_CREDITS'
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
}

export interface ActivityLog {
  user_id: string;
  action_type: string;
  details?: any;
  created_at: string;
}

export interface TimelineEvent {
  step: number;
  title: string;
  timestamp: string | null;
  status: 'completed' | 'active' | 'warning' | 'in_progress' | 'review';
  description: string;
}

export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  roomNumber?: string;
  hostelBlock?: string;
  email?: string;
}

export interface Complaint {
  id: number;
  complaint_text: string;
  student_name: string | null;
  room_number: string | null;
  hostel_block: string | null;
  predicted_category: string;
  category_confidence: number;
  predicted_urgency: string;
  urgency_confidence: number;
  priority_score: number;
  base_priority_score?: number | null;
  aging_boost?: number;
  elapsed_hours?: number;
  elapsed_time_str?: string | null;
  is_overdue?: boolean;
  sla_hours?: number;
  timeline?: TimelineEvent[];
  priority_reason: string;
  safety_override: boolean;
  requires_human_review: boolean;
  final_urgency: string;
  status: 'Pending' | 'In Progress' | 'Resolved' | 'Under Review';
  admin_notes: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface ComplaintCreateInput {
  complaint_text: string;
  student_name?: string;
  room_number?: string;
  hostel_block?: string;
  image_url?: string | null;
}

export interface ComplaintListResponse {
  total: number;
  page: number;
  limit: number;
  complaints: Complaint[];
}

export interface ComplaintHistory {
  id: number;
  complaint_id: number;
  action: string;
  previous_value: string | null;
  new_value: string | null;
  note: string | null;
  timestamp: string;
}

export interface DashboardStats {
  total_complaints: number;
  pending_complaints: number;
  in_progress_complaints: number;
  resolved_complaints: number;
  critical_complaints: number;
  high_priority_complaints: number;
  needs_review_complaints: number;
  overdue_complaints?: number;
  top_priority: Array<{
    id: number;
    text: string;
    category: string;
    urgency: string;
    priority_score: number;
    base_priority_score?: number | null;
    aging_boost?: number;
    is_overdue?: boolean;
    elapsed_time_str?: string;
    status: string;
    room_number: string | null;
    image_url?: string | null;
    created_at: string;
  }>;
}

export interface DashboardDistribution {
  by_category: Record<string, number>;
  by_urgency: Record<string, number>;
}

export interface PredictionResult {
  predicted_category: string;
  category_confidence: number;
  all_category_probabilities: Record<string, number>;
  predicted_urgency: string;
  urgency_confidence: number;
  all_urgency_probabilities: Record<string, number>;
  final_urgency: string;
  priority_score: number;
  priority_reason: string;
  safety_override: boolean;
  safety_reason: string | null;
  requires_human_review: boolean;
  processing_time_ms: number;
  device: string;
}

export interface ModelMetricResult {
  task_name: string;
  model_architecture: string;
  num_classes: number;
  classes: string[];
  test_sample_count: number;
  accuracy: number;
  precision_macro: number;
  precision_weighted: number;
  recall_macro: number;
  recall_weighted: number;
  f1_macro: number;
  f1_weighted: number;
  confusion_matrix: number[][];
  classification_report: Record<string, any>;
  avg_inference_time_ms: number;
  device: string;
}

export interface FullEvaluation {
  timestamp: string;
  category_model: ModelMetricResult;
  urgency_model: ModelMetricResult;
}

export interface PromptTemplateResponse {
  strategies: string[];
  templates: Record<string, string>;
  descriptions: Record<string, string>;
}

export interface PromptAnalyzeResponse {
  prompt_strategy: string;
  complaint_text: string;
  compiled_prompt: string;
  ollama_available: boolean;
  live_llm_execution: boolean;
  llm_output: string | null;
  educational_notes: string;
}

export interface HealthStatus {
  status: string;
  backend: string;
  database: string;
  models: {
    loaded: boolean;
    device: string;
    category_model: string;
    urgency_model: string;
  };
  edge_inference: string;
}

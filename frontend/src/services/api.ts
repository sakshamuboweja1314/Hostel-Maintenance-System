import {
  Complaint,
  ComplaintCreateInput,
  ComplaintListResponse,
  ComplaintHistory,
  DashboardStats,
  DashboardDistribution,
  PredictionResult,
  FullEvaluation,
  PromptTemplateResponse,
  PromptAnalyzeResponse,
  HealthStatus
} from '../types';

const RAW_BASE = import.meta.env.VITE_API_BASE_URL || '';
const API_BASE = RAW_BASE ? `${RAW_BASE.replace(/\/$/, '')}/api` : '/api';

export const resolveImageUrl = (path?: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const clean = path.startsWith('/') ? path : `/${path}`;
  if (RAW_BASE) {
    return `${RAW_BASE.replace(/\/$/, '')}${clean}`;
  }
  return clean;
};

export const api = {
  // Health
  getHealth: async (): Promise<HealthStatus> => {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed to fetch system health');
    return res.json();
  },

  // Complaints
  uploadImage: async (file: File): Promise<{ image_url: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/complaints/upload-image`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to upload photo proof');
    }
    return res.json();
  },

  submitComplaint: async (data: ComplaintCreateInput): Promise<Complaint> => {
    const res = await fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to submit complaint');
    }
    return res.json();
  },

  getComplaints: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    urgency?: string;
    status?: string;
  }): Promise<ComplaintListResponse> => {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.search) query.append('search', params.search);
    if (params?.category && params.category !== 'all') query.append('category', params.category);
    if (params?.urgency && params.urgency !== 'all') query.append('urgency', params.urgency);
    if (params?.status && params.status !== 'all') query.append('status', params.status);

    const res = await fetch(`${API_BASE}/complaints?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch complaints');
    return res.json();
  },

  getComplaintById: async (id: number): Promise<Complaint> => {
    const res = await fetch(`${API_BASE}/complaints/${id}`);
    if (!res.ok) throw new Error('Failed to fetch complaint details');
    return res.json();
  },

  updateStatus: async (id: number, status: string, admin_notes?: string): Promise<Complaint> => {
    const res = await fetch(`${API_BASE}/complaints/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, admin_notes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update status');
    }
    return res.json();
  },

  overridePriority: async (id: number, override_urgency: string, admin_reason: string): Promise<Complaint> => {
    const res = await fetch(`${API_BASE}/complaints/${id}/priority`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ override_urgency, admin_reason }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to override priority');
    }
    return res.json();
  },

  getComplaintHistory: async (id: number): Promise<ComplaintHistory[]> => {
    const res = await fetch(`${API_BASE}/complaints/${id}/history`);
    if (!res.ok) throw new Error('Failed to fetch complaint history');
    return res.json();
  },

  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    const res = await fetch(`${API_BASE}/dashboard/stats`);
    if (!res.ok) throw new Error('Failed to fetch dashboard stats');
    return res.json();
  },

  getDashboardDistribution: async (): Promise<DashboardDistribution> => {
    const res = await fetch(`${API_BASE}/dashboard/distribution`);
    if (!res.ok) throw new Error('Failed to fetch distribution metrics');
    return res.json();
  },

  // Model & Inference
  predictOnly: async (complaint_text: string): Promise<PredictionResult> => {
    const res = await fetch(`${API_BASE}/model/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaint_text }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Inference error');
    }
    return res.json();
  },

  getEvaluationMetrics: async (): Promise<FullEvaluation> => {
    const res = await fetch(`${API_BASE}/model/metrics`);
    if (!res.ok) throw new Error('Failed to fetch evaluation metrics');
    return res.json();
  },

  // Prompt Lab
  getPromptTemplates: async (): Promise<PromptTemplateResponse> => {
    const res = await fetch(`${API_BASE}/prompts/templates`);
    if (!res.ok) throw new Error('Failed to fetch prompt templates');
    return res.json();
  },

  analyzePrompt: async (complaint_text: string, prompt_strategy: string): Promise<PromptAnalyzeResponse> => {
    const res = await fetch(`${API_BASE}/prompts/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ complaint_text, prompt_strategy }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to analyze prompt');
    }
    return res.json();
  },
};

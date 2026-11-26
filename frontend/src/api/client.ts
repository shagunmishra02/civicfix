import {
  Complaint,
  ComplaintCreateInput,
  AIClassificationResult,
  DuplicateCheckResult,
  AnalyticsSummary
} from '../types';

const API_BASE = '/api';

// Auth Token Store (Session Storage for security)
export function getAuthToken(): string | null {
  return sessionStorage.getItem('civicfix_estate_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    sessionStorage.setItem('civicfix_estate_token', token);
  } else {
    sessionStorage.removeItem('civicfix_estate_token');
  }
}

export interface OfficerProfile {
  email: string;
  name: string;
  role: string;
  department: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  officer: OfficerProfile;
}

export async function loginStaff(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Authentication failed' }));
    throw new Error(err.detail || 'Access Denied: Invalid estate staff credentials');
  }

  const data: LoginResponse = await res.json();
  setAuthToken(data.access_token);
  return data;
}

export async function fetchCurrentOfficer(): Promise<OfficerProfile | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      setAuthToken(null);
      return null;
    }
    const data = await res.json();
    return data.officer;
  } catch {
    setAuthToken(null);
    return null;
  }
}

export function logoutStaff() {
  setAuthToken(null);
}

export async function fetchComplaints(params?: {
  status?: string;
  category?: string;
  priority?: string;
  search?: string;
}): Promise<Complaint[]> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'All') query.append('status', params.status);
  if (params?.category && params.category !== 'All') query.append('category', params.category);
  if (params?.priority && params.priority !== 'All') query.append('priority', params.priority);
  if (params?.search) query.append('search', params.search);

  const res = await fetch(`${API_BASE}/complaints?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch complaints');
  return res.json();
}

export async function fetchComplaintById(id: string): Promise<Complaint> {
  const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Complaint #${id} not found`);
  return res.json();
}

export async function createComplaint(data: ComplaintCreateInput): Promise<Complaint> {
  const res = await fetch(`${API_BASE}/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to create complaint' }));
    throw new Error(err.detail || 'Failed to create complaint');
  }
  return res.json();
}

export async function upvoteComplaint(id: string): Promise<Complaint> {
  const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}/upvote`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to upvote complaint');
  return res.json();
}

export async function updateComplaintStatus(
  id: string,
  update: {
    new_status: string;
    assigned_to?: string;
    admin_notes?: string;
    resolution_image_url?: string;
    changed_by?: string;
  }
): Promise<Complaint> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}/complaints/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(update),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to update status' }));
    throw new Error(err.detail || 'Security Error: You are not authorized to update this complaint.');
  }

  return res.json();
}

export async function classifyTextWithAI(text: string): Promise<AIClassificationResult> {
  const res = await fetch(`${API_BASE}/ai/classify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('AI classification failed');
  return res.json();
}

export async function checkNearbyDuplicates(
  latitude: number,
  longitude: number,
  category?: string,
  radiusMeters: number = 80
): Promise<DuplicateCheckResult> {
  const res = await fetch(`${API_BASE}/ai/check-duplicates`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      latitude,
      longitude,
      category,
      radius_meters: radiusMeters,
    }),
  });
  if (!res.ok) throw new Error('Duplicate check failed');
  return res.json();
}

export async function uploadPhotoFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/complaints/upload-photo`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload image');
  const data = await res.json();
  return data.url;
}

export async function fetchAnalyticsSummary(): Promise<AnalyticsSummary> {
  const res = await fetch(`${API_BASE}/analytics/summary`);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

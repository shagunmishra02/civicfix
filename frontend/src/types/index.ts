export type ComplaintCategory =
  | 'Streetlights & Electrical'
  | 'Roads & Potholes'
  | 'Garbage & Sanitation'
  | 'Water & Plumbing'
  | 'Campus Safety & Security'
  | 'Infrastructure & Facilities'
  | 'Other';

export type ComplaintPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type ComplaintStatus = 'Reported' | 'Assigned' | 'In Progress' | 'Resolved';

export interface StatusLog {
  id: number;
  complaint_id: string;
  old_status?: string | null;
  new_status: string;
  changed_by: string;
  note?: string | null;
  timestamp: string;
}

export interface Complaint {
  id: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  latitude: number;
  longitude: number;
  location_name: string;
  image_url?: string | null;
  resolution_image_url?: string | null;
  resolution_notes?: string | null;
  reported_by: string;
  upvotes: number;
  assigned_to?: string | null;
  ai_confidence?: number | null;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
  status_logs: StatusLog[];
}

export interface ComplaintCreateInput {
  title: string;
  description: string;
  category?: string;
  priority?: string;
  latitude: number;
  longitude: number;
  location_name: string;
  image_url?: string;
  reported_by?: string;
}

export interface AIClassificationResult {
  category: ComplaintCategory;
  confidence: number;
  suggested_priority: ComplaintPriority;
  reasoning: string;
  alternative_categories: Array<{
    category: ComplaintCategory;
    confidence: number;
  }>;
}

export interface NearbyDuplicate {
  id: string;
  title: string;
  category: string;
  status: string;
  location_name: string;
  distance_meters: number;
  upvotes: number;
}

export interface DuplicateCheckResult {
  has_duplicates: boolean;
  count: number;
  nearby_issues: NearbyDuplicate[];
}

export interface CategoryStat {
  category: string;
  count: number;
  percentage: number;
}

export interface StatusStat {
  status: string;
  count: number;
}

export interface DepartmentStat {
  department: string;
  assigned_count: number;
  resolved_count: number;
}

export interface AnalyticsSummary {
  total_complaints: number;
  open_count: number;
  in_progress_count: number;
  resolved_count: number;
  critical_count: number;
  avg_resolution_hours: number;
  category_distribution: CategoryStat[];
  status_distribution: StatusStat[];
  department_stats: DepartmentStat[];
}

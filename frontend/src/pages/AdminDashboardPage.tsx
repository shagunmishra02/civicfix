import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Search,
  RefreshCw,
  Edit3,
  Building2,
  X,
  UploadCloud,
  FileCheck
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend
} from 'recharts';
import { CampusMap } from '../components/CampusMap';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import {
  fetchComplaints,
  fetchAnalyticsSummary,
  updateComplaintStatus,
  uploadPhotoFile
} from '../api/client';
import { Complaint, AnalyticsSummary } from '../types';

interface AdminDashboardPageProps {
  onSelectTicket: (id: string) => void;
}

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#64748b'];

const DEPARTMENTS = [
  'Electrical Maintenance Division',
  'Civil Works & Roads Section',
  'Campus Sanitation Wing',
  'Plumbing & Hydraulics Unit',
  'Campus Security Directorate',
  'Carpentry & Infrastructure Workshop',
  'General Administration'
];

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onSelectTicket }) => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Triage Modal
  const [triageItem, setTriageItem] = useState<Complaint | null>(null);
  const [modalStatus, setModalStatus] = useState<string>('Assigned');
  const [modalDepartment, setModalDepartment] = useState<string>('');
  const [modalNotes, setModalNotes] = useState<string>('');
  const [resolutionFile, setResolutionFile] = useState<File | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [stats, list] = await Promise.all([
        fetchAnalyticsSummary(),
        fetchComplaints({
          status: statusFilter,
          category: categoryFilter,
          search: searchQuery,
        }),
      ]);
      setAnalytics(stats);
      setComplaints(list);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const openTriageModal = (item: Complaint) => {
    setTriageItem(item);
    setModalStatus(item.status === 'Reported' ? 'Assigned' : item.status);
    setModalDepartment(item.assigned_to || DEPARTMENTS[0]);
    setModalNotes(item.resolution_notes || '');
    setResolutionFile(null);
  };

  const handleSaveTriage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!triageItem) return;

    try {
      setIsUpdating(true);
      setActionError(null);
      let resPhotoUrl = triageItem.resolution_image_url || undefined;
      if (resolutionFile) {
        resPhotoUrl = await uploadPhotoFile(resolutionFile);
      }

      await updateComplaintStatus(triageItem.id, {
        new_status: modalStatus,
        assigned_to: modalDepartment,
        admin_notes: modalNotes,
        resolution_image_url: resPhotoUrl,
        changed_by: 'Estate Officer In-Charge',
      });

      setTriageItem(null);
      await loadData();
    } catch (err: any) {
      console.error('Failed to update complaint:', err);
      setActionError(err.message || 'Operation failed. Verify role permissions and valid session.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-amber-400 text-xs font-semibold mb-2 shadow-xs">
            <ShieldAlert className="w-3.5 h-3.5" /> Mody University • Estate &amp; Campus Maintenance Directorate
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Infrastructure Dispatch &amp; Resolution Control (Laxmangarh)
          </h1>
          <p className="text-slate-600 text-sm mt-0.5">
            Central maintenance triage, workforce department assignment, and milestone audit logs for Mody University campus.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* KPI Metric Strip */}
      {analytics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Total Filed</span>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-900">{analytics.total_complaints}</div>
            <span className="text-[11px] text-slate-400">Campus-wide tickets</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-sky-600 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Pending Triage</span>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-sky-600">{analytics.open_count}</div>
            <span className="text-[11px] text-sky-700 font-medium">Unassigned tickets</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-amber-600 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">In Progress</span>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-amber-600">{analytics.in_progress_count}</div>
            <span className="text-[11px] text-amber-700 font-medium">Under active repair</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-emerald-600 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Resolved</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-emerald-600">{analytics.resolved_count}</div>
            <span className="text-[11px] text-emerald-700 font-medium">Verified & fixed</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-rose-600 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Critical Priority</span>
              <Flame className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-rose-600">{analytics.critical_count}</div>
            <span className="text-[11px] text-rose-700 font-medium">Immediate hazard</span>
          </div>
        </div>
      )}

      {/* Analytics Visualizations Grid */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Donut Chart: Categories */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Defect Distribution by Category
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.category_distribution}
                    dataKey="count"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {analytics.category_distribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any, item: any) => [
                      `${val} issues (${item.payload.percentage}%)`,
                      name,
                    ]}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart: Department Workloads */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
              Department Assigned vs Resolved Workload
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.department_stats} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="department" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend verticalAlign="top" height={30} />
                  <Bar dataKey="assigned_count" name="Assigned Tasks" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="resolved_count" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Campus Map Inspection View */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Campus Geospatial Defect Density
          </h3>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" /> Open</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> In Progress</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" /> Resolved</span>
          </div>
        </div>
        <CampusMap
          mode="view"
          complaints={complaints}
          onSelectComplaint={onSelectTicket}
          height="320px"
        />
      </div>

      {/* Triage & Management Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="font-bold text-slate-900 text-base">Issue Triage Queue</h2>
            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
              {complaints.length} Records
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket, title, location..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-300 text-xs w-48 sm:w-64 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </form>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="Reported">Reported</option>
              <option value="Assigned">Assigned</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Ticket</th>
                <th className="py-3.5 px-4">Issue Details</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Assigned Department</th>
                <th className="py-3.5 px-4 text-center">Impact</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {complaints.length > 0 ? (
                complaints.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-brand-600">
                      #{item.id}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="font-semibold text-slate-900 truncate">{item.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">{item.location_name}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <PriorityBadge priority={item.priority} />
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {item.assigned_to || (
                        <span className="text-rose-500 font-medium">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      👍 {item.upvotes}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openTriageModal(item)}
                        className="px-2.5 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 text-brand-700 font-semibold border border-brand-200 transition-colors"
                      >
                        Triage &rarr;
                      </button>
                      <button
                        onClick={() => onSelectTicket(item.id)}
                        className="px-2 py-1 rounded-lg hover:bg-slate-100 text-slate-500 font-medium transition-colors"
                      >
                        Tracker
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No complaints matching current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Triage & Workflow Modal */}
      {triageItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-100 animate-scaleUp">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <span className="font-mono text-xs font-bold text-brand-600">
                  Manage #{triageItem.id}
                </span>
                <h3 className="font-bold text-slate-900 text-lg line-clamp-1">{triageItem.title}</h3>
              </div>
              <button
                onClick={() => setTriageItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleSaveTriage} className="space-y-4 text-xs">
              {/* Status Selector */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Update Status</label>
                <select
                  value={modalStatus}
                  onChange={(e) => setModalStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                >
                  <option value="Reported">Reported (Logged)</option>
                  <option value="Assigned">Assigned to Department</option>
                  <option value="In Progress">In Progress (Crews Dispatched)</option>
                  <option value="Resolved">Resolved (Work Completed & Certified)</option>
                </select>
              </div>

              {/* Department Assignment */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Assign To Department / Unit
                </label>
                <select
                  value={modalDepartment}
                  onChange={(e) => setModalDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              {/* Maintenance Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Technician Action Notes / Resolution Summary
                </label>
                <textarea
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g., Replacement bulb fitted, breaker reset, tested working at 4:30 PM..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
                />
              </div>

              {/* Optional Resolution Proof Photo */}
              {modalStatus === 'Resolved' && (
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <label className="block font-semibold text-emerald-900 mb-1 flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-emerald-600" />
                    Attach Resolution Proof Photo (Fixed Work)
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setResolutionFile(e.target.files[0]);
                      }
                    }}
                    className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 cursor-pointer"
                  />
                </div>
              )}

              {/* Modal Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTriageItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-xs disabled:opacity-50"
                >
                  {isUpdating ? 'Saving...' : 'Save & Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

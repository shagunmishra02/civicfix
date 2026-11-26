import React, { useState, useEffect } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  MapPin,
  ThumbsUp,
  ShieldCheck,
  Building,
  AlertCircle,
  Share2,
  User
} from 'lucide-react';
import { fetchComplaintById, upvoteComplaint } from '../api/client';
import { Complaint } from '../types';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';

interface IssueTrackerPageProps {
  initialTicketId?: string | null;
  onNavigateTicket?: (ticketId: string) => void;
}

const STEPS = ['Reported', 'Assigned', 'In Progress', 'Resolved'];

export const IssueTrackerPage: React.FC<IssueTrackerPageProps> = ({
  initialTicketId,
  onNavigateTicket,
}) => {
  const [ticketInput, setTicketInput] = useState(initialTicketId || '');
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialTicketId) {
      setTicketInput(initialTicketId);
      loadTicket(initialTicketId);
    }
  }, [initialTicketId]);

  const loadTicket = async (id: string) => {
    const cleanId = id.trim().toUpperCase().replace('#', '');
    if (!cleanId) return;

    try {
      setIsLoading(true);
      setErrorMsg(null);
      const data = await fetchComplaintById(cleanId);
      setComplaint(data);
    } catch (err: any) {
      setComplaint(null);
      setErrorMsg(err.message || `Ticket #${cleanId} not found`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticketInput.trim()) {
      loadTicket(ticketInput);
      if (onNavigateTicket) onNavigateTicket(ticketInput.trim().toUpperCase().replace('#', ''));
    }
  };

  const handleUpvote = async () => {
    if (!complaint) return;
    try {
      const updated = await upvoteComplaint(complaint.id);
      setComplaint(updated);
    } catch (err) {
      console.error('Upvote failed:', err);
    }
  };

  const handleShare = () => {
    if (!complaint) return;
    const url = `${window.location.origin}?track=${complaint.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine active step index
  const currentStepIndex = complaint ? STEPS.indexOf(complaint.status) : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Search Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Public Issue Tracker</h1>
        <p className="text-slate-600 text-sm mt-1 max-w-lg mx-auto">
          Enter any campus complaint ticket number to see real-time resolution milestones, technician dispatches, and before/after proof.
        </p>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mt-6 max-w-md mx-auto flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={ticketInput}
              onChange={(e) => setTicketInput(e.target.value)}
              placeholder="e.g. CF-1001 or CF-1003"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm uppercase font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-xs transition-colors"
          >
            {isLoading ? 'Searching...' : 'Track'}
          </button>
        </form>

        {/* Quick Sample Tickets */}
        <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-500">
          <span>Try quick demo tickets:</span>
          {['CF-1001', 'CF-1003', 'CF-1004', 'CF-1002'].map((id) => (
            <button
              key={id}
              onClick={() => {
                setTicketInput(id);
                loadTicket(id);
              }}
              className="font-mono text-brand-600 hover:underline font-bold"
            >
              #{id}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm text-center flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Ticket Details */}
      {complaint && (
        <div className="space-y-6 animate-fadeIn">
          {/* Main Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-lg font-extrabold text-brand-600">
                    #{complaint.id}
                  </span>
                  <StatusBadge status={complaint.status} size="md" />
                  <PriorityBadge priority={complaint.priority} />
                  <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full font-medium">
                    {complaint.category}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mt-2">
                  {complaint.title}
                </h2>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUpvote}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 border border-slate-200 text-sm font-semibold transition-all"
                  title="Mark yourself as affected by this issue"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>+1 Me Too ({complaint.upvotes})</span>
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                  title="Copy share link"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                {copied && <span className="text-xs text-emerald-600 font-bold">Link copied!</span>}
              </div>
            </div>

            {/* Visual Resolution Stepper */}
            <div className="py-8 border-b border-slate-100">
              <div className="relative">
                <div className="hidden sm:block absolute top-1/2 left-6 right-6 h-1 bg-slate-100 -translate-y-1/2 z-0" />
                <div
                  className="hidden sm:block absolute top-1/2 left-6 h-1 bg-brand-600 -translate-y-1/2 z-0 transition-all duration-500"
                  style={{
                    width: `${Math.max(0, (currentStepIndex / (STEPS.length - 1)) * 100 - 8)}%`,
                  }}
                />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative z-10">
                  {STEPS.map((step, idx) => {
                    const isPassed = idx <= currentStepIndex;
                    const isCurrent = idx === currentStepIndex;

                    return (
                      <div key={step} className="flex flex-col items-center text-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                            isCurrent
                              ? 'bg-brand-600 text-white ring-4 ring-brand-100 shadow-md'
                              : isPassed
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}
                        >
                          {isPassed && !isCurrent ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <span
                          className={`mt-2 text-xs font-semibold ${
                            isCurrent
                              ? 'text-brand-700 font-bold'
                              : isPassed
                              ? 'text-slate-800'
                              : 'text-slate-400'
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Description and Info Grid */}
            <div className="py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div>
                  <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-1">
                    Issue Description
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {complaint.description}
                  </p>
                </div>

                {/* Resolution Notes if Resolved */}
                {complaint.status === 'Resolved' && complaint.resolution_notes && (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs uppercase tracking-wider mb-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Resolution Verification Note
                    </div>
                    <p className="text-xs text-emerald-900 leading-relaxed">
                      {complaint.resolution_notes}
                    </p>
                  </div>
                )}
              </div>

              {/* Metadata Panel */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 uppercase font-semibold">Location</span>
                  <div className="flex items-start gap-1.5 text-slate-800 font-medium mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                    <span>{complaint.location_name}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 uppercase font-semibold">Assigned Unit</span>
                  <div className="flex items-center gap-1.5 text-slate-800 font-medium mt-0.5">
                    <Building className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{complaint.assigned_to || 'Pending Department Triage'}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 uppercase font-semibold">Reported By</span>
                  <div className="flex items-center gap-1.5 text-slate-800 font-medium mt-0.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>{complaint.reported_by}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 uppercase font-semibold">Logged At</span>
                  <div className="flex items-center gap-1.5 text-slate-800 font-medium mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(complaint.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Photos: Before & After */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3">
                Visual Documentation
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {complaint.image_url ? (
                  <div>
                    <span className="text-xs font-semibold text-slate-600 block mb-1">
                      Initial Citizen Report Photo
                    </span>
                    <div className="h-48 rounded-2xl overflow-hidden border border-slate-200 bg-slate-100">
                      <img
                        src={complaint.image_url}
                        alt="Initial defect"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="h-48 rounded-2xl border border-dashed border-slate-200 flex items-center justify-center text-xs text-slate-400">
                    No initial photo attached
                  </div>
                )}

                {complaint.resolution_image_url ? (
                  <div>
                    <span className="text-xs font-semibold text-emerald-700 block mb-1 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Estate Resolution Photo (Fixed)
                    </span>
                    <div className="h-48 rounded-2xl overflow-hidden border-2 border-emerald-300 bg-slate-100">
                      <img
                        src={complaint.resolution_image_url}
                        alt="Resolution fixed"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ) : complaint.status === 'Resolved' ? (
                  <div className="h-48 rounded-2xl border border-slate-200 bg-emerald-50/40 flex flex-col items-center justify-center text-xs text-emerald-700 p-4 text-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-1" />
                    <span>Certified Resolved by Estate Inspector</span>
                  </div>
                ) : (
                  <div className="h-48 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center justify-center text-xs text-slate-400 p-4 text-center">
                    <Clock className="w-6 h-6 text-slate-300 mb-1" />
                    <span>Resolution photo will be uploaded once work completes</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Audit Trail & Milestone History */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">Milestone Activity Log</h3>
            <div className="space-y-4">
              {complaint.status_logs && complaint.status_logs.length > 0 ? (
                complaint.status_logs.map((log, idx) => (
                  <div key={log.id || idx} className="flex items-start gap-3 text-xs">
                    <div className="w-2 h-2 rounded-full bg-brand-600 mt-1.5 shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{log.new_status}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500">by {log.changed_by}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      {log.note && <p className="text-slate-600 mt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">{log.note}</p>}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">No activity logs recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

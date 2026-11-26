import React from 'react';
import { MapPin, ThumbsUp, Clock, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { Complaint } from '../types';
import { StatusBadge, PriorityBadge } from './StatusBadge';

interface IssueCardProps {
  complaint: Complaint;
  onSelect: (id: string) => void;
  onUpvote: (id: string, e: React.MouseEvent) => void;
}

export const IssueCard: React.FC<IssueCardProps> = ({ complaint, onSelect, onUpvote }) => {
  const timeAgo = (dateStr: string) => {
    const diff = (new Date().getTime() - new Date(dateStr).getTime()) / 1000;
    if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  return (
    <div
      onClick={() => onSelect(complaint.id)}
      className="group bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-brand-300 transition-all cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Header Badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              #{complaint.id}
            </span>
            <PriorityBadge priority={complaint.priority} />
            {complaint.ai_confidence && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full" title="Categorized by CivicFix AI Engine">
                <Sparkles className="w-2.5 h-2.5" />
                {Math.round(complaint.ai_confidence * 100)}% AI
              </span>
            )}
          </div>
          <StatusBadge status={complaint.status} size="sm" />
        </div>

        {/* Title & Description */}
        <h3 className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1 mb-1.5 text-base">
          {complaint.title}
        </h3>
        <p className="text-slate-600 text-xs line-clamp-2 mb-3 leading-relaxed">
          {complaint.description}
        </p>

        {/* Photo thumbnail if present */}
        {complaint.image_url && (
          <div className="h-36 w-full rounded-xl overflow-hidden mb-3 bg-slate-100 relative">
            <img
              src={complaint.image_url}
              alt={complaint.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {complaint.status === 'Resolved' && complaint.resolution_image_url && (
              <span className="absolute bottom-2 right-2 bg-emerald-600/90 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Fix Verified
              </span>
            )}
          </div>
        )}

        {/* Location */}
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
          <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
          <span className="truncate">{complaint.location_name}</span>
        </div>
      </div>

      {/* Footer Strip */}
      <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <span>{timeAgo(complaint.created_at)}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => onUpvote(complaint.id, e)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 border border-slate-200 transition-colors font-medium"
            title="I am also affected by this issue"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            <span>{complaint.upvotes}</span>
          </button>
          <span className="text-brand-600 font-semibold group-hover:translate-x-0.5 transition-transform inline-flex items-center">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </div>
  );
};

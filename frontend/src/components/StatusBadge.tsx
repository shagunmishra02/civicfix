import React from 'react';
import { ComplaintStatus, ComplaintPriority } from '../types';

interface StatusBadgeProps {
  status: ComplaintStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  let colorClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotClass = 'bg-slate-400';

  switch (status) {
    case 'Reported':
      colorClass = 'bg-sky-50 text-sky-700 border-sky-200';
      dotClass = 'bg-sky-500';
      break;
    case 'Assigned':
      colorClass = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      dotClass = 'bg-indigo-500';
      break;
    case 'In Progress':
      colorClass = 'bg-amber-50 text-amber-800 border-amber-200';
      dotClass = 'bg-amber-500 animate-pulse';
      break;
    case 'Resolved':
      colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      dotClass = 'bg-emerald-500';
      break;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs font-medium px-2.5 py-1 gap-2',
    lg: 'text-sm font-medium px-3 py-1.5 gap-2.5'
  };

  return (
    <span className={`inline-flex items-center rounded-full border ${colorClass} ${sizeClasses[size]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {status}
    </span>
  );
};

interface PriorityBadgeProps {
  priority: ComplaintPriority | string;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'sm' }) => {
  let colorClass = 'bg-slate-100 text-slate-600 border-slate-200';

  switch (priority) {
    case 'Low':
      colorClass = 'bg-slate-100 text-slate-600 border-slate-200';
      break;
    case 'Medium':
      colorClass = 'bg-blue-50 text-blue-700 border-blue-200';
      break;
    case 'High':
      colorClass = 'bg-orange-50 text-orange-700 border-orange-200 font-semibold';
      break;
    case 'Critical':
      colorClass = 'bg-rose-50 text-rose-700 border-rose-300 font-semibold shadow-xs';
      break;
  }

  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs ${colorClass}`}>
      {priority === 'Critical' && (
        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping" />
      )}
      {priority}
    </span>
  );
};

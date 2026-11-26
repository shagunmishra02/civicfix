import React, { useState, useEffect } from 'react';
import { Search, Map, LayoutGrid, Filter, PlusCircle, AlertCircle } from 'lucide-react';
import { IssueCard } from '../components/IssueCard';
import { CampusMap } from '../components/CampusMap';
import { fetchComplaints, upvoteComplaint } from '../api/client';
import { Complaint, ComplaintCategory } from '../types';

interface PublicFeedPageProps {
  onSelectComplaint: (id: string) => void;
  onNavigateReport: () => void;
}

const CATEGORIES = [
  'All',
  'Streetlights & Electrical',
  'Roads & Potholes',
  'Garbage & Sanitation',
  'Water & Plumbing',
  'Campus Safety & Security',
  'Infrastructure & Facilities'
];

const STATUSES = ['All', 'Reported', 'In Progress', 'Resolved'];

export const PublicFeedPage: React.FC<PublicFeedPageProps> = ({
  onSelectComplaint,
  onNavigateReport,
}) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadComplaints = async () => {
    try {
      setIsLoading(true);
      const data = await fetchComplaints({
        category: selectedCategory,
        status: selectedStatus,
        search: searchQuery,
      });
      setComplaints(data);
    } catch (err) {
      console.error('Failed to load feed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [selectedCategory, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadComplaints();
  };

  const handleUpvote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await upvoteComplaint(id);
      setComplaints((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (err) {
      console.error('Upvote failed:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Feed Hero Banner */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-blue-600 rounded-3xl p-6 sm:p-10 text-white shadow-lg shadow-brand-500/10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-brand-200">
            Mody University • Student Community Transparency
          </span>
          <h1 className="text-2xl sm:text-3xl font-black mt-1">Campus Infrastructure Board (Laxmangarh)</h1>
          <p className="text-brand-100 text-xs sm:text-sm mt-1 max-w-xl">
            Live reports across Mody University's 265-acre campus. Upvote urgent defects to escalate priority with the Estate Maintenance Directorate.
          </p>
        </div>

        <button
          onClick={onNavigateReport}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-brand-700 hover:bg-brand-50 font-bold text-sm shadow-md transition-all self-start md:self-auto shrink-0"
        >
          <PlusCircle className="w-4 h-4 text-brand-600" />
          <span>Report New Defect</span>
        </button>
      </div>

      {/* Filter and View Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by issue, location or #ticket..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </form>

        {/* View Toggle */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === 'map' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              <Map className="w-3.5 h-3.5" />
              <span>Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all ${
              selectedCategory === cat
                ? 'bg-brand-600 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {viewMode === 'map' ? (
        <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs">
          <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
            <span>Showing {complaints.length} issues across campus</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-rose-600" /> Open</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> In Progress</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600" /> Resolved</span>
            </div>
          </div>
          <CampusMap
            mode="view"
            complaints={complaints}
            onSelectComplaint={onSelectComplaint}
            height="540px"
          />
        </div>
      ) : (
        <div>
          {isLoading ? (
            <div className="text-center py-16 text-slate-400 text-sm">
              Loading campus reports...
            </div>
          ) : complaints.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {complaints.map((item) => (
                <IssueCard
                  key={item.id}
                  complaint={item}
                  onSelect={onSelectComplaint}
                  onUpvote={handleUpvote}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h3 className="font-bold text-slate-700 text-base">No Issues Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                No active complaints match your current search or category filter.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

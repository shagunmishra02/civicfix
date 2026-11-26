import React from 'react';
import {
  ShieldAlert,
  PlusCircle,
  LayoutList,
  Search,
  Building2,
  Lock,
  LogOut,
  UserCheck,
  Sparkles
} from 'lucide-react';

export type NavTab = 'report' | 'feed' | 'track' | 'admin';

interface NavbarProps {
  portal: 'student' | 'admin';
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  openIssuesCount?: number;
  adminUser: string | null;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  portal,
  currentTab,
  onTabChange,
  openIssuesCount = 0,
  adminUser,
  onOpenAdminLogin,
  onLogoutAdmin,
}) => {
  // If in Admin Management Portal mode
  if (portal === 'admin') {
    return (
      <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Admin Brand */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-bold shadow-md shadow-amber-400/20">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-lg tracking-tight text-white">
                    Civic<span className="text-amber-400">Fix</span>
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700">
                    Estate Management Portal
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Mody University of Science and Technology • Laxmangarh Campus
                </p>
              </div>
            </div>

            {/* Officer Details & Return Button */}
            <div className="flex items-center gap-3">
              {adminUser && (
                <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-medium text-slate-300">{adminUser}</span>
                </div>
              )}

              <button
                onClick={onLogoutAdmin}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-all shadow-xs"
                title="Return to Student Complaint Portal"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span>Exit to Student Portal</span>
              </button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  // Student / Citizen Reporting Portal Mode
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('feed')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  Civic<span className="text-brand-600">Fix</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                  Student Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Mody University of Science &amp; Technology (Laxmangarh, Sikar)
              </p>
            </div>
          </div>

          {/* Student Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onTabChange('report')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'report'
                  ? 'bg-brand-50 text-brand-700 border border-brand-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <PlusCircle className="h-4 w-4 text-brand-600" />
              <span>Report Issue</span>
            </button>

            <button
              onClick={() => onTabChange('feed')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'feed'
                  ? 'bg-brand-50 text-brand-700 border border-brand-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutList className="h-4 w-4" />
              <span>Campus Feed</span>
              {openIssuesCount > 0 && (
                <span className="ml-1 text-[11px] font-bold px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700">
                  {openIssuesCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onTabChange('track')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'track'
                  ? 'bg-brand-50 text-brand-700 border border-brand-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Search className="h-4 w-4" />
              <span>Track Ticket</span>
            </button>

            {/* Distinct Estate Office Authority Login Button */}
            <div className="pl-2 ml-1 border-l border-slate-200">
              <button
                onClick={onOpenAdminLogin}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-black text-amber-300 hover:text-amber-200 text-xs font-bold transition-all shadow-xs"
                title="Estate Office & Maintenance Directorate Management Login"
              >
                <Lock className="h-3.5 w-3.5 text-amber-400" />
                <span className="hidden sm:inline">Estate Directorate</span>
                <span className="sm:hidden">Staff</span>
              </button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

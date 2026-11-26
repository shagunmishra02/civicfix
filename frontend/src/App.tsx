import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { AdminLoginModal } from './components/AdminLoginModal';
import { ReportIssuePage } from './pages/ReportIssuePage';
import { IssueTrackerPage } from './pages/IssueTrackerPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { PublicFeedPage } from './pages/PublicFeedPage';
import {
  fetchComplaints,
  fetchCurrentOfficer,
  logoutStaff,
  OfficerProfile
} from './api/client';
import { Building2, ShieldCheck, Lock, ArrowRight, UserCheck } from 'lucide-react';

export const App: React.FC = () => {
  const [portal, setPortal] = useState<'student' | 'admin'>('student');
  const [currentTab, setCurrentTab] = useState<NavTab>('feed');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [openIssuesCount, setOpenIssuesCount] = useState<number>(0);

  // Authorized Officer State
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [officer, setOfficer] = useState<OfficerProfile | null>(null);

  // Verify authentication on mount
  useEffect(() => {
    fetchCurrentOfficer()
      .then((verifiedOfficer) => {
        if (verifiedOfficer) {
          setOfficer(verifiedOfficer);
        }
      })
      .catch((err) => console.error('Auth verification error:', err));
  }, []);

  // Sync with URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const trackParam = urlParams.get('track');
    const tabParam = urlParams.get('tab') as NavTab | null;
    const portalParam = urlParams.get('portal');

    if (portalParam === 'admin' && officer) {
      setPortal('admin');
    } else if (trackParam) {
      setSelectedTicketId(trackParam);
      setCurrentTab('track');
    } else if (tabParam && ['report', 'feed', 'track'].includes(tabParam)) {
      setCurrentTab(tabParam);
    }

    // Fetch initial count for badge
    fetchComplaints({ status: 'Reported' })
      .then((items) => setOpenIssuesCount(items.length))
      .catch((err) => console.error(err));
  }, [officer]);

  const handleNavigateTicket = (ticketId: string) => {
    setSelectedTicketId(ticketId);
    setPortal('student');
    setCurrentTab('track');
    window.history.pushState({}, '', `?track=${ticketId}`);
  };

  const handleTabChange = (tab: NavTab) => {
    setCurrentTab(tab);
    if (tab !== 'track') {
      window.history.pushState({}, '', `?tab=${tab}`);
    }
  };

  const handleOpenAdminLogin = () => {
    if (officer) {
      // Already authenticated with valid token
      setPortal('admin');
      window.history.pushState({}, '', `?portal=admin`);
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  const handleAdminLoginSuccess = (verifiedOfficer: OfficerProfile) => {
    setOfficer(verifiedOfficer);
    setIsAdminLoginOpen(false);
    setPortal('admin');
    window.history.pushState({}, '', `?portal=admin`);
  };

  const handleLogoutAdmin = () => {
    logoutStaff();
    setOfficer(null);
    setPortal('student');
    setCurrentTab('feed');
    window.history.pushState({}, '', `?tab=feed`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <Navbar
        portal={portal}
        currentTab={currentTab}
        onTabChange={handleTabChange}
        openIssuesCount={openIssuesCount}
        adminUser={officer ? `${officer.name} (${officer.role})` : null}
        onOpenAdminLogin={handleOpenAdminLogin}
        onLogoutAdmin={handleLogoutAdmin}
      />

      {/* Admin Login Modal Gate */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={handleAdminLoginSuccess}
      />

      {/* Main Page Routing */}
      <main className="flex-1">
        {portal === 'admin' && officer ? (
          // DEDICATED ESTATE MANAGEMENT WORKSPACE (STRICTLY AUTHORIZED)
          <div className="animate-fadeIn">
            {/* Admin Management Sub-Banner */}
            <div className="bg-slate-800 text-slate-300 py-2 px-4 border-b border-slate-700 text-xs">
              <div className="max-w-7xl mx-auto flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <strong>Active Verified Session:</strong> {officer.department}
                </span>
                <button
                  onClick={() => {
                    setPortal('student');
                    setCurrentTab('report');
                  }}
                  className="text-amber-300 hover:underline flex items-center gap-1 text-[11px]"
                >
                  <span>Student Portal View</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <AdminDashboardPage onSelectTicket={handleNavigateTicket} />
          </div>
        ) : (
          // DEDICATED STUDENT / PUBLIC CITIZEN WORKSPACE
          <div className="animate-fadeIn">
            {currentTab === 'report' && (
              <ReportIssuePage onSuccessNavigate={handleNavigateTicket} />
            )}

            {currentTab === 'feed' && (
              <PublicFeedPage
                onSelectComplaint={handleNavigateTicket}
                onNavigateReport={() => handleTabChange('report')}
              />
            )}

            {currentTab === 'track' && (
              <IssueTrackerPage
                initialTicketId={selectedTicketId}
                onNavigateTicket={(id) => setSelectedTicketId(id)}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-brand-600 flex items-center justify-center text-white">
              <Building2 className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-slate-800">CivicFix</span>
            <span>— Mody University of Science and Technology (Laxmangarh, Sikar, Rajasthan)</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            {portal === 'student' ? (
              <button
                onClick={handleOpenAdminLogin}
                className="text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 text-xs"
              >
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Authorized Estate Staff Login &rarr;</span>
              </button>
            ) : (
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" /> Verified Officer: {officer?.name}
              </span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

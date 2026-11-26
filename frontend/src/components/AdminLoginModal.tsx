import React, { useState } from 'react';
import {
  ShieldAlert,
  KeyRound,
  Building2,
  ArrowRight,
  X,
  AlertCircle,
  Lock
} from 'lucide-react';
import { loginStaff, OfficerProfile } from '../api/client';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (officer: OfficerProfile) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMsg('Please enter both your authorized staff email and passcode.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await loginStaff(email.trim(), password);
      onLoginSuccess(res.officer);
    } catch (err: any) {
      setErrorMsg(err.message || 'Access Denied: Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 relative animate-scaleUp">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          title="Return to Student Portal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-md">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
              Restricted Authority Access
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              Estate Directorate Login
            </h2>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-5 leading-relaxed">
          Access to campus defect triage, contractor dispatches, and milestone verification is restricted to authorized personnel. All operations are cryptographically verified and recorded in the audit trail.
        </p>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Authorized Staff Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. estate.head@modyuniversity.ac.in"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Estate Security Passcode
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter secure passcode"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 font-medium font-mono"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>{isLoading ? 'Verifying Credentials...' : 'Authenticate & Open Estate Management'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldAlert className="w-3 h-3 text-emerald-600" /> Cryptographically Audited
          </span>
          <button
            onClick={onClose}
            className="text-brand-600 hover:underline font-semibold"
          >
            ← Return to Student Portal
          </button>
        </div>
      </div>
    </div>
  );
};

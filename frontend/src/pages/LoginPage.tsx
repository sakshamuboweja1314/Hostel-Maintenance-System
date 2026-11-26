import React, { useState } from 'react';
import { 
  Building2, 
  GraduationCap, 
  ShieldCheck, 
  ArrowRight, 
  Cpu, 
  Lock, 
  User as UserIcon, 
  MapPin, 
  Clock, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { loginAsStudent, loginAsAdmin } = useAuth();
  
  // Tab state between Student and Admin portals
  const [activePortal, setActivePortal] = useState<'student' | 'admin'>('student');

  // Student form state
  const [studentName, setStudentName] = useState('Rohan Sharma');
  const [roomNumber, setRoomNumber] = useState('Room 204');
  const [hostelBlock, setHostelBlock] = useState('Block B');

  // Admin form state
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [adminError, setAdminError] = useState('');

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginAsStudent(studentName, roomNumber, hostelBlock);
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUsername.trim() === 'admin' && adminPassword === 'admin123') {
      loginAsAdmin('Chief Hostel Warden');
    } else {
      setAdminError('Invalid credentials. Use admin / admin123 or click Quick Login.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-xl shadow-blue-500/25 mb-4">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Hostel Maintenance System
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Edge-Based NLP Complaint Prioritization with Dynamic Timeline Aging
        </p>

        {/* NLP Architecture Pill */}
        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
          <Cpu className="w-3.5 h-3.5 text-blue-400" />
          <span>Local DistilBERT NLP</span>
          <span>•</span>
          <span className="text-emerald-400 font-medium">100% Edge Inference</span>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg z-10 px-4">
        <div className="bg-slate-800/90 backdrop-blur-md border border-slate-700 shadow-2xl rounded-2xl p-6 sm:p-8">
          
          {/* Portal Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/80 rounded-xl mb-6 border border-slate-700/70">
            <button
              type="button"
              onClick={() => { setActivePortal('student'); setAdminError(''); }}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
                activePortal === 'student'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Student Portal</span>
            </button>
            <button
              type="button"
              onClick={() => setActivePortal('admin')}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-sm transition-all ${
                activePortal === 'admin'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin / Warden</span>
            </button>
          </div>

          {/* Student Portal View */}
          {activePortal === 'student' && (
            <div>
              <div className="mb-5 pb-4 border-b border-slate-700/60">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-400" />
                  Student Maintenance Access
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Report hostel issues with photo proof, track live resolution milestones, and view timeline escalation.
                </p>
              </div>

              <form onSubmit={handleStudentSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Student Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="e.g. Rohan Sharma"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Room Number
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        placeholder="e.g. Room 204"
                        required
                        className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Hostel Block
                    </label>
                    <input
                      type="text"
                      value={hostelBlock}
                      onChange={(e) => setHostelBlock(e.target.value)}
                      placeholder="e.g. Block B"
                      required
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
                >
                  <span>Enter Student Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Demo Logins for Student */}
              <div className="mt-5 pt-4 border-t border-slate-700/60">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  1-Click Demo Profiles (For Viva Demo)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => loginAsStudent('Rohan Sharma', 'Room 204', 'Block B')}
                    className="p-2 text-left rounded-lg bg-slate-900/90 hover:bg-slate-700 border border-slate-700 text-xs transition-colors cursor-pointer"
                  >
                    <div className="font-semibold text-white">Rohan Sharma</div>
                    <div className="text-[11px] text-slate-400">Room 204 • Block B</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => loginAsStudent('Ananya Patel', 'Room 312', 'Girls Hostel 2')}
                    className="p-2 text-left rounded-lg bg-slate-900/90 hover:bg-slate-700 border border-slate-700 text-xs transition-colors cursor-pointer"
                  >
                    <div className="font-semibold text-white">Ananya Patel</div>
                    <div className="text-[11px] text-slate-400">Room 312 • GH 2</div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Admin Portal View */}
          {activePortal === 'admin' && (
            <div>
              <div className="mb-5 pb-4 border-b border-slate-700/60">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  Administrator & Warden Access
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Full control: prioritize dynamic queue, view aging timelines, inspect photo evidence, and audit model performance.
                </p>
              </div>

              {adminError && (
                <div className="mb-4 p-3 rounded-lg bg-red-900/40 border border-red-700/60 flex items-center gap-2 text-xs text-red-300">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{adminError}</span>
                </div>
              )}

              <form onSubmit={handleAdminSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Admin Username
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="admin"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <span>Enter Admin Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick 1-Click Demo Login for Admin */}
              <div className="mt-5 pt-4 border-t border-slate-700/60">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                  1-Click Quick Login (For Viva Examiner)
                </span>
                <button
                  type="button"
                  onClick={() => loginAsAdmin('Chief Hostel Warden')}
                  className="w-full p-2.5 flex items-center justify-between rounded-lg bg-slate-900/90 hover:bg-slate-700 border border-slate-700 text-xs transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <div className="text-left">
                      <div className="font-semibold text-white">Chief Hostel Warden (Administrator)</div>
                      <div className="text-[11px] text-slate-400">Credentials: admin / admin123</div>
                    </div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Feature highlight footer */}
        <div className="mt-6 grid grid-cols-2 gap-3 text-center text-xs text-slate-400">
          <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-800/40 border border-slate-700/50">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Dynamic Aging Escalation</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 p-2 rounded-lg bg-slate-800/40 border border-slate-700/50">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>SLA Overdue Guardrails</span>
          </div>
        </div>
      </div>
    </div>
  );
};

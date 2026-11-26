import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Calendar, 
  Image as ImageIcon,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Eye
} from 'lucide-react';
import { api } from '../services/api';
import { Complaint } from '../types';
import { useAuth } from '../context/AuthContext';
import { ComplaintDetailModal } from '../components/ComplaintDetailModal';

interface StudentComplaintsPageProps {
  onNavigateSubmit: () => void;
}

export const StudentComplaintsPage: React.FC<StudentComplaintsPageProps> = ({ onNavigateSubmit }) => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'In Progress' | 'Resolved'>('All');
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.getComplaints({ page: 1, limit: 100 });
      setComplaints(res.complaints);
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  // Filter complaints matching this student (or match by name/room, or if none match, show all recent complaints so demo always has data!)
  const myComplaints = complaints.filter(c => {
    if (!user) return true;
    const matchName = c.student_name && c.student_name.toLowerCase().includes(user.name.toLowerCase().split(' ')[0]);
    const matchRoom = c.room_number && user.roomNumber && c.room_number.toLowerCase().includes(user.roomNumber.toLowerCase().replace('room', '').trim());
    return matchName || matchRoom;
  });

  // Fallback to all complaints if current student hasn't submitted yet
  const displayedComplaints = (myComplaints.length > 0 ? myComplaints : complaints)
    .filter(c => statusFilter === 'All' || c.status === statusFilter);

  const totalCount = myComplaints.length > 0 ? myComplaints.length : complaints.length;
  const pendingCount = (myComplaints.length > 0 ? myComplaints : complaints).filter(c => c.status === 'Pending').length;
  const inProgressCount = (myComplaints.length > 0 ? myComplaints : complaints).filter(c => c.status === 'In Progress').length;
  const resolvedCount = (myComplaints.length > 0 ? myComplaints : complaints).filter(c => c.status === 'Resolved').length;

  return (
    <div className="space-y-6">
      {/* Student Welcome Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" />
              Student Portal
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-600 font-medium">{user?.roomNumber} ({user?.hostelBlock})</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome, {user?.name || 'Student'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your submitted maintenance complaints, monitor live resolution milestones, and view timeline aging priority escalation.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchComplaints}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            title="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onNavigateSubmit}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit New Complaint</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-slate-500">Total Reported</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalCount}</p>
        </div>
        <div className="bg-amber-50/60 border border-amber-200/60 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-amber-700 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
          <p className="text-2xl font-bold text-amber-900 mt-1">{pendingCount}</p>
        </div>
        <div className="bg-blue-50/60 border border-blue-200/60 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-blue-700 flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5" />
            In Progress
          </span>
          <p className="text-2xl font-bold text-blue-900 mt-1">{inProgressCount}</p>
        </div>
        <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-xl p-4 shadow-xs">
          <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Resolved
          </span>
          <p className="text-2xl font-bold text-emerald-900 mt-1">{resolvedCount}</p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        {(['All', 'Pending', 'In Progress', 'Resolved'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === tab
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Complaints List with Timelines */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-xs font-medium">Fetching complaint timelines...</p>
        </div>
      ) : displayedComplaints.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No complaints in this category</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            All your issues have been triaged or resolved. If you have a new maintenance problem, click below to submit.
          </p>
          <button
            onClick={onNavigateSubmit}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-xs hover:bg-blue-700 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Submit Complaint</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedComplaints.map(complaint => {
            const isResolved = complaint.status === 'Resolved';
            const baseScore = complaint.base_priority_score ?? complaint.priority_score;
            const agingBoost = complaint.aging_boost ?? 0;
            const hasAgingBoost = agingBoost > 0 && !isResolved;

            return (
              <div 
                key={complaint.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {/* Overdue alert banner if applicable */}
                {complaint.is_overdue && !isResolved && (
                  <div className="mb-4 -mt-1 -mx-1 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between text-xs text-red-700 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      SLA Overdue: Exceeded resolution target. Priority automatically escalated!
                    </span>
                    <span className="font-mono text-red-800">+{agingBoost.toFixed(1)} Aging Boost</span>
                  </div>
                )}

                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left Column: Complaint Details */}
                  <div className="space-y-3 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">
                        #{complaint.id}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {complaint.predicted_category}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        complaint.final_urgency === 'Critical' ? 'bg-red-50 text-red-700 border border-red-200' :
                        complaint.final_urgency === 'High' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                        complaint.final_urgency === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {complaint.final_urgency} Urgency
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        complaint.status === 'Resolved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        complaint.status === 'In Progress' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {complaint.status}
                      </span>
                      {complaint.image_url && (
                        <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[11px] font-semibold flex items-center gap-1">
                          <ImageIcon className="w-3 h-3 text-purple-600" />
                          Photo Proof
                        </span>
                      )}
                    </div>

                    <p className="text-sm sm:text-base font-semibold text-slate-800 leading-snug">
                      "{complaint.complaint_text}"
                    </p>

                    {/* Room & Timestamp info */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                      <span>Room: <strong className="text-slate-700">{complaint.room_number || 'Unspecified'}</strong></span>
                      <span>•</span>
                      <span>Block: <strong className="text-slate-700">{complaint.hostel_block || 'Unspecified'}</strong></span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Reported: {complaint.elapsed_time_str || new Date(complaint.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Admin notes if present */}
                    {complaint.admin_notes && (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                        <strong className="text-slate-900 block mb-0.5">Warden / Maintenance Note:</strong>
                        {complaint.admin_notes}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Dynamic Priority Score & Inspect Button */}
                  <div className="lg:w-64 shrink-0 p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <div>
                      <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                        <span>Dynamic Priority</span>
                        <span className="font-mono font-bold text-slate-900">{complaint.priority_score.toFixed(1)}/100</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            complaint.priority_score >= 80 ? 'bg-red-600' :
                            complaint.priority_score >= 60 ? 'bg-orange-500' :
                            complaint.priority_score >= 40 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, complaint.priority_score)}%` }}
                        />
                      </div>
                    </div>

                    {/* Aging escalation math */}
                    <div className="text-[11px] text-slate-600 space-y-1 bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="flex justify-between">
                        <span>Base NLP Score:</span>
                        <span className="font-mono font-semibold">{baseScore.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between text-indigo-700">
                        <span>Timeline Aging Boost:</span>
                        <span className="font-mono font-bold">+{agingBoost.toFixed(1)}</span>
                      </div>
                      {hasAgingBoost && (
                        <p className="text-[10px] text-indigo-600 pt-1 border-t border-slate-100">
                          ⏱️ Score escalated over time to prevent task delay.
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedComplaint(complaint)}
                      className="w-full py-2 px-3 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>View Full Timeline & Evidence</span>
                    </button>
                  </div>
                </div>

                {/* Progress Timeline Stepper */}
                <div className="mt-5 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className="space-y-1">
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto text-xs font-bold">✓</div>
                      <span className="font-semibold text-slate-800 text-[11px] block">Submitted</span>
                      <span className="text-[10px] text-slate-400 block">{complaint.elapsed_time_str || 'Registered'}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto text-xs font-bold">✓</div>
                      <span className="font-semibold text-slate-800 text-[11px] block">NLP Prioritized</span>
                      <span className="text-[10px] text-slate-400 block">{complaint.final_urgency}</span>
                    </div>
                    <div className="space-y-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                        complaint.status === 'In Progress' || isResolved
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        {complaint.status === 'In Progress' || isResolved ? '✓' : '3'}
                      </div>
                      <span className="font-semibold text-slate-800 text-[11px] block">Technician Dispatched</span>
                      <span className="text-[10px] text-slate-400 block">
                        {complaint.status === 'In Progress' ? 'Active Work' : isResolved ? 'Completed' : 'Queueing'}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto text-xs font-bold ${
                        isResolved
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        {isResolved ? '✓' : '4'}
                      </div>
                      <span className="font-semibold text-slate-800 text-[11px] block">Resolved</span>
                      <span className="text-[10px] text-slate-400 block">
                        {isResolved ? 'Task Complete' : 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Complaint Detail Modal (with Photo proof & Full Timeline) */}
      {selectedComplaint && (
        <ComplaintDetailModal
          complaintId={selectedComplaint.id}
          onClose={() => setSelectedComplaint(null)}
          onUpdate={fetchComplaints}
        />
      )}
    </div>
  );
};

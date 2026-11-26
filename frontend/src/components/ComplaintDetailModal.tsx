import React, { useEffect, useState } from 'react';
import { 
  X, 
  Clock, 
  User, 
  MapPin, 
  Cpu, 
  ShieldAlert, 
  History, 
  CheckCircle2, 
  AlertTriangle,
  Edit3,
  Camera,
  ExternalLink,
  Hourglass,
  Calendar,
  Layers
} from 'lucide-react';
import { Complaint, ComplaintHistory } from '../types';
import { api, resolveImageUrl } from '../services/api';
import { Badge } from './Badge';
import { useAuth } from '../context/AuthContext';

interface ComplaintDetailModalProps {
  complaintId?: number;
  complaint?: Complaint;
  onClose: () => void;
  onStatusChange?: (status: string, note?: string) => Promise<void>;
  onOverridePriority?: (urgency: string, reason: string) => Promise<void>;
  onUpdate?: () => void;
}

export const ComplaintDetailModal: React.FC<ComplaintDetailModalProps> = ({
  complaintId,
  complaint: initialComplaint,
  onClose,
  onStatusChange,
  onOverridePriority,
  onUpdate
}) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [activeComplaint, setActiveComplaint] = useState<Complaint | null>(initialComplaint || null);
  const [history, setHistory] = useState<ComplaintHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Status update state
  const [newStatus, setNewStatus] = useState<string>(initialComplaint?.status || 'Pending');
  const [statusNote, setStatusNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Override urgency state
  const [showOverride, setShowOverride] = useState(false);
  const [overrideUrgency, setOverrideUrgency] = useState<string>(initialComplaint?.final_urgency || 'High');
  const [overrideReason, setOverrideReason] = useState('');
  const [overriding, setOverriding] = useState(false);

  const targetId = activeComplaint?.id || complaintId;

  // Fetch full complaint if only ID was passed
  useEffect(() => {
    if (complaintId && !initialComplaint) {
      api.getComplaintById(complaintId)
        .then((data: Complaint) => {
          setActiveComplaint(data);
          setNewStatus(data.status);
          setOverrideUrgency(data.final_urgency);
        })
        .catch((err: unknown) => console.error('Failed to fetch complaint:', err));
    }
  }, [complaintId, initialComplaint]);

  const fetchHistory = async () => {
    if (!targetId) return;
    try {
      setLoadingHistory(true);
      const data = await api.getComplaintHistory(targetId);
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [targetId]);

  if (!activeComplaint) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-6 text-center text-slate-500">
          Loading complaint details...
        </div>
      </div>
    );
  }

  const complaint = activeComplaint;
  const baseScore = complaint.base_priority_score ?? complaint.priority_score;
  const agingBoost = complaint.aging_boost ?? 0;
  const isResolved = complaint.status === 'Resolved';

  const handleStatusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdatingStatus(true);
      if (onStatusChange) {
        await onStatusChange(newStatus, statusNote);
      } else {
        const updated = await api.updateStatus(complaint.id, newStatus, statusNote);
        setActiveComplaint(updated);
      }
      await fetchHistory();
      if (onUpdate) onUpdate();
      setStatusNote('');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideReason.trim()) return;
    try {
      setOverriding(true);
      if (onOverridePriority) {
        await onOverridePriority(overrideUrgency, overrideReason);
      } else {
        const updated = await api.overridePriority(complaint.id, overrideUrgency, overrideReason);
        setActiveComplaint(updated);
      }
      await fetchHistory();
      if (onUpdate) onUpdate();
      setShowOverride(false);
      setOverrideReason('');
    } finally {
      setOverriding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500">#{complaint.id}</span>
              <h2 className="text-base font-bold text-slate-900">Complaint Lifecycle & Timeline</h2>
              <Badge type="status" value={complaint.status} size="sm" />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Submitted {new Date(complaint.created_at).toLocaleString()} • {complaint.elapsed_time_str || 'Recently'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Main Description */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Natural Language Complaint Description:
            </span>
            <p className="text-sm text-slate-900 font-medium leading-relaxed">
              "{complaint.complaint_text}"
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-slate-200 text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {complaint.room_number || 'No Room'}, {complaint.hostel_block || 'Hostel'}
              </span>
              <span className="flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {complaint.student_name || 'Anonymous Student'}
              </span>
              <span className="flex items-center gap-1 text-slate-500">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Age: {complaint.elapsed_time_str || 'Just now'}
              </span>
            </div>
          </div>

          {/* Photo Proof / Visual Evidence (If Attached) */}
          {complaint.image_url && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-600" />
                  Attached Photo Proof (Visual Evidence):
                </span>
                <a
                  href={resolveImageUrl(complaint.image_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Full Resolution
                </a>
              </div>
              <div className="rounded-lg overflow-hidden border border-slate-200 bg-white max-h-80 flex items-center justify-center p-1">
                <img
                  src={resolveImageUrl(complaint.image_url)}
                  alt="Complaint evidence"
                  className="max-h-76 w-auto object-contain rounded-md"
                />
              </div>
            </div>
          )}

          {/* Timeline & Aging Priority Escalation Card */}
          <div className="p-4 bg-gradient-to-br from-indigo-50/60 to-blue-50/40 rounded-xl border border-indigo-200/80 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-2.5">
              <div className="flex items-center gap-2">
                <Hourglass className="w-4 h-4 text-indigo-600" />
                <h3 className="text-xs font-bold text-indigo-950 uppercase tracking-wider">
                  Dynamic Priority & Timeline Aging Model
                </h3>
              </div>
              {complaint.is_overdue && !isResolved && (
                <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 text-[11px] font-bold border border-red-300 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-red-600" />
                  SLA Overdue Escalated
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Base NLP Score</span>
                <span className="text-base font-bold text-slate-800 font-mono">{baseScore.toFixed(1)}</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-100">
                <span className="text-[10px] uppercase font-bold text-indigo-600 block">Aging Boost</span>
                <span className="text-base font-bold text-indigo-700 font-mono">+{agingBoost.toFixed(1)}</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-100">
                <span className="text-[10px] uppercase font-bold text-blue-700 block">Dynamic Priority</span>
                <span className="text-base font-black text-blue-900 font-mono">{complaint.priority_score.toFixed(1)}</span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-100">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Target SLA</span>
                <span className="text-base font-bold text-slate-700 font-mono">{complaint.sla_hours || 48}h</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 bg-white/60 p-2.5 rounded-lg border border-indigo-100/60 leading-relaxed">
              <strong>Aging Formula:</strong> Tasks that take longer to resolve dynamically accumulate aging priority points (+0.75 pts/hr up to +45 pts cap), guaranteeing that older routine complaints escalate and cannot be indefinitely starved.
            </p>
          </div>

          {/* Interactive Lifecycle Timeline */}
          {complaint.timeline && complaint.timeline.length > 0 && (
            <div className="p-4 bg-white rounded-xl border border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                Lifecycle Milestones Timeline
              </h3>
              <div className="relative border-l-2 border-slate-200 pl-4 ml-2 space-y-4">
                {complaint.timeline.map((event, idx) => (
                  <div key={idx} className="relative">
                    <span className={`absolute -left-[23px] top-1 w-3 h-3 rounded-full border-2 border-white ${
                      event.status === 'completed' ? 'bg-emerald-500' :
                      event.status === 'warning' ? 'bg-red-500 animate-pulse' :
                      event.status === 'in_progress' ? 'bg-blue-600' :
                      event.status === 'active' ? 'bg-indigo-600' : 'bg-amber-500'
                    }`} />
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900">{event.title}</span>
                      {event.timestamp && (
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{event.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NLP Model Prediction & Transparency Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Category Card */}
            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-blue-900 uppercase tracking-wider">
                  Model 1: Category
                </span>
                <span className="text-xs font-bold text-blue-700 font-mono">
                  {(complaint.category_confidence * 100).toFixed(1)}%
                </span>
              </div>
              <p className="font-bold text-base text-slate-900">{complaint.predicted_category}</p>
              <p className="text-[11px] text-slate-500 mt-1">
                6-class DistilBERT sequence classification head.
              </p>
            </div>

            {/* Urgency Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Model 2: Urgency
                </span>
                <span className="text-xs font-bold text-slate-600 font-mono">
                  {(complaint.urgency_confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge type="urgency" value={complaint.final_urgency} />
                {complaint.safety_override && (
                  <Badge type="safety" value="Safety Escalated" size="sm" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                4-class DistilBERT urgency classification head.
              </p>
            </div>
          </div>

          {/* Priority Score & Rationale */}
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Full Priority Rationale:
              </span>
              <span className="font-mono text-xl font-black text-blue-700">
                {complaint.priority_score.toFixed(2)} / 100.0
              </span>
            </div>
            <p className="text-xs font-mono text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 leading-relaxed">
              {complaint.priority_reason}
            </p>
          </div>

          {/* Admin Management Controls (Only visible to Admin role) */}
          {isAdmin ? (
            <div className="space-y-4">
              {/* Admin Override Section */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                    Administrator Priority Override
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowOverride(!showOverride)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    {showOverride ? 'Cancel' : 'Override Urgency'}
                  </button>
                </div>

                {showOverride && (
                  <form onSubmit={handleOverrideSubmit} className="mt-3 pt-3 border-t border-slate-100 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">New Urgency</label>
                        <select
                          value={overrideUrgency}
                          onChange={(e) => setOverrideUrgency(e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-300 p-2 bg-white"
                        >
                          <option value="Critical">Critical (Weight 100)</option>
                          <option value="High">High (Weight 75)</option>
                          <option value="Medium">Medium (Weight 50)</option>
                          <option value="Low">Low (Weight 25)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Reason for Override</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Student exam tomorrow / temporary fix applied"
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          className="w-full text-xs rounded-lg border border-slate-300 p-2"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={overriding || !overrideReason.trim()}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer"
                    >
                      {overriding ? 'Applying...' : 'Apply Admin Override'}
                    </button>
                  </form>
                )}
              </div>

              {/* Status Update Form */}
              <div className="border border-slate-200 rounded-xl p-4 bg-white">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                  Update Maintenance Workflow Status
                </h3>
                <form onSubmit={handleStatusSubmit} className="flex flex-col sm:flex-row gap-3">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="text-xs rounded-lg border border-slate-300 p-2 bg-white sm:w-44"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Under Review">Under Review</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Optional technician notes or progress update..."
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    className="text-xs rounded-lg border border-slate-300 p-2 grow"
                  />
                  <button
                    type="submit"
                    disabled={updatingStatus}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shrink-0 transition cursor-pointer"
                  >
                    {updatingStatus ? 'Updating...' : 'Update Status'}
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Status and urgency are managed by the Hostel Facility Warden. You will be notified as milestones update.
              </span>
            </div>
          )}

          {/* Audit History Timeline */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-slate-500" />
              Audit Log & State Transition History
            </h3>
            {loadingHistory ? (
              <p className="text-xs text-slate-400">Loading audit history...</p>
            ) : history.length === 0 ? (
              <p className="text-xs text-slate-400">No audit events recorded.</p>
            ) : (
              <div className="space-y-2 border-l-2 border-slate-200 pl-4 ml-1">
                {history.map((h) => (
                  <div key={h.id} className="relative text-xs">
                    <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-white"></span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{h.action}</span>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {h.new_value && (
                      <p className="text-slate-600 mt-0.5">{h.new_value}</p>
                    )}
                    {h.note && (
                      <p className="text-slate-500 italic mt-0.5">Note: {h.note}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


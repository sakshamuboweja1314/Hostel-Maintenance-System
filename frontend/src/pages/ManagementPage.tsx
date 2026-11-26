import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  AlertCircle, 
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Camera
} from 'lucide-react';
import { api } from '../services/api';
import { Complaint, ComplaintListResponse } from '../types';
import { Badge } from '../components/Badge';
import { ComplaintDetailModal } from '../components/ComplaintDetailModal';

interface ManagementPageProps {
  initialComplaintId?: number;
}

export const ManagementPage: React.FC<ManagementPageProps> = ({ initialComplaintId }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selected for modal
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError(null);
      const data: ComplaintListResponse = await api.getComplaints({
        page,
        limit,
        search: search.trim() || undefined,
        category: categoryFilter,
        urgency: urgencyFilter,
        status: statusFilter
      });
      setComplaints(data.complaints);
      setTotal(data.total);

      // If initialComplaintId passed, open modal
      if (initialComplaintId && !selectedComplaint) {
        const target = data.complaints.find(c => c.id === initialComplaintId);
        if (target) setSelectedComplaint(target);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading complaints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page, categoryFilter, urgencyFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchComplaints();
  };

  const handleStatusChange = async (newStatus: string, note?: string) => {
    if (!selectedComplaint) return;
    const updated = await api.updateStatus(selectedComplaint.id, newStatus, note);
    setSelectedComplaint(updated);
    setComplaints(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleOverridePriority = async (urgency: string, reason: string) => {
    if (!selectedComplaint) return;
    const updated = await api.overridePriority(selectedComplaint.id, urgency, reason);
    setSelectedComplaint(updated);
    setComplaints(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Complaint Queue Management</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Ranked by Priority Score descending (Critical → Low, weighted by model confidence).
          </p>
        </div>
        <button
          onClick={fetchComplaints}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-xs transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Queue
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative grow">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by complaint text, room number, or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs rounded-lg border border-slate-300 pl-9 pr-3 py-2.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shrink-0 transition"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          <span className="font-semibold text-slate-600 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            Filters:
          </span>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 py-1 px-2.5 bg-white text-xs font-medium text-slate-700"
          >
            <option value="all">All Categories (6)</option>
            <option value="Water and Plumbing">Water and Plumbing</option>
            <option value="Electrical">Electrical</option>
            <option value="Internet and Wi-Fi">Internet and Wi-Fi</option>
            <option value="Cleanliness and Sanitation">Cleanliness and Sanitation</option>
            <option value="Furniture and Civil Maintenance">Furniture & Civil</option>
            <option value="Other">Other</option>
          </select>

          {/* Urgency Filter */}
          <select
            value={urgencyFilter}
            onChange={(e) => { setUrgencyFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 py-1 px-2.5 bg-white text-xs font-medium text-slate-700"
          >
            <option value="all">All Urgency Levels</option>
            <option value="Critical">Critical (100)</option>
            <option value="High">High (75)</option>
            <option value="Medium">Medium (50)</option>
            <option value="Low">Low (25)</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 py-1 px-2.5 bg-white text-xs font-medium text-slate-700"
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Under Review">Under Review</option>
          </select>

          <span className="ml-auto text-slate-400 text-xs">
            Showing {complaints.length} of {total} records
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-200 flex items-center gap-2 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5">ID</th>
                <th className="px-4 py-3.5">Complaint Description</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Urgency</th>
                <th className="px-4 py-3.5 text-right">Dynamic Priority</th>
                <th className="px-4 py-3.5">Age & Timeline</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Flags</th>
                <th className="px-4 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && complaints.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400 text-xs">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-blue-500" />
                    Querying local SQLite database...
                  </td>
                </tr>
              ) : complaints.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-slate-400 text-xs">
                    No complaints matching your criteria.
                  </td>
                </tr>
              ) : (
                complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono text-xs font-bold text-slate-500">#{c.id}</td>
                    <td className="px-4 py-3 max-w-sm">
                      <p className="text-slate-900 font-medium truncate">{c.complaint_text}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-400">
                          {c.room_number ? `${c.room_number} • ` : ''}
                          {c.hostel_block || ''} •{' '}
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                        {c.image_url && (
                          <span className="inline-flex items-center gap-1 font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 text-[10px]">
                            <Camera className="w-3 h-3 text-blue-600" />
                            Photo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge type="category" value={c.predicted_category} size="sm" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge type="urgency" value={c.final_urgency} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right font-mono whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                        c.priority_score >= 80 ? 'bg-red-50 text-red-700 font-bold' :
                        c.priority_score >= 60 ? 'bg-amber-50 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {c.priority_score.toFixed(1)}
                      </span>
                      {c.aging_boost && c.aging_boost > 0 && c.status !== 'Resolved' && (
                        <span className="text-[10px] text-indigo-600 block font-semibold mt-0.5">
                          +{c.aging_boost.toFixed(1)} aging
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-700 font-medium">
                          {c.elapsed_time_str || new Date(c.created_at).toLocaleDateString()}
                        </span>
                        {c.is_overdue && c.status !== 'Resolved' ? (
                          <span className="text-[10px] font-bold text-red-600 flex items-center gap-0.5">
                            ⚠️ Overdue SLA
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            SLA: {c.sla_hours || 48}h
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <select
                        value={c.status}
                        onChange={async (e) => {
                          const updatedStatus = e.target.value;
                          try {
                            await api.updateStatus(c.id, updatedStatus);
                            fetchComplaints();
                          } catch (err) {
                            console.error('Failed to update status:', err);
                          }
                        }}
                        className={`text-xs font-semibold rounded-lg px-2.5 py-1 border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs transition-colors ${
                          c.status === 'Resolved' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                          c.status === 'In Progress' ? 'bg-blue-50 text-blue-800 border-blue-300' :
                          c.status === 'Under Review' ? 'bg-purple-50 text-purple-800 border-purple-300' :
                          'bg-amber-50 text-amber-800 border-amber-300'
                        }`}
                        title="Admin Action: Click to change complaint status"
                      >
                        <option value="Pending">🟡 Pending</option>
                        <option value="In Progress">🔵 In Progress</option>
                        <option value="Resolved">🟢 Resolved</option>
                        <option value="Under Review">🟣 Under Review</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {c.safety_override && (
                          <span title="Safety Hazard Escalated" className="text-red-600">
                            <ShieldAlert className="w-4 h-4" />
                          </span>
                        )}
                        {c.requires_human_review && (
                          <span title="Low Confidence (<60%) - Human Review Required" className="px-1.5 py-0.5 rounded-xs bg-purple-100 text-purple-700 text-[10px] font-bold">
                            REVIEW
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedComplaint(c)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-semibold transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded-md border border-slate-300 disabled:opacity-40 hover:bg-slate-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded-md border border-slate-300 disabled:opacity-40 hover:bg-slate-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          onStatusChange={handleStatusChange}
          onOverridePriority={handleOverridePriority}
        />
      )}
    </div>
  );
};

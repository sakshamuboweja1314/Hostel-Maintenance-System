import React, { useEffect, useState } from 'react';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  ArrowRight,
  RefreshCw,
  FolderTree,
  ShieldAlert,
  Building2,
  Activity,
  Camera
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';
import { api } from '../services/api';
import { DashboardStats, DashboardDistribution } from '../types';
import { Badge } from '../components/Badge';

interface DashboardPageProps {
  onNavigate: (tab: string, complaintId?: number) => void;
}

const URGENCY_COLORS: Record<string, string> = {
  Critical: '#dc2626',
  High: '#f59e0b',
  Medium: '#eab308',
  Low: '#10b981'
};

const CATEGORY_COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#ec4899', '#f97316', '#64748b'];

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [distribution, setDistribution] = useState<DashboardDistribution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, distData] = await Promise.all([
        api.getDashboardStats(),
        api.getDashboardDistribution()
      ]);
      setStats(statsData);
      setDistribution(distData);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px]">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-medium">Loading live SQLite maintenance metrics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl my-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
        <p className="text-red-800 font-semibold mb-2">Error connecting to local backend</p>
        <p className="text-xs text-red-600 mb-4">{error}</p>
        <button 
          onClick={fetchDashboardData} 
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Format Recharts data
  const urgencyPieData = Object.entries(distribution?.by_urgency || {}).map(([name, value]) => ({
    name,
    value
  }));

  const categoryBarData = Object.entries(distribution?.by_category || {}).map(([name, count]) => ({
    category: name.length > 16 ? name.slice(0, 14) + '...' : name,
    fullName: name,
    count
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner: Operational Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Hostel Maintenance Operational Command
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time complaint prioritization driven by edge-deployed DistilBERT Transformer models.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={() => onNavigate('submit')}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            + New Complaint
          </button>
        </div>
      </div>

      {/* KPI Stats Grid - 6 responsive balanced cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* Total */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total</span>
            <FolderTree className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 font-mono">{stats.total_complaints}</div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">All recorded complaints</p>
        </div>

        {/* Pending */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 font-mono">{stats.pending_complaints}</div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">Awaiting technician</p>
        </div>

        {/* Critical */}
        <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/30 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-red-600 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Critical</span>
            <AlertTriangle className="w-4 h-4 text-red-600 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-red-600 font-mono">{stats.critical_complaints}</div>
          <p className="text-[11px] text-red-600/80 mt-1 truncate font-medium">Immediate action needed</p>
        </div>

        {/* High */}
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-600 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">High Priority</span>
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-mono">{stats.high_priority_complaints}</div>
          <p className="text-[11px] text-amber-600/80 mt-1 truncate font-medium">Urgent triage</p>
        </div>

        {/* Human Review Required */}
        <div className="bg-white p-4 rounded-xl border border-purple-200 bg-purple-50/20 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-600 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Review Req.</span>
            <ShieldAlert className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-600 font-mono">{stats.needs_review_complaints}</div>
          <p className="text-[11px] text-purple-600/80 mt-1 truncate font-medium">Low confidence (&lt;60%)</p>
        </div>

        {/* Resolved */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Resolved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 font-mono">{stats.resolved_complaints}</div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">Completed repairs</p>
        </div>
      </div>

      {/* Analytics Charts - Height & padding adjusted to prevent any text clipping */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="mb-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Category Distribution</h2>
            <p className="text-xs text-slate-500">NLP sequence classification breakdown across 6 maintenance domains.</p>
          </div>
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryBarData} margin={{ top: 10, right: 15, left: -20, bottom: 55 }}>
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 10, fill: '#64748b' }} 
                  angle={-30} 
                  textAnchor="end" 
                  interval={0} 
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <Tooltip 
                  formatter={(val: any, _name: any, item: any) => [val, item.payload.fullName]}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Urgency Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="mb-2">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Urgency Distribution</h2>
            <p className="text-xs text-slate-500">Urgency levels predicted by DistilBERT and evaluated by the priority score engine.</p>
          </div>
          <div className="h-80 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={urgencyPieData}
                  cx="50%"
                  cy="46%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {urgencyPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={URGENCY_COLORS[entry.name] || CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Priority Queue (Clear Column Formatting Without Awkward Overflow) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 uppercase tracking-wider">
              Highest Priority Queue
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ranked dynamically: <code>Priority = Urgency Weight × Model Confidence</code>
            </p>
          </div>
          <button
            onClick={() => onNavigate('management')}
            className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 shrink-0"
          >
            View Full Queue ({stats.total_complaints})
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 text-slate-600 text-[11px] uppercase tracking-wider font-bold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-16">ID</th>
                <th className="px-4 py-3 min-w-[220px]">Complaint Details</th>
                <th className="px-4 py-3 w-36 whitespace-nowrap">Category</th>
                <th className="px-4 py-3 w-28 whitespace-nowrap">Urgency</th>
                <th className="px-4 py-3 w-28 text-right whitespace-nowrap">Priority Score</th>
                <th className="px-4 py-3 w-28 whitespace-nowrap">Status</th>
                <th className="px-4 py-3 w-20 text-right whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.top_priority.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500 text-xs">
                    No active complaints in the queue.
                  </td>
                </tr>
              ) : (
                stats.top_priority.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-mono text-xs text-slate-500 font-bold">#{c.id}</td>
                    <td className="px-4 py-3">
                      <p className="text-slate-900 font-medium line-clamp-1" title={c.text}>{c.text}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-400">
                          {c.room_number ? `${c.room_number} • ` : ''}
                          {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                      <Badge type="category" value={c.category} size="sm" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge type="urgency" value={c.urgency} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 font-mono whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-md text-xs ${
                        c.priority_score >= 80 ? 'bg-red-50 text-red-700 font-bold' :
                        c.priority_score >= 60 ? 'bg-amber-50 text-amber-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {c.priority_score.toFixed(1)}
                      </span>
                      {c.aging_boost && c.aging_boost > 0 && (
                        <span className="text-[10px] text-indigo-600 font-semibold block mt-0.5">
                          +{c.aging_boost.toFixed(1)} aging
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Badge type="status" value={c.status} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => onNavigate('management', c.id)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 underline underline-offset-2"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

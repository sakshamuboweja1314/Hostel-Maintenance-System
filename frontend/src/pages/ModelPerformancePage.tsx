import React, { useEffect, useState } from 'react';
import { 
  Cpu, 
  CheckCircle2, 
  BarChart2, 
  Layers, 
  Clock, 
  ShieldCheck, 
  HelpCircle,
  RefreshCw,
  HardDrive,
  Activity
} from 'lucide-react';
import { api } from '../services/api';
import { FullEvaluation, ModelMetricResult } from '../types';

export const ModelPerformancePage: React.FC = () => {
  const [metrics, setMetrics] = useState<FullEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'category' | 'urgency'>('category');

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getEvaluationMetrics();
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch model evaluation metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-medium">Loading test set evaluation metrics...</p>
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl my-6 text-center">
        <p className="text-red-800 font-semibold mb-2">Evaluation Metrics Unavailable</p>
        <p className="text-xs text-red-600 mb-4">{error}</p>
        <button onClick={fetchMetrics} className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-semibold">
          Retry
        </button>
      </div>
    );
  }

  const currentResult: ModelMetricResult = 
    activeTab === 'category' ? metrics.category_model : metrics.urgency_model;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Model Performance & Edge Verification
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Empirical evaluation results calculated on the held-out test split (180 samples) using Scikit-Learn.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Offline Edge Inference Verified
        </div>
      </div>

      {/* Edge Deployment Hardware Specs Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <Cpu className="w-4 h-4 text-blue-600" />
            Model Architecture
          </div>
          <p className="font-bold text-slate-900 text-sm">DistilBERT-Base</p>
          <span className="text-[11px] text-slate-400">6 Transformer layers, 768 hidden</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4 text-indigo-600" />
            Parameter Count
          </div>
          <p className="font-bold text-slate-900 text-sm">66,958,086</p>
          <span className="text-[11px] text-slate-400">40% smaller than BERT-Base</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4 text-amber-600" />
            Edge Latency
          </div>
          <p className="font-bold text-slate-900 text-sm">{currentResult.avg_inference_time_ms.toFixed(1)} ms</p>
          <span className="text-[11px] text-slate-400">Per complaint on local CPU</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <HardDrive className="w-4 h-4 text-emerald-600" />
            Storage Footprint
          </div>
          <p className="font-bold text-slate-900 text-sm">~256 MB</p>
          <span className="text-[11px] text-slate-400">Local PyTorch / Safetensors</span>
        </div>
      </div>

      {/* Model Selection Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('category')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition ${
            activeTab === 'category'
              ? 'border-blue-600 text-blue-700 bg-blue-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Model 1: Maintenance Category (6 Classes)
        </button>
        <button
          onClick={() => setActiveTab('urgency')}
          className={`py-3 px-6 text-sm font-bold border-b-2 transition ${
            activeTab === 'urgency'
              ? 'border-blue-600 text-blue-700 bg-blue-50/30'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Model 2: Complaint Urgency (4 Classes)
        </button>
      </div>

      {/* Model Test Metrics KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Test Accuracy</span>
          <p className="text-3xl font-black text-slate-900 font-mono mt-1">
            {(currentResult.accuracy * 100).toFixed(2)}%
          </p>
          <span className="text-[11px] text-emerald-600 font-semibold">180 Test Samples</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Weighted F1-Score</span>
          <p className="text-3xl font-black text-blue-600 font-mono mt-1">
            {currentResult.f1_weighted.toFixed(4)}
          </p>
          <span className="text-[11px] text-slate-400">Macro: {currentResult.f1_macro.toFixed(4)}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Precision (Weighted)</span>
          <p className="text-3xl font-black text-slate-900 font-mono mt-1">
            {(currentResult.precision_weighted * 100).toFixed(2)}%
          </p>
          <span className="text-[11px] text-slate-400">Macro: {(currentResult.precision_macro * 100).toFixed(2)}%</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recall (Weighted)</span>
          <p className="text-3xl font-black text-slate-900 font-mono mt-1">
            {(currentResult.recall_weighted * 100).toFixed(2)}%
          </p>
          <span className="text-[11px] text-slate-400">Macro: {(currentResult.recall_macro * 100).toFixed(2)}%</span>
        </div>
      </div>

      {/* Confusion Matrix and Per-Class Report Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix Table */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">
            Confusion Matrix (Actual vs Predicted)
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Rows represent True Labels, columns represent Predicted Labels on 180 test complaints.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold">
                  <th className="p-2 text-left">True \ Pred</th>
                  {currentResult.classes.map((cls, i) => (
                    <th key={i} className="p-2 truncate max-w-[70px]" title={cls}>
                      {cls.length > 8 ? cls.slice(0, 6) + '..' : cls}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentResult.confusion_matrix.map((row, rIdx) => (
                  <tr key={rIdx}>
                    <td className="p-2 text-left font-semibold text-slate-700 bg-slate-50 truncate max-w-[100px]" title={currentResult.classes[rIdx]}>
                      {currentResult.classes[rIdx]}
                    </td>
                    {row.map((val, cIdx) => (
                      <td
                        key={cIdx}
                        className={`p-2 font-mono font-bold ${
                          rIdx === cIdx
                            ? val > 0 ? 'bg-blue-100 text-blue-900' : 'bg-slate-50 text-slate-400'
                            : val > 0 ? 'bg-red-100 text-red-800' : 'text-slate-300'
                        }`}
                      >
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Per-Class Classification Report */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-1">
            Classification Report
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Per-class precision, recall, and F1-score breakdown generated via Scikit-Learn.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold">
                <tr>
                  <th className="p-2.5">Class</th>
                  <th className="p-2.5 text-right">Precision</th>
                  <th className="p-2.5 text-right">Recall</th>
                  <th className="p-2.5 text-right">F1-Score</th>
                  <th className="p-2.5 text-right">Support</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {currentResult.classes.map((cls) => {
                  const item = currentResult.classification_report[cls] || {};
                  return (
                    <tr key={cls} className="hover:bg-slate-50">
                      <td className="p-2.5 font-sans font-medium text-slate-800">{cls}</td>
                      <td className="p-2.5 text-right font-bold text-slate-700">
                        {((item.precision || 0) * 100).toFixed(1)}%
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-700">
                        {((item.recall || 0) * 100).toFixed(1)}%
                      </td>
                      <td className="p-2.5 text-right font-bold text-blue-700">
                        {(item['f1-score'] || 0).toFixed(4)}
                      </td>
                      <td className="p-2.5 text-right text-slate-500">{item.support || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

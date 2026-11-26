import React from 'react';

interface BadgeProps {
  type: 'urgency' | 'status' | 'category' | 'safety';
  value: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ type, value, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  if (type === 'urgency') {
    switch (value) {
      case 'Critical':
        return (
          <span className={`inline-flex items-center font-semibold rounded-full bg-red-100 text-red-800 border border-red-200 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 mr-1.5 bg-red-600 rounded-full animate-pulse"></span>
            Critical
          </span>
        );
      case 'High':
        return (
          <span className={`inline-flex items-center font-semibold rounded-full bg-amber-100 text-amber-800 border border-amber-200 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 mr-1.5 bg-amber-600 rounded-full"></span>
            High
          </span>
        );
      case 'Medium':
        return (
          <span className={`inline-flex items-center font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 mr-1.5 bg-yellow-600 rounded-full"></span>
            Medium
          </span>
        );
      case 'Low':
        return (
          <span className={`inline-flex items-center font-semibold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 mr-1.5 bg-emerald-600 rounded-full"></span>
            Low
          </span>
        );
      default:
        return <span className={`rounded-full bg-slate-100 text-slate-700 ${sizeClasses}`}>{value}</span>;
    }
  }

  if (type === 'status') {
    switch (value) {
      case 'Pending':
        return <span className={`inline-flex items-center font-medium rounded-full bg-slate-100 text-slate-800 border border-slate-200 ${sizeClasses}`}>Pending</span>;
      case 'In Progress':
        return <span className={`inline-flex items-center font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200 ${sizeClasses}`}>In Progress</span>;
      case 'Resolved':
        return <span className={`inline-flex items-center font-medium rounded-full bg-green-100 text-green-800 border border-green-200 ${sizeClasses}`}>Resolved</span>;
      case 'Under Review':
        return <span className={`inline-flex items-center font-medium rounded-full bg-purple-100 text-purple-800 border border-purple-200 ${sizeClasses}`}>Under Review</span>;
      default:
        return <span className={`rounded-full bg-slate-100 text-slate-700 ${sizeClasses}`}>{value}</span>;
    }
  }

  if (type === 'safety') {
    return (
      <span className={`inline-flex items-center font-semibold rounded-full bg-red-600 text-white shadow-xs ${sizeClasses}`}>
        ⚠️ SAFETY ESCALATION
      </span>
    );
  }

  // Category
  return (
    <span className={`inline-flex items-center font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-100 ${sizeClasses}`}>
      {value}
    </span>
  );
};

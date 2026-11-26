import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { SubmitPage } from './pages/SubmitPage';
import { ManagementPage } from './pages/ManagementPage';
import { StudentComplaintsPage } from './pages/StudentComplaintsPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { api } from './services/api';
import { HealthStatus } from './types';

const MainLayout: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [activeTab, setActiveTab] = useState<string>(isAdmin ? 'dashboard' : 'my-complaints');
  const [selectedComplaintId, setSelectedComplaintId] = useState<number | undefined>(undefined);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  // If user switches role or logs in, sync default tab
  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'my-complaints') setActiveTab('dashboard');
    } else {
      if (activeTab === 'dashboard' || activeTab === 'management' || activeTab === 'performance') {
        setActiveTab('my-complaints');
      }
    }
  }, [isAdmin]);

  useEffect(() => {
    api.getHealth()
      .then(setHealth)
      .catch((err) => console.warn('Backend offline or starting up:', err));
  }, []);

  if (!user) {
    return <LoginPage />;
  }

  const handleNavigate = (tab: string, complaintId?: number) => {
    setActiveTab(tab);
    if (complaintId) {
      setSelectedComplaintId(complaintId);
    }
  };

  const handleSubmissionSuccess = (complaintId: number) => {
    setSelectedComplaintId(complaintId);
    if (isAdmin) {
      setActiveTab('management');
    } else {
      setActiveTab('my-complaints');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setSelectedComplaintId(undefined);
        }}
        edgeOnline={health?.models?.loaded ?? true}
      />

      {/* Main Content Area */}
      <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'dashboard' && isAdmin && (
          <DashboardPage onNavigate={handleNavigate} />
        )}
        {activeTab === 'my-complaints' && !isAdmin && (
          <StudentComplaintsPage onNavigateSubmit={() => setActiveTab('submit')} />
        )}
        {activeTab === 'submit' && (
          <SubmitPage onSuccess={handleSubmissionSuccess} />
        )}
        {activeTab === 'management' && isAdmin && (
          <ManagementPage initialComplaintId={selectedComplaintId} />
        )}
        {activeTab === 'performance' && isAdmin && (
          <ModelPerformancePage />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-700">
              Edge-Based Hostel Maintenance Complaint Prioritization System
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Natural Language Processing with Large Language Models (NLP with LM) • Dynamic Timeline Aging
            </p>
          </div>
          <div className="flex items-center gap-4 text-slate-600">
            <span>Unit III: Transformer Encoders</span>
            <span>•</span>
            <span>Unit IV: LLM Fine-Tuning</span>
            <span>•</span>
            <span className="font-mono text-emerald-600 font-bold">100% Local Inference</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
};

export default App;

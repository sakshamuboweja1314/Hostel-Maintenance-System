import React from 'react';
import { 
  Building2, 
  LayoutDashboard, 
  PlusCircle, 
  ListFilter, 
  Cpu, 
  ShieldCheck,
  HardDrive,
  LogOut,
  GraduationCap,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  edgeOnline: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { user, switchRole } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Dynamic Navigation items based on role
  const navItems = isAdmin ? [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'management', label: 'Complaint Queue', icon: ListFilter },
    { id: 'submit', label: 'Submit Complaint', icon: PlusCircle },
    { id: 'performance', label: 'Model Evaluation', icon: Cpu },
  ] : [
    { id: 'my-complaints', label: 'My Complaints & Timeline', icon: Clock },
    { id: 'submit', label: 'Submit Complaint', icon: PlusCircle },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-2">
          {/* Logo & Project Title */}
          <div 
            className="flex items-center space-x-3 cursor-pointer shrink-0" 
            onClick={() => setActiveTab(isAdmin ? 'dashboard' : 'my-complaints')}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-1.5 sm:gap-2">
                Hostel Prioritization Engine
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  isAdmin 
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  {isAdmin ? 'Admin Portal' : 'Student Portal'}
                </span>
              </span>
              <p className="text-[11px] text-slate-500 hidden sm:block">NLP with Large Language Models (Unit III & IV)</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-2.5 lg:px-3 py-2 rounded-lg text-xs lg:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-500'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User Profile & Switch Role */}
          <div className="flex items-center space-x-2 shrink-0">
            {user && (
              <div className="flex items-center gap-2">
                <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold ${
                  isAdmin 
                    ? 'bg-indigo-50/70 text-indigo-800 border-indigo-200' 
                    : 'bg-blue-50/70 text-blue-800 border-blue-200'
                }`}>
                  {isAdmin ? (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Chief Warden (Admin)</span>
                    </>
                  ) : (
                    <>
                      <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                      <span>{user.name} ({user.roomNumber})</span>
                    </>
                  )}
                </div>

                <button
                  onClick={switchRole}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
                  title="Switch Role or Log Out"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Switch Role</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex overflow-x-auto py-2 space-x-1 border-t border-slate-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap cursor-pointer ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-600 bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

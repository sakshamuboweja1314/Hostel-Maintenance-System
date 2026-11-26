import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loginAsStudent: (name: string, roomNumber: string, hostelBlock: string) => void;
  loginAsAdmin: (username: string) => boolean;
  logout: () => void;
  switchRole: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('hostel_nlp_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('hostel_nlp_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('hostel_nlp_user');
    }
  }, [user]);

  const loginAsStudent = (name: string, roomNumber: string, hostelBlock: string) => {
    const studentUser: User = {
      id: `stu_${Date.now()}`,
      name: name.trim() || 'Resident Student',
      role: 'student',
      roomNumber: roomNumber.trim() || 'Room 101',
      hostelBlock: hostelBlock.trim() || 'Block A'
    };
    setUser(studentUser);
  };

  const loginAsAdmin = (username: string) => {
    const adminUser: User = {
      id: 'admin_root',
      name: username.trim() || 'Chief Hostel Warden',
      role: 'admin',
      email: 'warden@hostel.edu'
    };
    setUser(adminUser);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  const switchRole = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loginAsStudent, loginAsAdmin, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

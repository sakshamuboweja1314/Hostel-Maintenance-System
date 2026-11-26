import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { Navbar } from '../components/Navbar';
import { AuthProvider } from '../context/AuthContext';

describe('Navbar Component', () => {
  it('renders application brand title and Edge AI badges', () => {
    const setActiveTab = vi.fn();
    render(
      <AuthProvider>
        <Navbar activeTab="dashboard" setActiveTab={setActiveTab} edgeOnline={true} />
      </AuthProvider>
    );
    expect(screen.getByText(/Hostel Prioritization Engine/i)).toBeInTheDocument();
  });

  it('handles tab switches when navigation items are clicked', () => {
    const setActiveTab = vi.fn();
    render(
      <AuthProvider>
        <Navbar activeTab="dashboard" setActiveTab={setActiveTab} edgeOnline={true} />
      </AuthProvider>
    );
    const submitBtn = screen.getAllByText(/Submit Complaint/i)[0];
    fireEvent.click(submitBtn);
    expect(setActiveTab).toHaveBeenCalledWith('submit');
  });
});

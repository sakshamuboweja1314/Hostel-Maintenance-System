import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Badge } from '../components/Badge';

describe('Badge Component', () => {
  it('renders Critical urgency badge with pulsing indicator', () => {
    render(<Badge type="urgency" value="Critical" />);
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('renders High urgency badge correctly', () => {
    render(<Badge type="urgency" value="High" />);
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  it('renders category badge correctly', () => {
    render(<Badge type="category" value="Water and Plumbing" />);
    expect(screen.getByText('Water and Plumbing')).toBeInTheDocument();
  });

  it('renders status badge correctly', () => {
    render(<Badge type="status" value="Resolved" />);
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  it('renders safety escalation badge correctly', () => {
    render(<Badge type="safety" value="Safety Escalated" />);
    expect(screen.getByText(/SAFETY ESCALATION/i)).toBeInTheDocument();
  });
});

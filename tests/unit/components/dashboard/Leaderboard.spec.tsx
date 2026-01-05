import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Leaderboard } from '@/components/dashboard/Leaderboard';

jest.mock('lucide-react', () => ({
  Medal: () => <span data-testid="medal-icon">Medal</span>,
  TrendingUp: () => <span data-testid="up-icon">Up</span>,
  ArrowUp: () => <span data-testid="arrow-icon">Arrow</span>,
  EyeOff: () => <span data-testid="eye-off-icon">EyeOff</span>,
}));

describe('Leaderboard', () => {
  it('shows empty state when no brands', () => {
    render(<Leaderboard brands={[]} />);
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });
});

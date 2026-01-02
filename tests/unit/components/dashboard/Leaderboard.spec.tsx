import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Leaderboard } from '@/components/dashboard/Leaderboard';
import type { BrandResult } from '@/types/analysis';

jest.mock('lucide-react', () => ({
  Medal: () => <span data-testid="medal-icon">Medal</span>,
  TrendingUp: () => <span data-testid="up-icon">Up</span>,
  ArrowUp: () => <span data-testid="arrow-icon">Arrow</span>,
  EyeOff: () => <span data-testid="eye-off-icon">EyeOff</span>,
}));

describe('Leaderboard', () => {
  const brands: BrandResult[] = [
    {
      name: 'First',
      promptCoverage: 80,
      mentionShare: 40,
      mentionsPerPrompt: 2,
      firstMentionRate: 50,
      missedPrompts: 1,
      mentions: 16,
      promptsWithBrand: 8,
      firstMentions: 4,
      visibility: 80,
      citationShare: 40,
      contexts: ['Context'],
    },
    {
      name: 'Second',
      promptCoverage: 40,
      mentionShare: 30,
      mentionsPerPrompt: 1,
      firstMentionRate: 20,
      missedPrompts: 6,
      mentions: 12,
      promptsWithBrand: 4,
      firstMentions: 1,
      visibility: 40,
      citationShare: 30,
      contexts: [],
    },
  ];

  it('lists brand rankings', () => {
    render(<Leaderboard brands={brands} totalPrompts={10} />);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('shows empty state when no brands', () => {
    render(<Leaderboard brands={[]} totalPrompts={0} />);
    expect(screen.getByText(/no data available/i)).toBeInTheDocument();
  });
});

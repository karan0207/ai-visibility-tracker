import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MetricsPanel } from '@/components/dashboard/MetricsPanel';
import type { BrandResult } from '@/types/analysis';

jest.mock('lucide-react', () => ({
  BarChart3: () => <span data-testid="chart-icon">Chart</span>,
  Target: () => <span data-testid="target-icon">Target</span>,
  Zap: () => <span data-testid="zap-icon">Zap</span>,
  Crown: () => <span data-testid="crown-icon">Crown</span>,
  Eye: () => <span data-testid="eye-icon">Eye</span>,
  EyeOff: () => <span data-testid="eyeoff-icon">EyeOff</span>,
  AlertCircle: () => <span data-testid="alert-icon">Alert</span>,
}));

describe('MetricsPanel', () => {
  const brands: BrandResult[] = [
    {
      name: 'Top',
      promptCoverage: 80,
      mentionShare: 50,
      mentionsPerPrompt: 2,
      firstMentionRate: 60,
      missedPrompts: 2,
      mentions: 20,
      promptsWithBrand: 8,
      firstMentions: 5,
      visibility: 80,
      citationShare: 50,
      contexts: [],
    },
  ];

  it('shows metrics summary', () => {
    render(<MetricsPanel totalPrompts={10} totalMentions={20} brands={brands} />);
    expect(screen.getByText('Prompts Analyzed')).toBeInTheDocument();
    expect(screen.getByText('Total Mentions')).toBeInTheDocument();
    expect(screen.getByText('Leading Brand')).toBeInTheDocument();
  });

  it('handles empty brands', () => {
    render(<MetricsPanel totalPrompts={0} totalMentions={0} brands={[]} />);
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });
});


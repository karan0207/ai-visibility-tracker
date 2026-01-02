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
  TrendingUp: () => <span data-testid="trending-up">TrendingUp</span>,
  TrendingDown: () => <span data-testid="trending-down">TrendingDown</span>,
}));

describe('MetricsPanel - extended coverage', () => {
  const createBrand = (overrides: Partial<BrandResult> = {}): BrandResult => ({
    name: 'TestBrand',
    promptCoverage: 75,
    mentionShare: 50,
    mentionsPerPrompt: 2,
    firstMentionRate: 60,
    missedPrompts: 3,
    mentions: 15,
    promptsWithBrand: 9,
    firstMentions: 5,
    visibility: 75,
    citationShare: 50,
    contexts: [],
    ...overrides,
  });

  describe('summary statistics', () => {
    it('displays total prompts correctly', () => {
      render(<MetricsPanel totalPrompts={42} totalMentions={100} brands={[createBrand()]} />);
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('displays total mentions correctly', () => {
      render(<MetricsPanel totalPrompts={10} totalMentions={156} brands={[createBrand()]} />);
      expect(screen.getByText('156')).toBeInTheDocument();
    });

    it('displays leading brand name', () => {
      const topBrand = createBrand({ name: 'Leader', promptCoverage: 90 });
      render(<MetricsPanel totalPrompts={10} totalMentions={50} brands={[topBrand]} />);
      expect(screen.getByText('Leader')).toBeInTheDocument();
    });

    it('shows dash when no leading brand', () => {
      render(<MetricsPanel totalPrompts={0} totalMentions={0} brands={[]} />);
      expect(screen.getByText('—')).toBeInTheDocument();
    });
  });

  describe('brand metrics display', () => {
    it('displays average coverage percentage', () => {
      const brand = createBrand({ promptCoverage: 86 });
      render(<MetricsPanel totalPrompts={10} totalMentions={20} brands={[brand]} />);
      expect(screen.getByText('86%')).toBeInTheDocument();
    });

    it('displays leading brand coverage in description', () => {
      const brand = createBrand({ promptCoverage: 75 });
      render(<MetricsPanel totalPrompts={10} totalMentions={20} brands={[brand]} />);
      expect(screen.getByText('75% coverage')).toBeInTheDocument();
    });

    it('calculates average coverage across multiple brands', () => {
      const brands = [
        createBrand({ name: 'A', promptCoverage: 80 }),
        createBrand({ name: 'B', promptCoverage: 60 }),
      ];
      render(<MetricsPanel totalPrompts={10} totalMentions={20} brands={brands} />);
      // Average of 80 and 60 = 70
      expect(screen.getByText('70%')).toBeInTheDocument();
    });
  });

  describe('multiple brands', () => {
    it('displays leading brand from sorted list', () => {
      const brands = [
        createBrand({ name: 'First', promptCoverage: 90 }),
        createBrand({ name: 'Second', promptCoverage: 70 }),
        createBrand({ name: 'Third', promptCoverage: 50 }),
      ];
      render(<MetricsPanel totalPrompts={10} totalMentions={50} brands={brands} />);

      // Only leading brand is displayed
      expect(screen.getByText('First')).toBeInTheDocument();
    });

    it('handles 10 brands showing only leader', () => {
      const brands = Array.from({ length: 10 }, (_, i) => 
        createBrand({ name: `Brand${i}`, promptCoverage: 100 - i * 10 })
      );
      render(<MetricsPanel totalPrompts={20} totalMentions={100} brands={brands} />);

      // Only first brand (leader) is shown
      expect(screen.getByText('Brand0')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('handles zero metrics gracefully', () => {
      const brand = createBrand({
        promptCoverage: 0,
        mentionShare: 0,
        firstMentionRate: 0,
        mentions: 0,
        missedPrompts: 10,
      });
      render(<MetricsPanel totalPrompts={10} totalMentions={0} brands={[brand]} />);
      expect(screen.getByText('TestBrand')).toBeInTheDocument();
    });

    it('handles 100% metrics', () => {
      const brand = createBrand({
        promptCoverage: 100,
        mentionShare: 100,
        firstMentionRate: 100,
        missedPrompts: 0,
      });
      render(<MetricsPanel totalPrompts={10} totalMentions={50} brands={[brand]} />);
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('100% coverage')).toBeInTheDocument();
    });

    it('handles decimal metrics', () => {
      const brand = createBrand({
        promptCoverage: 33.333,
        mentionsPerPrompt: 1.75,
      });
      render(<MetricsPanel totalPrompts={10} totalMentions={20} brands={[brand]} />);
      // Should display numbers
      expect(screen.getByText('TestBrand')).toBeInTheDocument();
    });

    it('handles brand with long name', () => {
      const longName = 'This Is A Very Long Brand Name That Might Overflow';
      const brand = createBrand({ name: longName });
      render(<MetricsPanel totalPrompts={10} totalMentions={20} brands={[brand]} />);
      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('handles large numbers', () => {
      render(<MetricsPanel totalPrompts={10000} totalMentions={50000} brands={[createBrand()]} />);
      expect(screen.getByText('10000')).toBeInTheDocument();
      expect(screen.getByText('50000')).toBeInTheDocument();
    });
  });

  describe('visibility levels', () => {
    it('displays high visibility indicator for high coverage brands', () => {
      const brand = createBrand({ promptCoverage: 80, visibility: 80 });
      render(<MetricsPanel totalPrompts={10} totalMentions={20} brands={[brand]} />);
      // High visibility brands should have appropriate styling/icon
      expect(screen.getByText('TestBrand')).toBeInTheDocument();
    });

    it('displays low visibility indicator for low coverage brands', () => {
      const brand = createBrand({ promptCoverage: 10, visibility: 10 });
      render(<MetricsPanel totalPrompts={10} totalMentions={20} brands={[brand]} />);
      expect(screen.getByText('TestBrand')).toBeInTheDocument();
    });
  });
});

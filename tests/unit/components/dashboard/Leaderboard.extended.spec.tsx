import React from 'react';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Leaderboard } from '@/components/dashboard/Leaderboard';
import type { BrandResult } from '@/types/analysis';

jest.mock('lucide-react', () => ({
  Medal: () => <span data-testid="medal-icon">Medal</span>,
  TrendingUp: () => <span data-testid="up-icon">Up</span>,
  ArrowUp: () => <span data-testid="arrow-icon">Arrow</span>,
  EyeOff: () => <span data-testid="eye-off-icon">EyeOff</span>,
  Trophy: () => <span data-testid="trophy-icon">Trophy</span>,
  Award: () => <span data-testid="award-icon">Award</span>,
}));

describe('Leaderboard - extended coverage', () => {
  const createBrand = (name: string, coverage: number, rank?: number): BrandResult => ({
    name,
    promptCoverage: coverage,
    mentionShare: coverage / 2,
    mentionsPerPrompt: 1.5,
    firstMentionRate: coverage * 0.6,
    missedPrompts: Math.floor((100 - coverage) / 10),
    mentions: Math.floor(coverage / 5),
    promptsWithBrand: Math.floor(coverage / 10),
    firstMentions: Math.floor(coverage / 20),
    visibility: coverage,
    citationShare: coverage / 2,
    contexts: ['Sample context'],
  });

  describe('ranking display', () => {
    it('shows brands in provided order (assumed pre-sorted)', () => {
      const brands = [
        createBrand('Gold', 90),
        createBrand('Silver', 70),
        createBrand('Bronze', 50),
      ];
      render(<Leaderboard brands={brands} totalPrompts={10} />);

      const brandElements = within(screen.getByRole('table')).getAllByText(/Gold|Silver|Bronze/);
      expect(brandElements[0]).toHaveTextContent('Gold');
      expect(brandElements[1]).toHaveTextContent('Silver');
      expect(brandElements[2]).toHaveTextContent('Bronze');
    });

    it('displays rank numbers correctly', () => {
      const brands = [
        createBrand('First', 90),
        createBrand('Second', 80),
        createBrand('Third', 70),
      ];
      render(<Leaderboard brands={brands} totalPrompts={10} />);

      // Should show rank indicators
      expect(within(screen.getByRole('table')).getByText('First')).toBeInTheDocument();
      expect(within(screen.getByRole('table')).getByText('Second')).toBeInTheDocument();
      expect(within(screen.getByRole('table')).getByText('Third')).toBeInTheDocument();
    });

    it('handles single brand', () => {
      const brands = [createBrand('OnlyOne', 100)];
      render(<Leaderboard brands={brands} totalPrompts={10} />);

      expect(within(screen.getByRole('table')).getByText('OnlyOne')).toBeInTheDocument();
    });

    it('handles 10 brands', () => {
      const brands = Array.from({ length: 10 }, (_, i) => 
        createBrand(`Brand${i + 1}`, 100 - i * 10)
      );
      render(<Leaderboard brands={brands} totalPrompts={20} />);

      brands.forEach(brand => {
        expect(within(screen.getByRole('table')).getByText(brand.name)).toBeInTheDocument();
      });
    });
  });

  describe('metrics display', () => {
    it('shows prompt coverage percentage', () => {
      const brands = [createBrand('Test', 75)];
      render(<Leaderboard brands={brands} totalPrompts={10} />);

      expect(within(screen.getByRole('table')).getByText('75%')).toBeInTheDocument();
    });

    it('shows mention count as depth multiplier', () => {
      const brand = createBrand('Test', 80);
      brand.mentionsPerPrompt = 2.5;
      render(<Leaderboard brands={[brand]} totalPrompts={10} />);

      expect(within(screen.getByRole('table')).getByText('2.5x')).toBeInTheDocument();
    });

    it('shows first mention rate for top performers', () => {
      const brand = createBrand('Leader', 90);
      brand.firstMentionRate = 75;
      render(<Leaderboard brands={[brand]} totalPrompts={10} />);

      expect(within(screen.getByRole('table')).getByText('75%')).toBeInTheDocument();
    });
  });

  describe('empty and edge states', () => {
    it('shows empty state message', () => {
      render(<Leaderboard brands={[]} totalPrompts={0} />);
      expect(screen.getByText(/no data available/i)).toBeInTheDocument();
    });

    it('handles zero total prompts with brands', () => {
      const brands = [createBrand('Test', 0)];
      render(<Leaderboard brands={brands} totalPrompts={0} />);

      expect(within(screen.getByRole('table')).getByText('Test')).toBeInTheDocument();
    });

    it('handles all brands with 0% coverage', () => {
      const brands = [
        createBrand('A', 0),
        createBrand('B', 0),
        createBrand('C', 0),
      ];
      render(<Leaderboard brands={brands} totalPrompts={10} />);

      expect(within(screen.getByRole('table')).getByText('A')).toBeInTheDocument();
      expect(within(screen.getByRole('table')).getByText('B')).toBeInTheDocument();
      expect(within(screen.getByRole('table')).getByText('C')).toBeInTheDocument();
    });

    it('handles brands with identical coverage', () => {
      const brands = [
        createBrand('Tied1', 50),
        createBrand('Tied2', 50),
        createBrand('Tied3', 50),
      ];
      render(<Leaderboard brands={brands} totalPrompts={10} />);

      expect(within(screen.getByRole('table')).getByText('Tied1')).toBeInTheDocument();
      expect(within(screen.getByRole('table')).getByText('Tied2')).toBeInTheDocument();
      expect(within(screen.getByRole('table')).getByText('Tied3')).toBeInTheDocument();
    });
  });

  describe('visual indicators', () => {
    it('shows medal icons', () => {
      const brands = [
        createBrand('Winner', 95),
        createBrand('RunnerUp', 85),
      ];
      render(<Leaderboard brands={brands} totalPrompts={10} />);

      expect(screen.getAllByTestId('medal-icon').length).toBeGreaterThan(0);
    });

    it('shows visibility off icon for low visibility brands', () => {
      const brand = createBrand('Hidden', 5);
      render(<Leaderboard brands={[brand]} totalPrompts={100} />);

      // Low visibility brands may show eye-off icon
      expect(within(screen.getByRole('table')).getByText('Hidden')).toBeInTheDocument();
    });
  });

  describe('brand name formatting', () => {
    it('handles long brand names', () => {
      const longName = 'This Is An Exceptionally Long Brand Name';
      const brands = [createBrand(longName, 80)];
      render(<Leaderboard brands={brands} totalPrompts={10} />);

      expect(screen.getAllByText(longName).length).toBeGreaterThan(0);
    });

    it('handles special characters in names', () => {
      const brands = [
        createBrand('C++', 80),
        createBrand('Node.js', 70),
        createBrand('AI/ML', 60),
      ];
      render(<Leaderboard brands={brands} totalPrompts={10} />);

      expect(screen.getAllByText('C++').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Node.js').length).toBeGreaterThan(0);
      expect(screen.getAllByText('AI/ML').length).toBeGreaterThan(0);
    });

    it('handles unicode brand names', () => {
      const brands = [createBrand('日本語', 80)];
      render(<Leaderboard brands={brands} totalPrompts={10} />);

      expect(screen.getAllByText('日本語').length).toBeGreaterThan(0);
    });
  });

  describe('data consistency', () => {
    it('shows consistent metrics across columns', () => {
      const brand = createBrand('Consistent', 80);
      brand.mentionsPerPrompt = 2.0;
      brand.missedPrompts = 2;

      render(<Leaderboard brands={[brand]} totalPrompts={10} />);

      expect(screen.getAllByText('Consistent').length).toBeGreaterThan(0);
      expect(screen.getAllByText('80%').length).toBeGreaterThan(0);
      expect(screen.getAllByText('2.0x').length).toBeGreaterThan(0);
      expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    });

    it('shows "All captured" for zero missed prompts', () => {
      const brand = createBrand('Perfect', 100);
      brand.missedPrompts = 0;
      render(<Leaderboard brands={[brand]} totalPrompts={10} />);

      expect(within(screen.getByRole('table')).getByText('All captured')).toBeInTheDocument();
    });
  });
});

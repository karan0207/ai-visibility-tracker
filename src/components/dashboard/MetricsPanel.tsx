'use client';

import { Badge } from '@/components/ui/badge';
import { BarChart3, Zap, Crown, Eye, AlertCircle } from 'lucide-react';
import type { BrandResult, ConfidenceLevel } from '@/types/analysis';

interface MetricsPanelProps {
  totalPrompts: number;
  totalMentions: number;
  brands: BrandResult[];
  confidenceLevel?: ConfidenceLevel;
}

function ConfidenceBadge({ level }: { level: ConfidenceLevel }) {
  const config = {
    low: { 
      label: 'Low confidence', 
      description: 'Exploratory (<5 prompts)',
      className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
    },
    directional: { 
      label: 'Directional', 
      description: '5-29 prompts',
      className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
    },
    high: { 
      label: 'High confidence', 
      description: '≥30 prompts',
      className: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
    },
  };

  const { label, description, className } = config[level];

  return (
    <Badge variant="outline" className={`${className} font-medium rounded-md`} title={description}>
      <AlertCircle className="h-3 w-3 mr-1.5 text-slate-500" />
      {label}
    </Badge>
  );
}

export function MetricsPanel({ totalPrompts, totalMentions, brands, confidenceLevel = 'low' }: MetricsPanelProps) {
  // Calculate average prompt coverage across all brands
  const avgPromptCoverage = brands.length > 0 
    ? brands.reduce((sum, b) => sum + b.promptCoverage, 0) / brands.length 
    : 0;

  // Compute a weighted score for each brand: prioritize prompt coverage, then mention share, then mentions per prompt
  const getBrandScore = (b: BrandResult) =>
    b.promptCoverage * 10000 + b.mentionShare * 100 + b.mentionsPerPrompt;

  // Find the brand(s) with the highest score
  let maxScore = -Infinity;
  let leaders: BrandResult[] = [];
  for (const b of brands) {
    const score = getBrandScore(b);
    if (score > maxScore) {
      maxScore = score;
      leaders = [b];
    } else if (score === maxScore) {
      leaders.push(b);
    }
  }

  const leadingBrandDisplay = leaders.length > 1
    ? `${leaders.map(b => b.name).join(', ')} (tied)`
    : leaders[0]?.name || '—';
  const topBrand = leaders[0];

  const metrics = [
    {
      title: 'Prompts Analyzed',
      value: totalPrompts.toString(),
      icon: BarChart3,
      description: confidenceLevel === 'low' ? 'Need more data' : 'AI queries tested',
    },
    {
      title: 'Avg. Coverage',
      value: `${avgPromptCoverage.toFixed(0)}%`,
      icon: Eye,
      description: 'Prompt Coverage across brands',
    },
    {
      title: 'Total Mentions',
      value: totalMentions.toString(),
      icon: Zap,
      description: 'Brand references found',
    },
    {
      title: 'Leading Brand',
      value: leadingBrandDisplay,
      icon: Crown,
      description: topBrand ? `${topBrand.promptCoverage}% coverage` : 'No data yet',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Confidence indicator */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
          Analysis Overview
        </h2>
        <ConfidenceBadge level={confidenceLevel} />
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <div 
            key={metric.title} 
            className="relative overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {metric.title}
                </p>
                <metric.icon className="h-4 w-4 text-slate-400 dark:text-slate-500" strokeWidth={2} />
              </div>
              
              <div className="space-y-1">
                <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
                  {metric.value}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {metric.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

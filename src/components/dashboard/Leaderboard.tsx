'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Medal, TrendingUp, ArrowUp, EyeOff } from 'lucide-react';
import type { BrandResult } from '@/types/analysis';
import { VISIBILITY_THRESHOLDS } from '@/lib/constants';

interface LeaderboardProps {
  brands: BrandResult[];
  totalPrompts: number;
}

function getRankDisplay(index: number) {
  if (index === 0) {
    return (
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
        <span className="text-xs font-bold">1</span>
      </div>
    );
  }
  if (index === 1) {
    return (
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
        <span className="text-xs font-bold">2</span>
      </div>
    );
  }
  if (index === 2) {
    return (
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
        <span className="text-xs font-bold">3</span>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-50 text-slate-500 border border-slate-200">
      <span className="text-xs font-medium">{index + 1}</span>
    </div>
  );
}

function getVisibilityBar(visibility: number, colorClass: string) {
  // Map gradient classes to solid colors for pro look
  const bgClass = colorClass.includes('emerald') ? 'bg-emerald-500' : 'bg-blue-500';
  
  return (
    <div className="flex items-center gap-3 w-full max-w-[140px]">
      <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div 
          className={`h-full ${bgClass} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${Math.min(visibility, 100)}%` }}
        />
      </div>
      <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-10 text-right tabular-nums">
        {visibility.toFixed(0)}%
      </span>
    </div>
  );
}

export function Leaderboard({ brands, totalPrompts }: LeaderboardProps) {
  if (brands.length === 0) {
    return (
      <Card className="border border-slate-200 shadow-sm bg-white dark:bg-slate-900 rounded-xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Medal className="h-5 w-5 text-slate-500" />
            Brand Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-800/50 mb-4">
              <TrendingUp className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-base text-slate-600 dark:text-slate-400 font-medium">No data available</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Run an analysis to see brand rankings</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 shadow-sm bg-white dark:bg-slate-900 rounded-xl overflow-hidden">
      <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 py-4 px-2 sm:px-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Medal className="h-5 w-5 text-slate-500" />
            <div>
              <h3 className="text-slate-900 dark:text-slate-100">Brand Leaderboard</h3>
            </div>
          </CardTitle>
          <Badge variant="outline" className="bg-white dark:bg-slate-800 text-slate-500 font-normal border-slate-200 text-xs whitespace-nowrap">
            Sorted by Prompt Coverage
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100 dark:border-slate-800 hover:bg-transparent bg-slate-50/50 dark:bg-slate-900/50">
                <TableHead className="w-16 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 pl-4 sm:pl-6 py-4">Rank</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 px-3 py-4">Brand</TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 px-3 py-4">
                  <span title="% of prompts where brand mentioned (PRIMARY)">Prompt Coverage</span>
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 px-3 py-4">
                  <span title="% of total mentions across all brands">Mention Share</span>
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center px-3 py-4">
                  <span title="Avg mentions per prompt where brand appears">Depth</span>
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center px-3 py-4">
                  <span title="% of appearances where mentioned first">1st Rate</span>
                </TableHead>
                <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 pr-4 sm:pr-6 py-4">
                  <span title="Prompts where brand was NOT mentioned">Missed</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((brand, index) => (
                <TableRow 
                  key={brand.name} 
                  className="border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <TableCell className="pl-4 sm:pl-6 py-4">
                    {getRankDisplay(index)}
                  </TableCell>
                  <TableCell className="px-3 py-4">
                    <span className="font-medium text-sm text-slate-900 dark:text-slate-200">
                      {brand.name}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-4">
                    {getVisibilityBar(brand.promptCoverage, 'bg-emerald-500')}
                  </TableCell>
                  <TableCell className="px-3 py-4">
                    {getVisibilityBar(brand.mentionShare, 'bg-blue-500')}
                  </TableCell>
                  <TableCell className="text-center px-3 py-4">
                    <span className="text-sm text-slate-600 dark:text-slate-400 tabular-nums">
                      {brand.mentionsPerPrompt.toFixed(1)}x
                    </span>
                  </TableCell>
                  <TableCell className="text-center px-3 py-4">
                    <span className={`text-sm tabular-nums ${
                      brand.firstMentionRate > 50 
                        ? 'text-amber-600 font-medium' 
                        : 'text-slate-600'
                    }`}>
                      {brand.firstMentionRate.toFixed(0)}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right pr-4 sm:pr-6 py-4">
                    {brand.missedPrompts > 0 ? (
                      <span className="text-sm text-slate-500 tabular-nums">
                        {brand.missedPrompts}
                      </span>
                    ) : (
                      <span className="text-emerald-600 text-xs font-medium">
                        All captured
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
          {brands.map((brand, index) => (
            <div key={brand.name} className="p-4 space-y-4">
              {/* Header with rank and name */}
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {getRankDisplay(index)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    {brand.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {brand.mentions} total mentions
                  </p>
                </div>
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                {/* Prompt Coverage */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase mb-2">Coverage</p>
                  <div className="space-y-2">
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {brand.promptCoverage.toFixed(0)}%
                    </p>
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(brand.promptCoverage, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Mention Share */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase mb-2">Share</p>
                  <div className="space-y-2">
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {brand.mentionShare.toFixed(0)}%
                    </p>
                    <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(brand.mentionShare, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Depth (mentions per prompt) */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase mb-2">Depth</p>
                  <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                    {brand.mentionsPerPrompt.toFixed(1)}x
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">per prompt</p>
                </div>

                {/* First Mention Rate */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase mb-2">1st Rate</p>
                  <p className={`text-lg font-bold ${
                    brand.firstMentionRate > 50
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}>
                    {brand.firstMentionRate.toFixed(0)}%
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">mentioned first</p>
                </div>
              </div>

              {/* Missed Prompts */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Not Mentioned</p>
                  {brand.missedPrompts > 0 ? (
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {brand.missedPrompts} time{brand.missedPrompts !== 1 ? 's' : ''}
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      ✓ All captured
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

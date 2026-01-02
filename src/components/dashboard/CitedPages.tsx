'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, ExternalLink, Link2 } from 'lucide-react';
import type { CitationResult } from '@/types/analysis';

interface CitedPagesProps {
  citations: CitationResult[];
}

export function CitedPages({ citations }: CitedPagesProps) {
  if (citations.length === 0) {
    return (
      <Card className="border border-slate-200 shadow-sm bg-white dark:bg-slate-900 rounded-xl overflow-hidden h-full">
        <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Globe className="h-5 w-5 text-slate-500" />
            Top Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 rounded-full bg-slate-50 dark:bg-slate-800/50 mb-4">
              <Link2 className="h-8 w-8 text-slate-300" />
            </div>
            <p className="text-base text-slate-600 dark:text-slate-400 font-medium">No citations found</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">AI responses didn&apos;t include URLs</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-slate-200 shadow-sm bg-white dark:bg-slate-900 rounded-xl overflow-hidden h-full flex flex-col">
      <CardHeader className="pb-0 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 py-4 px-2 sm:px-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Globe className="h-5 w-5 text-slate-500" />
            <div>
              <h3 className="text-slate-900 dark:text-slate-100">Top Sources</h3>
            </div>
          </CardTitle>
          <Badge variant="outline" className="bg-white dark:bg-slate-800 text-slate-500 font-normal border-slate-200 rounded-md text-xs whitespace-nowrap">
            {citations.length} Sources
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-y-auto max-h-[600px] custom-scrollbar">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {citations.slice(0, 10).map((citation, index) => (
            <a
              key={citation.url}
              href={citation.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 lg:gap-4 p-3 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200"
            >
              {/* Rank */}
              <div className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center border ${
                index < 3 
                  ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400' 
                  : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
              }`}>
                <span className="text-xs font-bold">
                  {index + 1}
                </span>
              </div>
              
              {/* URL Info */}
              <div className="flex-1 min-w-0 w-full">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                    {citation.domain}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors">
                  {citation.url}
                </p>
              </div>
              
              {/* Count & External Icon */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                <div className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/30 transition-colors flex-1 sm:flex-none text-center min-w-max">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                    {citation.count} citations
                  </span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-400 transition-colors flex-shrink-0" />
              </div>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

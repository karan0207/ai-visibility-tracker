'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';
import type { AnalysisProgress } from '@/types/analysis';

interface LoadingStateProps {
  progress: AnalysisProgress;
}

export function LoadingState({ progress }: LoadingStateProps) {
  const percentage = (progress.currentPrompt / progress.totalPrompts) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            <div className="flex-1">
              <p className="font-medium">
                Analyzing prompt {progress.currentPrompt} of {progress.totalPrompts}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {progress.currentPromptText}
              </p>
            </div>
          </div>
          <Progress value={percentage} className="h-2" />
        </CardContent>
      </Card>

      {/* Skeleton Dashboard */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Skeleton Table */}
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16 ml-auto" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

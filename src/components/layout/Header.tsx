'use client';

import { Sparkles, Github, BarChart3 } from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function Header() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between relative">
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity">
          <div className="p-1 sm:p-1.5 bg-gradient-brand rounded-lg shadow-sm">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-white" strokeWidth={2} />
          </div>
          <span className="font-bold text-base sm:text-lg tracking-tight text-white">
            {APP_CONFIG.name}
          </span>
        </Link>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/dashboard" className="inline-block">
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1.5 sm:gap-2 h-9 sm:h-10 text-xs sm:text-sm border-slate-700 bg-slate-900/50 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
              type="button"
            >
              <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

'use client';

import { BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Header() {

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center hover:opacity-80 transition-opacity self-center">
          <div className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              {/* A - Left letter */}
              <path d="M4 32 L8 22 L12 32" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M5.5 28 L10.5 28" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              
              {/* V - Center letter (made more prominent) */}
              <path d="M14 22 L20 34 L26 22" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              
              {/* T - Right letter */}
              <path d="M28 22 L36 22" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              <path d="M32 22 L32 32" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
              
              {/* Glow effect for V */}
              <path d="M14 22 L20 34 L26 22" stroke="rgba(255,255,255,0.3)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.5"/>
              
              {/* Decorative accent dots */}
              <circle cx="8" cy="20" r="1.5" fill="white" opacity="0.6"/>
              <circle cx="20" cy="19" r="1.5" fill="white" opacity="0.8"/>
              <circle cx="32" cy="20" r="1.5" fill="white" opacity="0.6"/>
            </svg>
          </div>
        </Link>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <Link href="/dashboard" className="inline-block">
            <Badge 
              variant="secondary" 
              className="bg-black text-white border border-white/20 shadow-sm"
            >
              Welcome
            </Badge>
          </Link>
        </div>
      </div>
    </header>
  );
}

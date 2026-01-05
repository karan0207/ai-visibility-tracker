'use client';

import { ChevronRight } from 'lucide-react';

// ============== COLORFUL SPARKLE ICON ==============
const ColorfulSparkle = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-8 sm:h-8" fill="none">
    <path d="M12 2L14 10L22 12L14 14L12 22L10 14L2 12L10 10L12 2Z" fill="url(#sparkle-gradient)" />
    <defs>
      <linearGradient id="sparkle-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#3B82F6" />
        <stop offset="33%" stopColor="#10B981" />
        <stop offset="66%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#EF4444" />
      </linearGradient>
    </defs>
  </svg>
);

// ============== HERO SECTION COMPONENT ==============
interface HeroSectionProps {
  onStartTrial?: () => void;
  onBookDemo?: () => void;
}

export function HeroSection({ onStartTrial, onBookDemo }: HeroSectionProps) {
  return (
    <section className="relative sm:min-h-screen flex items-start sm:items-center justify-center overflow-hidden pt-8 sm:pt-0">
      
      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-20 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-3 sm:mb-8">
          <span className="block sm:inline">Track & Boost Your Brand&apos;s</span>
          <span className="block sm:inline sm:ml-2">Visibility in</span>
          <div className="flex items-center justify-center gap-3 sm:gap-4 mt-1 sm:mt-4 flex-wrap">
            <div className="flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-white rounded-2xl shadow-lg">
              <ColorfulSparkle />
            </div>
            <span className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl">AI Search</span>
          </div>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mt-3 sm:mt-10 mb-4 sm:mb-12">
          See exactly how your brand performs in AI search results. Then take precise actions to boost 
          visibility create new content, refresh existing pages, or reach out to sites that mention 
          competitors but not you.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
          <button
            onClick={onStartTrial}
            className="h-12 sm:h-14 px-6 sm:px-8 rounded-full bg-white text-slate-950 font-semibold text-sm sm:text-base flex items-center gap-2 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 hover:-translate-y-1"
          >
            Start Free Trial
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={onBookDemo}
            className="h-12 sm:h-14 px-6 sm:px-8 rounded-full bg-white/10 text-white font-semibold text-sm sm:text-base border border-white/20 hover:bg-white/15 transition-all duration-300 hover:-translate-y-1"
          >
            Book a Demo
          </button>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-950 to-transparent" />

      {/* Floating Animation Style */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </section>
  );
}

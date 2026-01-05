import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative pt-12 sm:pt-16 pb-6 sm:pb-8 px-3 sm:px-4">
      {/* Subtle separator */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full max-w-5xl h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Left side - Copyright */}
          <div className="flex flex-col items-center sm:items-start gap-2">
            <p className="text-sm text-slate-400 font-medium">
              © {new Date().getFullYear()} AI Visibility Tracker
            </p>
            <p className="text-xs text-slate-500">
              Track your brand&apos;s presence in AI search results
            </p>
          </div>

          {/* Right side - Attribution */}
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span>Built with</span>
            <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
            <span>for</span>
            <a
              href="https://writesonic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Writesonic
            </a>
            <span className="hidden sm:inline">Engineering Challenge</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

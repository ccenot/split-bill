import React from 'react';
import { ReceiptText, Sun, Moon } from 'lucide-react';

export default function Header({ isDarkMode, onToggleTheme }) {
  return (
    <header className="relative w-full">
      {/* Authentic Scalloped / Perforated Receipt Top Edge */}
      <div className="w-full overflow-hidden leading-none h-3.5 bg-[#EDE4D8] dark:bg-[#121110] transition-colors">
        <svg className="w-full h-3.5 text-[#FAF4EB] dark:text-[#1E1B18] fill-current transition-colors" preserveAspectRatio="none" viewBox="0 0 100 10">
          <defs>
            <pattern id="scallop-top" x="0" y="0" width="8" height="10" patternUnits="userSpaceOnUse">
              <path d="M 0 10 L 0 0 C 2 5.5 6 5.5 8 0 L 8 10 Z" />
            </pattern>
          </defs>
          <rect width="100%" height="10" fill="url(#scallop-top)" />
        </svg>
      </div>

      <div className="px-5 pt-3 pb-2 flex items-center justify-between">
        {/* Left Icon */}
        <div className="w-8 flex items-center">
          <ReceiptText className="w-6 h-6 text-maroon-700/80 dark:text-amber-400" />
        </div>

        {/* Center Title & Tagline */}
        <div className="text-center">
          <h1 className="font-['Kaushan_Script','Caveat',cursive] text-3xl sm:text-4xl font-bold tracking-tight text-maroon-700 dark:text-amber-400 m-0 leading-tight">
            Talangin Dulu
          </h1>
          <p className="font-mono text-[11px] sm:text-xs tracking-[0.25em] font-semibold text-maroon-800/80 dark:text-amber-200/80 uppercase mt-1">
            SCAN · BAGI · BERES
          </p>
        </div>

        {/* Right Light / Dark Mode Toggle */}
        <div className="w-8 flex items-center justify-end">
          <button
            type="button"
            onClick={onToggleTheme}
            title={isDarkMode ? 'Ganti ke Mode Cerah' : 'Ganti ke Mode Gelap'}
            aria-label="Mode Cerah / Gelap"
            className="w-8 h-8 flex items-center justify-center rounded-full text-maroon-700/80 hover:text-maroon-900 dark:text-amber-400 dark:hover:text-amber-300 hover:bg-maroon-100/60 dark:hover:bg-neutral-800 transition-colors"
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Dashed divider */}
      <div className="mx-4 receipt-divider my-2"></div>
    </header>
  );
}

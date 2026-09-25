import React from 'react';
import { Settings, ReceiptText } from 'lucide-react';

export default function Header({ onOpenSettings }) {
  return (
    <header className="relative w-full">
      {/* Authentic Scalloped / Perforated Receipt Top Edge */}
      <div className="w-full overflow-hidden leading-none h-3.5 bg-[#EDE4D8]">
        <svg className="w-full h-3.5 text-[#FAF4EB] fill-current" preserveAspectRatio="none" viewBox="0 0 100 10">
          <defs>
            <pattern id="scallop-top" x="0" y="0" width="8" height="10" patternUnits="userSpaceOnUse">
              <path d="M 0 10 L 0 0 C 2 5.5 6 5.5 8 0 L 8 10 Z" />
            </pattern>
          </defs>
          <rect width="100%" height="10" fill="url(#scallop-top)" />
        </svg>
      </div>

      <div className="px-5 pt-3 pb-2 flex items-center justify-between">
        {/* Empty left spacer to balance gear on right */}
        <div className="w-8 flex items-center">
          <ReceiptText className="w-6 h-6 text-maroon-700/80" />
        </div>

        {/* Center Title & Tagline */}
        <div className="text-center">
          <h1 className="font-['Kaushan_Script','Caveat',cursive] text-3xl sm:text-4xl font-bold tracking-tight text-maroon-700 m-0 leading-tight">
            Talangin Dulu
          </h1>
          <p className="font-mono text-[11px] sm:text-xs tracking-[0.25em] font-semibold text-maroon-800/80 uppercase mt-1">
            SCAN · BAGI · BERES
          </p>
        </div>

        {/* Right Settings Gear */}
        <button
          onClick={onOpenSettings}
          title="Pengaturan API & Rekening"
          aria-label="Pengaturan"
          className="w-8 h-8 flex items-center justify-center rounded-full text-maroon-700/80 hover:text-maroon-900 hover:bg-maroon-100/60 transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Dashed divider */}
      <div className="mx-4 receipt-divider my-2"></div>
    </header>
  );
}

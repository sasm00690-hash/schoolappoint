import React from 'react';

export default function SmaLogo({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg className="h-full w-auto" viewBox="0 0 540 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* S-Cap Shape */}
        <path d="M148.5 240C120 240 100 220 90 195L120 185C125 200 135 210 148.5 210C162 210 170 200 170 190C170 175 160 170 140 160C110 145 90 135 90 105C90 75 115 50 148.5 50C175 50 195 70 205 95L175 105C170 95 162 85 148.5 85C135 85 125 95 125 105C125 115 135 120 155 130C185 145 205 155 205 185C205 215 180 240 148.5 240Z" fill="url(#smaGrad1)" />
        <path d="M148.5 20L90 40L148.5 60L207 40L148.5 20Z" fill="url(#smaGrad1)" />
        <rect x="138.5" y="50" width="20" height="15" fill="url(#smaGrad1)" />
        <path d="M90 40V75" stroke="url(#smaGrad1)" strokeWidth="4" />
        <circle cx="90" cy="77" r="6" fill="url(#smaGrad1)" />

        {/* M-People Shape */}
        <path d="M240 240V70L300 150L360 70V240" stroke="url(#smaGrad2)" strokeWidth="35" strokeLinecap="round" strokeLinejoin="round" />
        {/* People inside M */}
        <circle cx="300" cy="70" r="18" fill="url(#smaGrad2)" />
        <path d="M282 100C282 92 290 85 300 85C310 85 318 92 318 100" stroke="url(#smaGrad2)" strokeWidth="6" fill="none" />
        <circle cx="260" cy="95" r="14" fill="url(#smaGrad2)" />
        <circle cx="340" cy="95" r="14" fill="url(#smaGrad2)" />

        {/* A-Calendar Shape */}
        <path d="M420 240L480 60L540 240" stroke="url(#smaGrad3)" strokeWidth="35" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M445 160H515" stroke="url(#smaGrad3)" strokeWidth="20" strokeLinecap="round" />
        {/* Calendar inside A */}
        <rect x="495" y="150" width="50" height="50" rx="8" fill="#0F172A" />
        <rect x="502" y="165" width="36" height="30" fill="white" />
        <circle cx="508" cy="158" r="3" fill="white" />
        <circle cx="532" cy="158" r="3" fill="white" />
        {/* Calendar grid dots */}
        <rect x="507" y="172" width="5" height="5" rx="1" fill="#0F172A" />
        <rect x="517" y="172" width="5" height="5" rx="1" fill="#0F172A" />
        <rect x="527" y="172" width="5" height="5" rx="1" fill="#0F172A" />
        <rect x="507" y="182" width="5" height="5" rx="1" fill="#0F172A" />
        <rect x="517" y="182" width="5" height="5" rx="1" fill="#0F172A" />
        <path d="M525 185L528 188L534 182" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />

        {/* Gradients */}
        <defs>
          <linearGradient id="smaGrad1" x1="90" y1="20" x2="207" y2="240" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0F4C81" />
            <stop offset="1" stopColor="#1E3A8A" />
          </linearGradient>
          <linearGradient id="smaGrad2" x1="240" y1="50" x2="360" y2="240" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2563EB" />
            <stop offset="1" stopColor="#0F4C81" />
          </linearGradient>
          <linearGradient id="smaGrad3" x1="420" y1="60" x2="540" y2="240" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2563EB" />
            <stop offset="1" stopColor="#3B82F6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="flex flex-col justify-center leading-none">
        <span className="text-xl font-extrabold tracking-tight text-primary dark:text-blue-400">SMA</span>
        <span className="text-[7px] font-bold text-textSecondary dark:text-slate-400 uppercase tracking-widest mt-0.5">School Appoint</span>
      </div>
    </div>
  );
}

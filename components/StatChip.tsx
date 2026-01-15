'use client';

import { ReactNode } from 'react';

interface StatChipProps {
  label: string;
  value: string | number;
  className?: string;
}

export default function StatChip({ label, value, className = '' }: StatChipProps) {
  return (
    <div className={`
      inline-flex items-center gap-2
      px-3 py-1.5
      bg-white/5
      border border-cardBorder
      rounded-full
      ${className}
    `}>
      <span className="text-micro text-text2">{label}</span>
      <span className="text-sm font-medium text-text0">{value}</span>
    </div>
  );
}

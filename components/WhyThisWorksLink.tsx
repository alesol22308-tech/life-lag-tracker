'use client';

import Link from 'next/link';

export default function WhyThisWorksLink({
  href,
  className = '',
}: {
  href: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`text-xs text-slate-600 hover:text-slate-900 underline underline-offset-4 ${className}`}
    >
      Why this works ⓘ
    </Link>
  );
}


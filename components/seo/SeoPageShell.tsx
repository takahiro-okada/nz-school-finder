import Link from 'next/link';
import type { ReactNode } from 'react';

type SeoPageShellProps = {
  children: ReactNode;
};

export default function SeoPageShell({ children }: SeoPageShellProps) {
  return (
    <main className="min-h-dvh bg-slate-50 text-slate-950">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <nav className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
          <Link className="font-medium text-blue-700 hover:text-blue-900" href="/">
            Map
          </Link>
          <Link className="font-medium text-blue-700 hover:text-blue-900" href="/schools">
            Schools
          </Link>
          <Link className="font-medium text-blue-700 hover:text-blue-900" href="/about">
            About
          </Link>
        </nav>
        {children}
      </div>
    </main>
  );
}

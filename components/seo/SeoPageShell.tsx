import Link from 'next/link';
import type { ReactNode } from 'react';

type SeoPageShellProps = {
  children: ReactNode;
};

export default function SeoPageShell({ children }: SeoPageShellProps) {
  return (
    <main className="min-h-dvh bg-slate-100 text-slate-950">
      <div className="border-b border-slate-200 bg-white">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm sm:px-6 lg:px-8">
          <Link className="font-bold text-slate-950" href="/">
            NZ School Finder
          </Link>
          <div className="flex flex-wrap items-center gap-4 text-slate-600">
            <Link className="font-medium hover:text-slate-950" href="/">
              Map
            </Link>
            <Link className="font-medium hover:text-slate-950" href="/schools">
              Schools
            </Link>
            <Link className="font-medium hover:text-slate-950" href="/about">
              About
            </Link>
          </div>
        </nav>
      </div>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}

'use client';

import dynamic from 'next/dynamic';

const SchoolMapClient = dynamic(() => import('./school-map-client'), { ssr: false });

export default function Home() {
  return (
    <main className="h-dvh overflow-hidden">
      <SchoolMapClient />
    </main>
  );
}

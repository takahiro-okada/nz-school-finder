'use client';

import dynamic from 'next/dynamic';

const SchoolMapClient = dynamic(() => import('./school-map-client'), { ssr: false });

export default function Home() {
  return (
    <main style={{ height: '100vh', margin: 0, padding: 0 }}>
      <SchoolMapClient />
    </main>
  );
}

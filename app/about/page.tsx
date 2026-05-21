import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About',
  description: 'About NZ School Finder, its public data sources, and important usage notes.',
};

export default function AboutPage() {
  return (
    <main className="min-h-dvh bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-3xl">
        <Link className="text-sm font-medium text-blue-700 hover:text-blue-900" href="/">
          Back to map
        </Link>
        <h1 className="mt-6 text-3xl font-bold">About NZ School Finder</h1>
        <div className="mt-6 space-y-5 text-base leading-7 text-slate-700">
          <p>
            NZ School Finder is an independent map-based tool for exploring New Zealand schools,
            enrolment zones, school types, roll size, and ethnicity breakdowns.
          </p>
          <p>
            School records are based on public data published via data.govt.nz and the Ministry of
            Education. Enrolment zone boundaries are served from local GeoJSON data included with
            this project.
          </p>
          <p>
            This tool is designed for discovery and comparison. Families should confirm enrolment,
            zoning, and school details with the relevant school or official Ministry of Education
            sources before making decisions.
          </p>
        </div>
      </div>
    </main>
  );
}

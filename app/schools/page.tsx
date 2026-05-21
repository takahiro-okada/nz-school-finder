import type { Metadata } from 'next';
import Link from 'next/link';
import SchoolsDirectory, { type SchoolDirectoryItem } from '@/components/seo/SchoolsDirectory';
import SeoPageShell from '@/components/seo/SeoPageShell';
import TypeDistribution from '@/components/seo/TypeDistribution';
import {
  getAllSchools,
  getLocationSummaries,
  getSchoolSlug,
  getStudentTotal,
  getTypeCounts,
  getTypeGroupLabel,
} from '@/lib/schools/catalog';
import { siteUrl } from '@/lib/site';
import { displayValue } from '@/lib/schools/utils';

export const metadata: Metadata = {
  title: 'New Zealand Schools',
  description: 'Browse New Zealand schools by location, school type, roll size, and enrolment zone data.',
  alternates: {
    canonical: '/schools',
  },
};

export default function SchoolsPage() {
  const schools = getAllSchools();
  const locations = getLocationSummaries();
  const typeCounts = getTypeCounts(schools);
  const featuredSchools = [...schools]
    .sort((a, b) => Number(b.Total ?? 0) - Number(a.Total ?? 0))
    .slice(0, 12);
  const directoryItems: SchoolDirectoryItem[] = schools.map((school) => ({
    slug: getSchoolSlug(school),
    name: displayValue(school.Org_Name),
    city: displayValue(school.Add1_City, 'New Zealand'),
    type: displayValue(school.Org_Type),
    typeGroup: getTypeGroupLabel(school),
    authority: displayValue(school.Authority),
    students: Number(school.Total ?? 0),
    eqi: displayValue(school.EQi_Index),
  }));
  const cityOptions = locations.slice(0, 80).map((location) => location.city);
  const typeOptions = typeCounts.map((item) => item.label);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'NZ School Finder',
    url: new URL('/', siteUrl).toString(),
    description: metadata.description,
  };

  return (
    <SeoPageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch">
        <div className="flex flex-col justify-center rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
          <p className="text-sm font-semibold uppercase text-blue-700">New Zealand school directory</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Explore schools across New Zealand</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">
            Browse public school data by city, school type, student roll, authority, EQI index, and
            enrolment zone availability. The map remains the primary tool, while these pages make
            school information easier to discover from search.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800" href="/">
              Open map
            </Link>
            <Link
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
              href="/about"
            >
              Data sources
            </Link>
          </div>
        </div>
        <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-900 p-4 text-white">
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Schools" value={schools.length.toLocaleString('en-NZ')} />
            <Stat label="Locations" value={locations.length.toLocaleString('en-NZ')} />
            <Stat label="Students" value={getStudentTotal(schools).toLocaleString('en-NZ')} />
            <Stat label="Data source" value="MoE" />
          </div>
          <div className="min-h-32 rounded-md border border-white/10 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:24px_24px] p-4">
            <div className="h-full rounded-md bg-white/10 p-4">
              <div className="text-sm font-semibold">Automated from public school records</div>
              <div className="mt-2 text-sm text-slate-300">
                Search, filters, charts, profile pages, and sitemap URLs are generated from the same
                local data snapshot used by the map.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold">School type distribution</h2>
          <div className="mt-4">
            <TypeDistribution items={typeCounts} total={schools.length} />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold">Largest school communities</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {featuredSchools.map((school) => (
              <Link
                key={getSchoolSlug(school)}
                className="rounded-md border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50"
                href={`/schools/${getSchoolSlug(school)}`}
              >
                <div className="font-semibold text-slate-950">{displayValue(school.Org_Name)}</div>
                <div className="mt-1 text-sm text-slate-600">
                  {displayValue(school.Add1_City)} · {Number(school.Total ?? 0).toLocaleString('en-NZ')} students
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SchoolsDirectory schools={directoryItems} cityOptions={cityOptions} typeOptions={typeOptions} />
    </SeoPageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/10 p-4">
      <div className="text-xs font-semibold uppercase text-slate-300">{label}</div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}

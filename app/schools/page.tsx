import type { Metadata } from 'next';
import Link from 'next/link';
import { connection } from 'next/server';
import SchoolsDirectory, { type SchoolDirectoryItem } from '@/components/seo/SchoolsDirectory';
import SeoPageShell from '@/components/seo/SeoPageShell';
import TypeDistribution from '@/components/seo/TypeDistribution';
import {
  getAllSchools,
  getLocationSummaries,
  getSchoolSlug,
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

export default async function SchoolsPage() {
  // Render the requested filters on the server as well as on client navigation.
  await connection();
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
  const cityOptions = locations.map((location) => location.city).sort((a, b) => a.localeCompare(b, 'en-NZ'));
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
      <section className="rounded-lg border border-slate-200 bg-white p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase text-blue-700">School directory</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Find and compare New Zealand schools</h1>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          Browse {schools.length.toLocaleString('en-NZ')} schools across {locations.length.toLocaleString('en-NZ')} locations.
          Open a school profile for more information, or explore enrolment zones on the map.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
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
      </section>
      <SchoolsDirectory schools={directoryItems} cityOptions={cityOptions} typeOptions={typeOptions} />

      <section className="grid items-start gap-4 lg:grid-cols-[0.9fr_1.1fr]">
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

    </SeoPageShell>
  );
}

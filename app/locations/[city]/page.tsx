import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SeoPageShell from '@/components/seo/SeoPageShell';
import TypeDistribution from '@/components/seo/TypeDistribution';
import {
  getCitySlug,
  getSchoolSlug,
  getSchoolsByCitySlug,
  getStudentTotal,
  getTypeCounts,
} from '@/lib/schools/catalog';
import { displayValue } from '@/lib/schools/utils';

type LocationPageProps = {
  params: Promise<{ city: string }>;
};

export async function generateMetadata({ params }: LocationPageProps): Promise<Metadata> {
  const { city } = await params;
  const schools = getSchoolsByCitySlug(city);

  if (!schools.length) {
    return {};
  }

  const cityName = displayValue(schools[0].Add1_City);

  return {
    title: `${cityName} Schools`,
    description: `Browse ${schools.length} schools in ${cityName}, including school type, authority, roll size, and links to detailed school profiles.`,
    alternates: {
      canonical: `/locations/${getCitySlug(cityName)}`,
    },
  };
}

export default async function LocationPage({ params }: LocationPageProps) {
  const { city } = await params;
  const schools = getSchoolsByCitySlug(city);

  if (!schools.length) {
    notFound();
  }

  const cityName = displayValue(schools[0].Add1_City);
  const typeCounts = getTypeCounts(schools);
  const studentTotal = getStudentTotal(schools);
  const sortedSchools = [...schools].sort((a, b) => Number(b.Total ?? 0) - Number(a.Total ?? 0));
  const visibleSchools = sortedSchools.slice(0, 100);

  return (
    <SeoPageShell>
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
          <Link className="text-sm font-medium text-blue-700 hover:text-blue-900" href="/schools">
            All schools
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{cityName} schools</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700">
            Compare schools in {cityName} by type, authority, student roll, and profile data. This
            location page is generated from the same public school records used by the interactive map.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-slate-900 p-4 text-white">
          <Stat label="Schools" value={schools.length.toLocaleString('en-NZ')} />
          <Stat label="Students" value={studentTotal.toLocaleString('en-NZ')} />
          <Stat label="Largest roll" value={Number(sortedSchools[0]?.Total ?? 0).toLocaleString('en-NZ')} />
          <Stat label="School types" value={typeCounts.length.toLocaleString('en-NZ')} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold">School type mix</h2>
          <div className="mt-4">
            <TypeDistribution items={typeCounts} total={schools.length} />
          </div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold">Schools in {cityName}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Showing the largest {visibleSchools.length} schools by roll size. The sitemap includes
            individual profile pages for every school in this location.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {visibleSchools.map((school) => (
              <Link
                key={getSchoolSlug(school)}
                className="rounded-md border border-slate-200 p-4 hover:border-blue-300 hover:bg-blue-50"
                href={`/schools/${getSchoolSlug(school)}`}
              >
                <div className="font-semibold text-slate-950">{displayValue(school.Org_Name)}</div>
                <div className="mt-1 text-sm text-slate-600">
                  {displayValue(school.Org_Type)} · {Number(school.Total ?? 0).toLocaleString('en-NZ')} students
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
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

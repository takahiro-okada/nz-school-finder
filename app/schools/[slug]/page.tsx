import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import EthnicityDistribution from '@/components/seo/EthnicityDistribution';
import SchoolDataCards from '@/components/seo/SchoolDataCards';
import SeoPageShell from '@/components/seo/SeoPageShell';
import {
  getCityName,
  getEthnicityBreakdown,
  getSchoolBySlug,
  getSchoolSlug,
  getAllSchools,
  getTypeLabel,
} from '@/lib/schools/catalog';
import { siteUrl } from '@/lib/site';
import { buildSchoolLink, displayValue, getSchoolId } from '@/lib/schools/utils';

type SchoolPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: SchoolPageProps): Promise<Metadata> {
  const { slug } = await params;
  const school = getSchoolBySlug(slug);

  if (!school) {
    return {};
  }

  const name = displayValue(school.Org_Name);
  const city = getCityName(school);

  return {
    title: name,
    description: `${name} in ${city}: school type, authority, student roll, EQI index, ethnicity breakdown, and official links.`,
    alternates: {
      canonical: `/schools/${getSchoolSlug(school)}`,
    },
    openGraph: {
      title: `${name} | NZ School Finder`,
      description: `${name} in ${city}: school type, authority, student roll, EQI index, ethnicity breakdown, and official links.`,
      url: `/schools/${getSchoolSlug(school)}`,
      type: 'article',
    },
  };
}

export default async function SchoolPage({ params }: SchoolPageProps) {
  const { slug } = await params;
  const school = getSchoolBySlug(slug);

  if (!school) {
    notFound();
  }

  const city = getCityName(school);
  const relatedSchools = getAllSchools()
    .filter((item) => getSchoolId(item) !== getSchoolId(school))
    .filter((item) => getCityName(item) === city || displayValue(item.Org_Type) === displayValue(school.Org_Type))
    .slice(0, 8);
  const educationCountsLink = buildSchoolLink(school);
  const schoolUrl = displayValue(school.URL, '');
  const ethnicity = getEthnicityBreakdown(school);
  const name = displayValue(school.Org_Name);
  const mapHref = `/?school=${encodeURIComponent(getSchoolId(school))}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'EducationalOrganization',
    name,
    url: new URL(`/schools/${getSchoolSlug(school)}`, siteUrl).toString(),
    address: {
      '@type': 'PostalAddress',
      addressLocality: city,
      addressCountry: 'NZ',
    },
  };

  return (
    <SeoPageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="grid gap-0 lg:grid-cols-[1fr_320px]">
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <Link className="text-sm font-medium text-blue-700 hover:text-blue-900" href={`/schools?city=${encodeURIComponent(city)}`}>
                Browse {city} schools
              </Link>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                {displayValue(school.Status)}
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{name}</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700">
              {name} is a {getTypeLabel(school)} school in {city}. This profile brings together
              public school data, official links, and a direct map handoff for spatial context.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800" href={mapHref}>
                View on map
              </Link>
              <Link
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100"
                href="/schools"
              >
                Back to directory
              </Link>
            </div>
          </div>
          <div className="grid content-between border-t border-blue-100 bg-blue-50 p-5 text-slate-950 lg:border-l lg:border-t-0">
            <div>
              <div className="text-xs font-semibold uppercase text-slate-500">Student roll</div>
              <div className="mt-2 text-4xl font-bold">{Number(school.Total ?? 0).toLocaleString('en-NZ')}</div>
              <div className="mt-2 text-sm text-slate-600">{displayValue(school.Authority)} · {city}</div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-md border border-blue-100 bg-white p-3">
                <div className="text-xs uppercase text-slate-500">EQI</div>
                <div className="mt-1 text-xl font-bold">{displayValue(school.EQi_Index)}</div>
              </div>
              <div className="rounded-md border border-blue-100 bg-white p-3">
                <div className="text-xs uppercase text-slate-500">Type</div>
                <div className="mt-1 text-sm font-semibold">{getTypeLabel(school)}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SchoolDataCards school={school} />

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold">Data profile</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr] md:items-center">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-slate-950">
            <div className="text-xs font-semibold uppercase text-slate-500">Generated snapshot</div>
            <div className="mt-4 flex h-36 items-end gap-2">
              <div className="w-1/3 rounded-t-md bg-blue-600" style={{ height: `${Math.min(Number(school.Total ?? 0) / 45, 100)}%` }} />
              <div className="w-1/3 rounded-t-md bg-emerald-500" style={{ height: `${Math.min(Number(school.EQi_Index ?? 0) / 6, 100)}%` }} />
              <div className="w-1/3 rounded-t-md bg-amber-300" style={{ height: school.Authority ? '64%' : '24%' }} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] uppercase text-slate-500">
              <span>Roll</span>
              <span>EQI</span>
              <span>Source</span>
            </div>
          </div>
          <p className="text-sm leading-7 text-slate-700">
            This profile is generated automatically from the local school data snapshot. It is meant
            to support discovery and comparison, then point families to official school and Ministry
            of Education sources for decisions.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold">Ethnicity breakdown</h2>
          <div className="mt-4">
            <EthnicityDistribution items={ethnicity} />
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Ethnicity counts may add up to more than the total roll because students can identify
            with more than one ethnicity.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold">Official links</h2>
          <div className="mt-4 space-y-3">
            {schoolUrl ? (
              <a className="block rounded-md border border-slate-200 p-3 text-blue-700 hover:bg-blue-50" href={schoolUrl}>
                School website
              </a>
            ) : null}
            {educationCountsLink ? (
              <a className="block rounded-md border border-slate-200 p-3 text-blue-700 hover:bg-blue-50" href={educationCountsLink}>
                Education Counts profile
              </a>
            ) : null}
            <Link className="block rounded-md border border-slate-200 p-3 text-blue-700 hover:bg-blue-50" href={mapHref}>
              View this school on the map
            </Link>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Public school records and zone information should be verified with the school or the
            Ministry of Education before enrolment decisions.
          </p>
        </div>
      </section>

      {relatedSchools.length ? (
        <section className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold">Related schools</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {relatedSchools.map((item) => (
              <Link
                key={getSchoolSlug(item)}
                className="rounded-md border border-slate-200 p-3 hover:border-blue-300 hover:bg-blue-50"
                href={`/schools/${getSchoolSlug(item)}`}
              >
                <div className="font-semibold text-slate-950">{displayValue(item.Org_Name)}</div>
                <div className="mt-1 text-sm text-slate-600">{displayValue(item.Org_Type)}</div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </SeoPageShell>
  );
}

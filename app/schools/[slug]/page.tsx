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
      <section className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link className="text-sm font-medium text-blue-700 hover:text-blue-900" href={`/schools?city=${encodeURIComponent(city)}`}>
              Browse {city} schools
            </Link>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{name}</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-700">
              {name} is a {getTypeLabel(school)} school in {city}. This profile is generated from
              public school data and is designed to help families compare schools before confirming
              details with official sources.
            </p>
          </div>
          <div className="min-w-52 rounded-lg bg-slate-900 p-4 text-white">
            <div className="text-xs font-semibold uppercase text-slate-300">Student roll</div>
            <div className="mt-2 text-3xl font-bold">{Number(school.Total ?? 0).toLocaleString('en-NZ')}</div>
            <div className="mt-3 text-sm text-slate-300">{displayValue(school.Authority)} · {displayValue(school.Status)}</div>
          </div>
        </div>
      </section>

      <SchoolDataCards school={school} />

      <section className="rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-xl font-bold">Data profile</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr] md:items-center">
          <div className="rounded-lg bg-slate-900 p-4 text-white">
            <div className="text-xs font-semibold uppercase text-slate-300">Profile signal</div>
            <div className="mt-4 flex h-36 items-end gap-2">
              <div className="w-1/3 rounded-t-md bg-blue-400" style={{ height: `${Math.min(Number(school.Total ?? 0) / 45, 100)}%` }} />
              <div className="w-1/3 rounded-t-md bg-emerald-400" style={{ height: `${Math.min(Number(school.EQi_Index ?? 0) / 6, 100)}%` }} />
              <div className="w-1/3 rounded-t-md bg-amber-300" style={{ height: school.Authority ? '64%' : '24%' }} />
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
            <Link className="block rounded-md border border-slate-200 p-3 text-blue-700 hover:bg-blue-50" href="/">
              Open interactive map
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

import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';
import { getAllSchools, getLocationSummaries, getSchoolSlug } from '@/lib/schools/catalog';

const staticRoutes = [
  { route: '/', changeFrequency: 'weekly' as const, priority: 1 },
  { route: '/schools', changeFrequency: 'weekly' as const, priority: 0.9 },
  { route: '/about', changeFrequency: 'monthly' as const, priority: 0.6 },
  { route: '/privacy', changeFrequency: 'monthly' as const, priority: 0.4 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const schoolRoutes = getAllSchools().map((school) => ({
    url: new URL(`/schools/${getSchoolSlug(school)}`, siteUrl).toString(),
    lastModified,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));
  const locationRoutes = getLocationSummaries().map((location) => ({
    url: new URL(`/locations/${location.slug}`, siteUrl).toString(),
    lastModified,
    changeFrequency: 'weekly' as const,
    priority: 0.75,
  }));

  return [
    ...staticRoutes.map(({ route, changeFrequency, priority }) => ({
      url: new URL(route, siteUrl).toString(),
      lastModified,
      changeFrequency,
      priority,
    })),
    ...locationRoutes,
    ...schoolRoutes,
  ];
}

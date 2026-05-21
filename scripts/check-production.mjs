const baseUrlInput = process.argv[2] ?? process.env.NEXT_PUBLIC_SITE_URL;

if (!baseUrlInput) {
  console.error('Usage: npm run production:check -- https://nz-schools.dev-oka.com');
  console.error('Or set NEXT_PUBLIC_SITE_URL before running the command.');
  process.exit(1);
}

const baseUrl = new URL(baseUrlInput);
const checks = [
  { path: '/', label: 'Home page' },
  { path: '/about', label: 'About page' },
  { path: '/privacy', label: 'Privacy page' },
  { path: '/robots.txt', label: 'Robots metadata' },
  { path: '/sitemap.xml', label: 'Sitemap metadata' },
  { path: '/api/schools?limit=1', label: 'School search API' },
  { path: '/api/schools/all', label: 'All schools API' },
];

const readJson = async (response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

let failed = false;

for (const check of checks) {
  const url = new URL(check.path, baseUrl);
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'nz-school-finder-production-check',
    },
  });

  if (!response.ok) {
    failed = true;
    console.error(`FAIL ${check.label}: ${response.status} ${url}`);
    continue;
  }

  if (check.path.startsWith('/api/schools')) {
    const data = await readJson(response);
    const schools = Array.isArray(data?.schools) ? data.schools : [];
    const total = Number(data?.total ?? 0);
    if (!schools.length || !total) {
      failed = true;
      console.error(`FAIL ${check.label}: empty school payload ${url}`);
      continue;
    }
  }

  console.log(`OK ${check.label}: ${response.status} ${url}`);
}

if (failed) {
  process.exit(1);
}

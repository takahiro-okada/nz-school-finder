import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/^https?:\/\/(?!localhost:3000)/, (route) => route.abort());
});

for (const width of [390, 1440]) {
  test(`map and profile link to the same school at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/?school=7');
    await page.getByRole('link', { name: 'View full school profile' }).click();
    await expect(page).toHaveURL(/\/schools\/okaihau-college-7$/);
    await expect(page.getByRole('heading', { name: 'Okaihau College', exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Nearby schools' })).toBeVisible();
    await page.getByRole('link', { name: 'View on map', exact: true }).click();
    await expect(page).toHaveURL(/\?school=7$/);
    await expect(page.getByRole('heading', { name: 'Okaihau College', exact: true })).toBeVisible();
  });
}

test('directory browsing survives refresh, profile visits, and browser history', async ({ page }) => {
  await page.goto('/schools');
  const directory = page.locator('#school-directory');
  const query = directory.getByRole('searchbox');
  await query.fill('Auckland');
  await directory.getByRole('combobox', { name: 'Location', exact: true }).selectOption('Auckland');
  await directory.getByRole('combobox', { name: 'Type', exact: true }).selectOption('Primary');
  await directory.getByRole('combobox', { name: 'Sort', exact: true }).selectOption('name-asc');
  await directory.getByRole('button', { name: 'Show more' }).click();
  await expect(directory.getByText(/Showing 120 of/)).toBeVisible();
  const resultsUrl = page.url();
  await page.reload();
  await expect(query).toHaveValue('Auckland');
  await expect(directory.getByRole('combobox', { name: 'Type', exact: true })).toHaveValue('Primary');
  await expect(directory.getByRole('combobox', { name: 'Sort', exact: true })).toHaveValue('name-asc');
  await expect(directory.getByText(/Showing 120 of/)).toBeVisible();
  await directory.getByRole('link').first().click();
  await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Back to results' }).click();
  await expect(page).toHaveURL(`${resultsUrl}#school-directory`);
  await expect(directory.getByText(/Showing 120 of/)).toBeVisible();
  await expect(query).toHaveValue('Auckland');
  await directory.getByRole('combobox', { name: 'Sort', exact: true }).selectOption('city-asc');
  await page.goBack();
  await expect(directory.getByRole('combobox', { name: 'Sort', exact: true })).toHaveValue('name-asc');
  await expect(directory.getByText(/Showing 120 of/)).toBeVisible();
  await page.goForward();
  await expect(directory.getByRole('combobox', { name: 'Sort', exact: true })).toHaveValue('city-asc');
});

test('city browsing includes small locations and invalid navigation parameters fall back safely', async ({ page }) => {
  await page.goto('/schools/okaihau-college-7?returnTo=https://example.com');
  await expect(page.getByRole('link', { name: 'Back to directory' })).toHaveAttribute('href', '/schools#school-directory');
  await page.getByRole('link', { name: 'Browse Okaihau schools' }).click();
  await expect(page.getByRole('combobox', { name: 'Location', exact: true })).toHaveValue('Okaihau');
  await expect(page.locator('#school-directory').getByRole('link', { name: /Okaihau College/ })).toBeVisible();
  await page.goto('/schools?city=NotAPlace&type=Wrong&sort=invalid&limit=-5');
  await expect(page.getByRole('combobox', { name: 'Location', exact: true })).toHaveValue('All');
  await expect(page.getByRole('combobox', { name: 'Type', exact: true })).toHaveValue('All');
  await expect(page.getByRole('combobox', { name: 'Sort', exact: true })).toHaveValue('roll-desc');
  await expect(page.getByText(/Showing 60 of/)).toBeVisible();
});

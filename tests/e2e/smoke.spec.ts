import { expect, test } from '@playwright/test';

test.describe('school finder smoke flow', () => {
  test('loads the map shell and core controls', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'NZ School Finder' })).toBeVisible();
    await expect(page.getByPlaceholder('Enter address in New Zealand')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Search' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Primary' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Standard' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Satellite' })).toBeVisible();
    await expect(page.getByText('Click a marker on the map')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Schools' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'About' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Privacy' })).toBeVisible();
  });

  test('enables address search only after input and can clear it', async ({ page }) => {
    await page.goto('/');

    const addressInput = page.getByPlaceholder('Enter address in New Zealand');
    const searchButton = page.getByRole('button', { name: 'Search', exact: true });

    await expect(searchButton).toBeDisabled();
    await addressInput.fill('Wellington');
    await expect(searchButton).toBeEnabled();

    await page.getByRole('button', { name: 'X', exact: true }).click();
    await expect(addressInput).toHaveValue('');
    await expect(searchButton).toBeDisabled();
  });

  test('updates school type and map style selections', async ({ page }) => {
    await page.goto('/');

    const allFilter = page.getByRole('button', { name: 'All', exact: true });
    const secondaryFilter = page.getByRole('button', { name: 'Secondary', exact: true });
    const standardStyle = page.getByRole('button', { name: 'Standard', exact: true });
    const satelliteStyle = page.getByRole('button', { name: 'Satellite', exact: true });

    await expect(allFilter).toHaveClass(/bg-slate-900/);
    await secondaryFilter.click();
    await expect(secondaryFilter).toHaveClass(/bg-slate-900/);
    await expect(allFilter).not.toHaveClass(/bg-slate-900/);

    await expect(standardStyle).toHaveClass(/bg-slate-900/);
    await satelliteStyle.click();
    await expect(satelliteStyle).toHaveClass(/bg-slate-900/);
    await expect(standardStyle).not.toHaveClass(/bg-slate-900/);
  });

  test('opens public information pages from the map controls', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('link', { name: 'About' }).click();
    await expect(page.getByRole('heading', { name: 'About NZ School Finder' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to map' })).toBeVisible();

    await page.goto('/');
    await page.getByRole('link', { name: 'Privacy' }).click();
    await expect(page.getByRole('heading', { name: 'Privacy' })).toBeVisible();
    await expect(page.getByText('The app does not send the typed address to Google Analytics.')).toBeVisible();
  });

  test('opens school directory and profile pages', async ({ page }) => {
    await page.goto('/schools');

    await expect(page.getByRole('heading', { name: 'Find and compare New Zealand schools' })).toBeVisible();
    await page.getByPlaceholder('School name, city, type...').fill('Okaihau');
    await expect(page.getByRole('link', { name: /Okaihau College/ })).toBeVisible();

    await page.goto('/schools/okaihau-college-7');
    await expect(page.getByRole('heading', { name: 'Okaihau College' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Data profile' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ethnicity breakdown' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Education Counts profile' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'View on map' })).toHaveAttribute('href', '/?school=7');

    await page.goto('/?school=7');
    await expect(page.getByRole('heading', { name: 'Okaihau College' })).toBeVisible();
  });
});

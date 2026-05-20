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
  });

  test('enables address search only after input and can clear it', async ({ page }) => {
    await page.goto('/');

    const addressInput = page.getByPlaceholder('Enter address in New Zealand');
    const searchButton = page.getByRole('button', { name: 'Search' });

    await expect(searchButton).toBeDisabled();
    await addressInput.fill('Wellington');
    await expect(searchButton).toBeEnabled();

    await page.getByRole('button', { name: 'X', exact: true }).click();
    await expect(addressInput).toHaveValue('');
    await expect(searchButton).toBeDisabled();
  });

  test('switches between English and Japanese copy', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: 'JP', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'NZ 学校検索マップ' })).toBeVisible();
    await expect(page.getByText('地図上のマーカーをクリックしてください')).toBeVisible();

    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'NZ School Finder' })).toBeVisible();
  });
});

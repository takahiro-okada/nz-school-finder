import { expect, test } from '@playwright/test';

const responsiveViewports = [
  { width: 320, height: 720 },
  { width: 390, height: 844 },
  { width: 768, height: 900 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
];

function boxesOverlap(
  first: { x: number; y: number; width: number; height: number },
  second: { x: number; y: number; width: number; height: number }
) {
  return !(
    first.x + first.width <= second.x ||
    second.x + second.width <= first.x ||
    first.y + first.height <= second.y ||
    second.y + second.height <= first.y
  );
}

test.describe('school finder smoke flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/^https?:\/\/(?!localhost:3000)/, (route) => route.abort());
  });

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

    await page.getByRole('button', { name: 'Clear address search' }).click();
    await expect(addressInput).toHaveValue('');
    await expect(searchButton).toBeDisabled();
    await expect(addressInput).toBeFocused();
  });

  test('updates school type and map style selections', async ({ page }) => {
    await page.goto('/');

    const allFilter = page.getByRole('button', { name: 'All', exact: true });
    const secondaryFilter = page.getByRole('button', { name: 'Secondary', exact: true });
    const standardStyle = page.getByRole('button', { name: 'Standard', exact: true });
    const satelliteStyle = page.getByRole('button', { name: 'Satellite', exact: true });

    await expect(allFilter).toHaveClass(/bg-slate-900/);
    await expect(allFilter).toHaveAttribute('aria-pressed', 'true');
    await secondaryFilter.click();
    await expect(secondaryFilter).toHaveClass(/bg-slate-900/);
    await expect(secondaryFilter).toHaveAttribute('aria-pressed', 'true');
    await expect(allFilter).toHaveAttribute('aria-pressed', 'false');
    await expect(allFilter).not.toHaveClass(/bg-slate-900/);

    await expect(standardStyle).toHaveClass(/bg-slate-900/);
    await expect(standardStyle).toHaveAttribute('aria-pressed', 'true');
    await satelliteStyle.click();
    await expect(satelliteStyle).toHaveClass(/bg-slate-900/);
    await expect(satelliteStyle).toHaveAttribute('aria-pressed', 'true');
    await expect(standardStyle).toHaveAttribute('aria-pressed', 'false');
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

  for (const viewport of responsiveViewports) {
    test(`keeps map controls usable without overlap at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/');

      const primaryControls = page.getByTestId('map-primary-controls');
      const styleControls = page.getByTestId('map-style-controls');
      const zoomControls = page.locator('.leaflet-control-zoom');
      const zoomInButton = page.getByRole('button', { name: 'Zoom in' });

      await expect(primaryControls).toBeVisible();
      await expect(styleControls).toBeVisible();
      await expect(zoomControls).toBeVisible();

      const [primaryBox, styleBox, zoomBox, zoomInBox] = await Promise.all([
        primaryControls.boundingBox(),
        styleControls.boundingBox(),
        zoomControls.boundingBox(),
        zoomInButton.boundingBox(),
      ]);

      expect(primaryBox).not.toBeNull();
      expect(styleBox).not.toBeNull();
      expect(zoomBox).not.toBeNull();
      expect(zoomInBox).not.toBeNull();
      expect(boxesOverlap(primaryBox!, styleBox!)).toBe(false);
      expect(boxesOverlap(primaryBox!, zoomBox!)).toBe(false);
      expect(boxesOverlap(styleBox!, zoomBox!)).toBe(false);
      expect(zoomInBox!.width).toBeGreaterThanOrEqual(44);
      expect(zoomInBox!.height).toBeGreaterThanOrEqual(44);

      const pageWidth = await page.locator('body').evaluate((body) => body.scrollWidth);
      expect(pageWidth).toBeLessThanOrEqual(viewport.width);
    });
  }

  for (const viewport of [responsiveViewports[1], responsiveViewports[4]]) {
    test(`keeps selected-school details dismissible at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize(viewport);
      await page.goto('/?school=7');

      const detailsPanel = page.getByTestId('school-details-panel');
      await expect(detailsPanel.getByRole('heading', { name: 'Okaihau College' })).toBeVisible();
      await expect(detailsPanel.getByRole('button', { name: 'Close school details' })).toBeVisible();

      const panelBox = await detailsPanel.boundingBox();
      expect(panelBox).not.toBeNull();
      if (viewport.width < 1024) {
        expect(panelBox!.height).toBeLessThanOrEqual(viewport.height * 0.47);
      }

      await detailsPanel.getByRole('button', { name: 'Close school details' }).click();
      await expect(detailsPanel.getByRole('heading', { name: 'Okaihau College' })).toBeHidden();
    });
  }
});

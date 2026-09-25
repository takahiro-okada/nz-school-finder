import { expect, test } from '@playwright/test';

const addressInputName = 'Address Search';

test.describe('accessible address search', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/^https?:\/\/(?!localhost:3000)/, (route) => route.abort());
  });

  test('distinguishes an empty query and keeps focus in the search', async ({ page }) => {
    await page.goto('/');

    const addressInput = page.getByRole('textbox', { name: addressInputName });
    await addressInput.fill('   ');
    await addressInput.press('Enter');

    await expect(page.getByRole('status')).toHaveText('Enter a New Zealand address before searching.');
    await expect(addressInput).toBeFocused();
  });

  test('distinguishes a missing location from a location without a zone', async ({ page }) => {
    await page.route('**/api/geocode**', async (route) => {
      const query = new URL(route.request().url()).searchParams.get('q');
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify(
          query === 'Missing Place'
            ? { location: null }
            : { location: { lat: -50, lng: 180 } }
        ),
      });
    });
    await page.goto('/');

    const addressInput = page.getByRole('textbox', { name: addressInputName });
    await addressInput.fill('Missing Place');
    await addressInput.press('Enter');
    await expect(page.getByRole('status')).toHaveText(
      'We could not find that location in New Zealand. Check the address and try again.'
    );
    await expect(addressInput).toBeFocused();

    await addressInput.fill('Remote Location');
    await addressInput.press('Enter');
    await expect(page.getByRole('status')).toHaveText(
      'We found the location, but it is not inside an enrolment zone in our data.'
    );
    await expect(addressInput).toBeFocused();
  });

  test('offers a retry after an upstream failure without exposing the address to analytics', async ({ page }) => {
    let geocodeRequests = 0;
    await page.route('**/api/geocode**', async (route) => {
      geocodeRequests += 1;
      await route.fulfill({
        status: 502,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Geocoding request failed.' }),
      });
    });
    await page.addInitScript(() => {
      const testWindow = window as typeof window & { capturedAnalytics: unknown[][] };
      testWindow.capturedAnalytics = [];
      window.gtag = (...args: unknown[]) => testWindow.capturedAnalytics.push(args);
    });
    await page.goto('/');

    const addressInput = page.getByRole('textbox', { name: addressInputName });
    const privateAddress = '42 Private Test Street';
    await addressInput.fill(privateAddress);
    await addressInput.press('Enter');

    await expect(page.getByRole('status')).toHaveText('Address search is temporarily unavailable. Try again.');
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(addressInput).toBeFocused();
    await expect.poll(() => geocodeRequests).toBe(2);

    const analyticsPayload = await page.evaluate(() =>
      JSON.stringify((window as typeof window & { capturedAnalytics: unknown[][] }).capturedAnalytics)
    );
    expect(analyticsPayload).not.toContain(privateAddress);
    expect(analyticsPayload).toContain('address_search_started');
  });

  test('announces successful results and moves focus to selected school details', async ({ page }) => {
    await page.route('**/api/geocode**', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({ location: { lat: -35.323759, lng: 173.765764 } }),
      })
    );
    await page.goto('/');

    const addressInput = page.getByRole('textbox', { name: addressInputName });
    await addressInput.fill('Okaihau');
    await addressInput.press('Enter');

    await expect(page.getByRole('status')).toContainText('with an enrolment zone covering this location');
    await page
      .getByRole('region', { name: 'Address search results' })
      .getByRole('button', { name: 'Okaihau College', exact: true })
      .click();

    const detailsPanel = page.getByTestId('school-details-panel');
    await expect(detailsPanel).toBeFocused();
    await expect(detailsPanel.getByRole('heading', { name: 'Okaihau College' })).toBeVisible();
  });
});

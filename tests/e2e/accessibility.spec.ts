import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = [
  { name: 'map shell', path: '/' },
  { name: 'school directory', path: '/schools' },
  { name: 'school profile', path: '/schools/okaihau-college-7' },
];

test.describe('automated accessibility checks', () => {
  test.beforeEach(async ({ page }) => {
    await page.route(/^https?:\/\/(?!localhost:3000)/, (route) => route.abort());
  });

  for (const target of pages) {
    test(`${target.name} has no serious or critical axe violations`, async ({ page }) => {
      await page.goto(target.path);

      if (target.path === '/') {
        await expect(page.getByText('2561 locations')).toBeVisible();
      }

      const results = await new AxeBuilder({ page }).analyze();
      const importantViolations = results.violations
        .filter((violation) => violation.impact === 'serious' || violation.impact === 'critical')
        .map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          help: violation.help,
          targets: violation.nodes.map((node) => node.target),
        }));

      expect(importantViolations).toEqual([]);
    });
  }
});

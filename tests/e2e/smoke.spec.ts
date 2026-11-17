import { expect, test, type Page } from '@playwright/test';

/**
 * The visitor's main paths, read-only: pages answer, links lead somewhere, a tool works in the
 * browser and unknown addresses answer 404 (not 500). See playwright.config.ts to run them.
 */

/** The analytics banner may cover buttons on a phone: decline it when it shows. */
async function dismissConsent(page: Page) {
  const refuse = page.getByRole('button', { name: /^(Refuser|Decline)$/ });
  if (await refuse.isVisible().catch(() => false)) await refuse.click();
}

/** Uncaught errors of the page's scripts, collected while the test runs. */
function collectPageErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test('the home page leads to the French site', async ({ page }) => {
  const errors = collectPageErrors(page);
  const response = await page.goto('/');
  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(/\/fr\/?$/);
  await expect(page.locator('h1').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('the English home page answers', async ({ page }) => {
  const response = await page.goto('/en');
  expect(response?.status()).toBe(200);
  await expect(page.locator('html')).toHaveAttribute('lang', /^en/);
  await expect(page.locator('h1').first()).toBeVisible();
});

test('the tools catalog lists tools that open', async ({ page }) => {
  await page.goto('/fr/outils');
  const links = page.locator('a[href^="/fr/outils/"]:not([href*="/categorie/"])');
  expect(await links.count()).toBeGreaterThan(5);
  const href = await links.first().getAttribute('href');
  const response = await page.goto(href!);
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1').first()).toBeVisible();
});

test('the Base64 tool encodes in the browser', async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto('/fr/outils/base64-encoder');
  await dismissConsent(page);
  // A click before React has loaded does nothing: retried until the result shows.
  await expect(async () => {
    await page.locator('textarea:not([readonly])').first().fill('Bonjour');
    await page.getByRole('button', { name: /Encoder en Base64/ }).click();
    await expect(page.locator('textarea[readonly]').first()).toHaveValue('Qm9uam91cg==', { timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
  expect(errors).toEqual([]);
});

test('the blog lists articles that open', async ({ page }) => {
  await page.goto('/fr/blog');
  const links = page.locator('a[href^="/fr/blog/"]:not([href*="/categorie/"])');
  expect(await links.count()).toBeGreaterThan(0);
  const href = await links.first().getAttribute('href');
  const response = await page.goto(href!);
  expect(response?.status()).toBe(200);
  await expect(page.locator('h1').first()).toBeVisible();
});

test('the contact page shows its form', async ({ page }) => {
  const response = await page.goto('/fr/contact');
  expect(response?.status()).toBe(200);
  // The menu holds other forms on a phone: the contact form is the one with a message field.
  await expect(page.locator('form:has(textarea)').first()).toBeVisible();
});

for (const path of ['/fr/une-page-qui-n-existe-pas', '/fr/outils/un-outil-qui-n-existe-pas', '/fr/blog/un-article-qui-n-existe-pas']) {
  test(`unknown address answers 404: ${path}`, async ({ request }) => {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(404);
  });
}

test('the VAT calculator goes from net to gross with the country rate', async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto('/fr/outils/calculateur-tva');
  await dismissConsent(page);
  await expect(async () => {
    await page.getByLabel('Pays').selectOption('CM');
    await page.getByLabel('Montant HT').fill('100000');
    await expect(page.getByText(/119\s250\s*FCFA/).first()).toBeVisible({ timeout: 1_000 });
  }).toPass({ timeout: 15_000 });
  await expect(page.getByText('cent dix-neuf mille deux cent cinquante francs CFA')).toBeVisible();
  expect(errors).toEqual([]);
});

test('the receipt generator shows the amount in words and its preview', async ({ page }) => {
  const errors = collectPageErrors(page);
  await page.goto('/fr/outils/generateur-recu-paiement');
  await dismissConsent(page);
  await expect(page.getByText(/soixante-quinze mille francs CFA/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('button', { name: 'Télécharger le PDF' })).toBeEnabled({ timeout: 15_000 });
  expect(errors).toEqual([]);
});

test('the invoice writes its total in words', async ({ page }) => {
  await page.goto('/fr/outils/generateur-facture');
  await dismissConsent(page);
  // The sample: 520 000 FCFA before tax at 18.9 % (Congo).
  await expect(page.getByText(/six cent dix-huit mille deux cent quatre-vingts francs CFA/)).toBeVisible({ timeout: 15_000 });
});

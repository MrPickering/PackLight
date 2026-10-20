import { test, expect } from '@playwright/test';
const now = new Date().toISOString();
const seed = { version: 6, state: { onboardingComplete: true, profile: { name: 'Alex', currentTerrain: 'camp', terrainSetAt: now, firstStepsComplete: true }, items: [] } };

test('first launch explains privacy and does not contact third parties', async ({ page }) => {
  const external: string[] = [];
  page.on('request', r => { if (!r.url().startsWith('http://127.0.0.1:4173')) external.push(r.url()); });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'PackLight', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Privacy and data storage' })).toBeVisible();
  await page.getByRole('link', { name: 'Privacy and data storage' }).click();
  await expect(page.getByRole('heading', { name: 'PackLight privacy' })).toBeVisible();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await page.getByRole('button', { name: 'Get Started' }).click();
  await expect(page.getByPlaceholder('What should we call you?')).toBeVisible();
  await page.getByPlaceholder('What should we call you?').fill('Alex');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Skip', exact: true }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: 'Start Using PackLight' }).click();
  await page.getByRole('button', { name: 'Skip all and go to my pack' }).click();
  await expect(page.getByRole('button', { name: /add.*(item|pack)/i }).first()).toBeVisible();
  expect(external).toEqual([]);
  await page.screenshot({ path: `artifacts/screenshots/onboarding-${test.info().project.name}.png`, fullPage: true });
});

test('AI is opt-in; dismissing one suggestion cannot approve the wrong item', async ({ page }) => {
  await page.addInitScript(value => localStorage.setItem('packlight-store', JSON.stringify(value)), seed);
  let requests = 0;
  await page.route('https://api.anthropic.com/v1/messages', route => {
    requests++;
    return route.fulfill({ json: { content: [{ type: 'text', text: JSON.stringify([
      { name: 'First suggestion', compartment: 'stones', suggestedWeight: 2, suggestedUtility: 3 },
      { name: 'Second suggestion', compartment: 'chains', suggestedWeight: 3, suggestedUtility: 4 },
    ]) }] } });
  });
  await page.goto('/#/settings');
  await page.getByLabel('Anthropic API key').fill('test-key-not-real');
  await expect(page.getByRole('button', { name: 'Enable for this session' })).toBeDisabled();
  await page.getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Enable for this session' }).click();
  await page.getByRole('link', { name: 'Journal', exact: true }).last().click();
  await page.getByRole('textbox', { name: 'Journal entry' }).fill('Keep this one local.');
  await page.getByRole('button', { name: 'Save Entry' }).click();
  expect(requests).toBe(0);
  await page.getByRole('textbox', { name: 'Journal entry' }).fill('Analyze this one.');
  await page.getByRole('button', { name: 'Save & Analyze' }).click();
  await page.getByRole('button', { name: 'Dismiss First suggestion' }).click();
  await page.getByRole('button', { name: 'Add Second suggestion' }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('packlight-store')!).state.items.map((i: { name: string }) => i.name))).toEqual(['Second suggestion']);
  expect(requests).toBe(1);
  expect(await page.evaluate(() => localStorage.getItem('packlight-api-key'))).toBeNull();
});

test('pack and journal persist; backups validate before replacement', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(value => { if (!localStorage.getItem('packlight-store')) localStorage.setItem('packlight-store', JSON.stringify(value)); }, seed);
  await page.goto('/');
  await page.getByRole('button', { name: /add.*(item|pack)/i }).first().click();
  await page.getByRole('button', { name: /Something else/ }).click();
  await page.getByPlaceholder("Type what you're carrying...").fill('Release review');
  await page.getByRole('button', { name: 'Add to Pack', exact: true }).click();
  await page.reload();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('packlight-store')!).state.items[0]?.name)).toBe('Release review');
  await page.getByRole('link', { name: 'Journal', exact: true }).last().click();
  await page.getByRole('textbox', { name: 'Journal entry' }).fill('Today I took one small step.');
  await page.getByRole('button', { name: 'Save Entry' }).click();
  await expect(page.getByText('Today I took one small step.', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Settings', exact: true }).last().click();
  await expect(page.getByRole('button', { name: /Gentle/ })).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export Pack' }).click();
  await (await download).saveAs(`artifacts/test-backup-${test.info().project.name}.json`);
  await page.getByLabel('Choose PackLight backup').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{"version":4,"profile":{}}') });
  await expect(page.getByRole('alert')).toContainText('invalid');
  await page.getByLabel('Choose PackLight backup').setInputFiles(`artifacts/test-backup-${test.info().project.name}.json`);
  await expect(page.getByRole('region', { name: 'Confirm import' })).toContainText('1 items and 1 journal entries');
  await page.getByRole('button', { name: 'Replace with backup' }).click();
  await expect(page.getByRole('status')).toContainText('imported and saved');
  await page.screenshot({ path: `artifacts/screenshots/settings-${test.info().project.name}.png`, fullPage: true });
  expect(errors).toEqual([]);
});

test('corrupt persisted data is preserved and shown with recovery controls', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('packlight-store', '{broken'));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your pack could not be opened' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('packlight-store'))).toBe('{broken');
});

test('decomposition and classification work and all main routes fit mobile', async ({ page }) => {
  const initial = { ...seed, state: { ...seed.state, items: [{ id: 'root-item', name: 'Work', compartment: 'chains', weight: 7, utility: 4, createdAt: now, updatedAt: now }] } };
  await page.addInitScript(value => { if (!localStorage.getItem('packlight-store')) localStorage.setItem('packlight-store', JSON.stringify(value)); }, initial);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/#/decompose/root-item');
  await page.getByPlaceholder('Or type something specific...').fill('One small task');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByRole('button', { name: 'Add without rating' }).click();
  await page.getByRole('button', { name: "That's everything" }).click();
  await page.getByRole('button', { name: /No, it's atomic/ }).click();
  await page.getByPlaceholder('In your own words...').fill('Prepare one outline');
  await page.getByPlaceholder('What does it do to your days...').fill('Takes focus');
  await page.getByPlaceholder('The root of its weight...').fill('Uncertainty');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Decomposition Complete' })).toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('packlight-store')!).state.items[1]?.classification?.what)).toBe('Prepare one outline');
  for (const route of ['/', '/pack/chains', '/journal', '/agents', '/trail', '/repack', '/settings']) {
    await page.goto(`/#${route}`);
    await expect(page.locator('main h1').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), route).toBe(true);
  }
  await page.goto('/#/');
  await page.getByRole('button', { name: /add.*(item|pack)/i }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(errors).toEqual([]);
});

/** Capture the local demo and compose real, unmodified UI screenshots for the README.
 * Run: node scripts/create-collage.mjs (requires docker compose up -d).
 * Existing demo realm/theme configuration is preserved.
 */
import { chromium } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const views = path.join(root, 'docs/views');
await mkdir(views, { recursive: true });
const base = 'http://localhost:8089';
const auth = `${base}/realms/goodui/protocol/openid-connect/auth?client_id=theme-preview&redirect_uri=http%3A%2F%2Flocalhost%3A8089%2Fcallback&response_type=code&scope=openid&kc_locale=de`;
const browser = await chromium.launch();
async function ready(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.locator('img:visible').evaluateAll(images => Promise.all(images.map(image => image.decode().catch(() => {}))));
}
async function loginView(mode, name, register = false) {
  const page = await browser.newPage({viewport: {width: 1000, height: 1200}});
  try {
    await page.goto(`${auth}&theme_mode=${mode}`);
    await page.locator('#username').waitFor();
    if (register) {
      await page.locator('#kc-registration a').click();
      await page.locator('#email').waitFor();
    }
    await page.evaluate(() => document.activeElement?.blur());
    await ready(page);
    await page.locator('.pf-v5-c-login__container').screenshot({path: path.join(views, name)});
  } finally { await page.close(); }
}
try {
  await loginView('light', 'login-light.png');
  await loginView('dark', 'login-dark.png');
  await loginView('light', 'registration-light.png', true);
  const mobile = await browser.newPage({viewport: {width: 375, height: 812}});
  await mobile.goto(`${auth}&theme_mode=dark`);
  await mobile.locator('#username').waitFor();
  await mobile.evaluate(() => document.activeElement?.blur());
  await ready(mobile);
  await mobile.screenshot({path: path.join(views, 'mobile-dark.png'), fullPage: true});
  await mobile.close();
  for (const [kind, url, username, password] of [
    ['account', '/realms/goodui/account/?theme_mode=dark&kc_locale=de', 'demo', 'demo-change-me'],
    ['admin', '/admin/master/console/?theme_mode=light&kc_locale=de', 'admin', 'local-admin-change-me'],
  ]) {
    const page = await browser.newPage({viewport: {width: 1280, height: 900}});
    await page.goto(base + url);
    await page.locator('#username').fill(username);
    await page.locator('#password').fill(password);
    await page.locator('#kc-login').click();
    await page.locator('.pf-v5-c-masthead').waitFor();
    // Wait for the application data, not only its masthead/loading shell.
    if (kind === 'account') await page.locator('input[name="email"]').waitFor();
    else await page.getByRole('heading', {name: /Welcome to Keycloak|Willkommen bei Keycloak/}).waitFor();
    await ready(page);
    await page.screenshot({path: path.join(views, `${kind}.png`), fullPage: true});
    await page.close();
  }

  const dataUrl = async (file, mime = 'image/png') => `data:${mime};base64,${(await readFile(file)).toString('base64')}`;
  const logo = await dataUrl(path.join(root, 'themes/goodui/login/resources/img/goodui-logo-dark.svg'), 'image/svg+xml');
  const cards = [
    ['login-light.png', '01', 'Anmeldung', 'Hell. Klar. Vertraut.', 'light'],
    ['login-dark.png', '02', 'Darkmode', 'Dein Modus, vom ersten Moment an.', 'dark'],
    ['registration-light.png', '03', 'Registrierung', 'Ein stimmiger Einstieg.', 'light'],
    ['account.png', '04', 'Account Console', 'Das eigene Konto im gleichen Design.', 'dark console'],
    ['admin.png', '05', 'Administration', 'Originale Funktionen. Dein Branding.', 'light console'],
    ['mobile-dark.png', '06', 'Auch mobil', 'GoodUI auf jedem Bildschirm.', 'dark mobile'],
  ];
  const markup = await Promise.all(cards.map(async ([file, number, title, caption, classes]) => `
    <article class="card ${classes}">
      <header><span>${number}</span><h2>${title}</h2></header>
      <div class="shot"><img src="${await dataUrl(path.join(views, file))}" alt="${title}"></div>
      <p>${caption}</p>
    </article>`));
  const page = await browser.newPage({viewport: {width: 1800, height: 1510}, deviceScaleFactor: 1});
  await page.setContent(`<!doctype html><html lang="de"><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; }
    body { margin: 0; color: #fafafa; font-family: Arial, sans-serif; background: #0b1020;
      background-image: radial-gradient(ellipse at 85% 0%, #183b85 0%, transparent 47%), radial-gradient(ellipse at 0% 100%, #142c52 0%, transparent 45%); }
    main { width: 1800px; padding: 58px 64px 34px; }
    .intro { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 34px; }
    .eyebrow { color: #93baff; font-size: 15px; font-weight: 700; letter-spacing: 3px; margin: 0 0 15px; }
    h1 { font-size: 61px; font-weight: 700; letter-spacing: -2px; margin: 0 0 14px; }
    .summary { font-size: 22px; color: #bbc8df; margin: 0; }
    .brand { width: 225px; padding-top: 8px; }
    .brand img { width: 225px; display: block; }
    .brand p { color: #91a7ca; font-size: 13px; letter-spacing: 4px; text-align: right; margin-top: 18px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
    .card { height: 550px; border-radius: 18px; overflow: hidden; border: 1px solid #dfe3eb; background: #fff; color: #171b26; box-shadow: 0 14px 30px #0003; }
    .card.dark { background: #09090b; border-color: #30384c; color: #fafafa; }
    .card header { display: flex; align-items: center; gap: 12px; height: 56px; padding: 0 24px; border-bottom: 1px solid #e4e4e7; }
    .card.dark header { border-color: #27272a; }
    .card header span { color: #71717a; font: 13px monospace; }
    .card.dark header span { color: #a1a1aa; }
    h2 { margin: 0; font-size: 16px; font-weight: 600; letter-spacing: .1px; }
    .shot { height: 448px; padding: 16px 22px 8px; display: flex; align-items: center; justify-content: center; }
    .shot img { max-width: 100%; max-height: 100%; width: auto; height: auto; display: block; }
    .console .shot { padding: 18px 12px; }
    .console .shot img { border: 1px solid #e4e4e7; border-radius: 6px; }
    .console.dark .shot img { border-color: #27272a; }
    .mobile .shot { padding-top: 12px; }
    .mobile .shot img { border: 1px solid #27272a; border-radius: 14px; }
    .card > p { margin: 12px 22px 0; font-size: 13px; color: #71717a; text-align: center; }
    .card.dark > p { color: #a1a1aa; }
    footer { display: flex; justify-content: space-between; align-items: center; padding: 26px 0 0; }
    footer p { color: #9db0d0; margin: 0; font-size: 17px; }
    footer strong { color: #c6dcff; font-size: 19px; font-weight: 500; }
  </style></head><body><main>
    <div class="intro"><div><p class="eyebrow">GOODUI × KEYCLOAK</p><h1>Dein Login. Dein Look.</h1>
    <p class="summary">Ein durchgängiges Design. Hell, dunkel und mobil.</p></div>
    <div class="brand"><img src="${logo}" alt="GoodUI"><p>KEYCLOAK THEME</p></div></div>
    <div class="grid">${markup.join('')}</div>
    <footer><p>Farben und Logos anpassen. Deinen Auftritt gestalten.</p><strong>Mehr entdecken → goodui.cloudfrogger.com</strong></footer>
  </main></body></html>`, {waitUntil: 'load'});
  await ready(page);
  await page.locator('main').screenshot({path: path.join(root, 'docs/theme-collage.png')});
  console.log('Created docs/theme-collage.png from six real Keycloak views.');
} finally { await browser.close(); }

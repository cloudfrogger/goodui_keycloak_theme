import { test, expect } from '@playwright/test';
import { createHmac } from 'node:crypto';
let adminToken;
const baseURL = process.env.KEYCLOAK_BASE_URL || 'http://localhost:8089';
const authPath = '/realms/goodui/protocol/openid-connect/auth?client_id=theme-preview&redirect_uri=' + encodeURIComponent(baseURL + '/callback') + '&response_type=code&scope=openid';
test.beforeAll(async ({ request }) => {
  const response = await request.post('/realms/master/protocol/openid-connect/token', { form: {
    client_id:'admin-cli', grant_type:'password', username:'admin', password:'local-admin-change-me'
  }});
  expect(response.ok()).toBeTruthy();
  const {access_token} = await response.json();
  adminToken = access_token;
  for (const realm of ['goodui','master']) {
    const result = await request.put('/admin/realms/'+realm,{headers:{Authorization:'Bearer '+access_token},data:{loginTheme:'goodui',accountTheme:'goodui',adminTheme:'goodui',emailTheme:'goodui'}});
    expect(result.ok()).toBeTruthy();
  }
  // Imported fixtures need explicit account roles; no production users are touched.
  const headers = {Authorization:'Bearer '+access_token};
  const previews = await (await request.get('/admin/realms/goodui/clients?clientId=theme-preview',{headers})).json();
  const configured = await request.put(`/admin/realms/goodui/clients/${previews[0].id}`,{headers,data:{redirectUris:[baseURL+'/*'],webOrigins:[baseURL]}});
  expect(configured.ok()).toBeTruthy();
  const users = await (await request.get('/admin/realms/goodui/users?username=demo',{headers})).json();
  const clients = await (await request.get('/admin/realms/goodui/clients?clientId=account',{headers})).json();
  const roles = await (await request.get(`/admin/realms/goodui/clients/${clients[0].id}/roles`,{headers})).json();
  const result = await request.post(`/admin/realms/goodui/users/${users[0].id}/role-mappings/clients/${clients[0].id}`,{headers,data:roles.filter(r=>['manage-account','view-profile'].includes(r.name))});
  expect(result.ok()).toBeTruthy();

});
for (const mode of ['light','dark']) {
  test(`${mode}: initial mode, login, error, registration, reset and mobile`,async ({ page })=>{
    const failures=[];
    page.on('pageerror',e=>failures.push(e.message));
    page.on('response',r=>{if(r.status()>=400 && r.url().includes('/resources/'))failures.push(`${r.status()} ${r.url()}`);});
    await page.emulateMedia({colorScheme:mode==='light'?'dark':'light'});
    await page.addInitScript(() => {
      window.firstPaintThemes = [];
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) window.firstPaintThemes.push({name:entry.name,theme:document.documentElement.dataset.theme});
      }).observe({type:'paint',buffered:true});
    });
    await page.goto(authPath+'&theme_mode='+mode);
    await expect(page.locator('#username')).toBeVisible();
    await expect.poll(()=>page.evaluate(()=>window.firstPaintThemes.length)).toBeGreaterThan(0);
    expect(await page.evaluate(()=>window.firstPaintThemes.every(x=>x.theme===document.documentElement.dataset.theme))).toBe(true);
    await expect(page.locator('html')).toHaveAttribute('data-theme',mode);
    await expect(page.locator('.goodui-logo-'+mode)).toBeVisible();
    await expect(page.locator('.goodui-logo-'+(mode==='dark'?'light':'dark'))).toBeHidden();
    await page.screenshot({path:`docs/login-${mode}.png`,fullPage:true});
    await page.locator('#username').fill('wrong-user');
    await page.locator('#password').fill('wrong-password');
    await page.locator('#kc-login').click();
    await expect(page.locator('#input-error-username')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-theme',mode);
    await page.locator('#kc-registration a').click();
    await expect(page.locator('#email')).toBeVisible();
    await page.screenshot({path:`test-results/register-${mode}.png`,fullPage:true});
    await expect(page.locator('html')).toHaveAttribute('data-theme',mode);
    await page.goto(authPath+'&theme_mode='+mode);
    await page.locator('a[href*="reset-credentials"]').click();
    await expect(page.locator('#username')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-theme',mode);
    await page.locator('#username').fill('nobody@example.test');
    await page.locator('input[type=submit], button[type=submit]').first().click();
    await expect(page.locator('.pf-v5-c-alert')).toBeVisible();
    await page.setViewportSize({width:375,height:812});
    await page.goto(authPath+'&theme_mode='+mode);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.screenshot({path:`docs/login-${mode}-mobile.png`,fullPage:true});
    await page.locator('#goodui-theme-mode').selectOption(mode==='dark'?'light':'dark');
    await expect(page.locator('html')).toHaveAttribute('data-theme',mode==='dark'?'light':'dark');
    expect(new URL(page.url()).searchParams.get('client_id')).toBe('theme-preview');
    expect(failures).toEqual([]);
  });
}
test('real login and account console use original Keycloak application',async ({page})=>{
  await page.goto('/realms/goodui/account/?theme_mode=dark');
  await expect(page.locator('#username')).toBeVisible();
  {
    await page.locator('#username').fill('demo');await page.locator('#password').fill('demo-change-me');await page.locator('#kc-login').click();
  }
  await expect(page.locator('body')).toHaveAttribute('data-page-id','account');
  await expect(page.locator('.pf-v5-c-masthead')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.screenshot({path:'docs/account-dark.png',fullPage:true});
});
test('admin console uses upstream application with GoodUI branding',async ({page})=>{
  await page.goto('/admin/master/console/?theme_mode=light');
  await expect(page.locator('#username')).toBeVisible();
  await page.locator('#username').fill('admin');await page.locator('#password').fill('local-admin-change-me');await page.locator('#kc-login').click();
  await expect(page.locator('body')).toHaveAttribute('data-page-id','admin');
  await expect(page.locator('.pf-v5-c-masthead')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.screenshot({path:'docs/admin-light.png',fullPage:true});
});

test('welcome supports explicit dark mode',async ({page})=>{
  await page.emulateMedia({colorScheme:'light'});
  await page.goto('/?theme_mode=dark');
  await expect(page.locator('body')).toHaveAttribute('data-page-id','welcome');
  await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await expect(page.locator('.goodui-logo-dark')).toBeVisible();
});
function totp(encoded) {
  const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits='';
  for(const char of encoded.replace(/[^A-Z2-7]/gi,'').toUpperCase())bits+=alphabet.indexOf(char).toString(2).padStart(5,'0');
  const secret=Buffer.from(bits.match(/.{8}/g).map(x=>parseInt(x,2)));
  const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(Math.floor(Date.now()/30000)));
  const digest=createHmac('sha1',secret).update(counter).digest();
  return String((digest.readUInt32BE(digest[19]&15)&0x7fffffff)%1000000).padStart(6,'0');
}
test('password update and TOTP enrollment complete with original required actions',async ({page,request})=>{
  const headers={Authorization:'Bearer '+adminToken};
  const username='flow-'+Date.now();
  const response=await request.post('/admin/realms/goodui/users',{headers,data:{username,email:username+'@example.test',emailVerified:true,enabled:true,firstName:'Flow',lastName:'Test',clientRoles:{account:['manage-account','view-profile']},requiredActions:['UPDATE_PASSWORD','CONFIGURE_TOTP'],credentials:[{type:'password',value:'initial-pass',temporary:false}]}});
  expect(response.status()).toBe(201);
  const location=response.headers().location;
  try {
    await page.goto(authPath+'&theme_mode=dark');
    await page.locator('#username').fill(username);await page.locator('#password').fill('initial-pass');await page.locator('#kc-login').click();
    for(let step=0;step<2;step++) {
      await expect(page.locator('#totp, #password-new').first()).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
      if(await page.locator('#password-new').isVisible()) {
        await page.locator('#password-new').fill('changed-pass-123');await page.locator('#password-confirm').fill('changed-pass-123');await page.locator('#kc-submit').click();
      } else {
        await expect(page.locator('#kc-totp-secret-qr-code')).toBeVisible();
        await page.locator('#mode-manual').click();
        const encoded=await page.locator('#kc-totp-secret-key').innerText();
        await page.locator('#totp').fill(totp(encoded));
        await page.locator('#userLabel').fill('Browser test');
        await page.locator('#saveTOTPBtn').click();
      }
    }
    await expect(page).toHaveURL(/\/callback\?[^#]*code=/);
  } finally {
    const result=await request.delete(location,{headers});expect(result.ok()).toBeTruthy();
  }
});

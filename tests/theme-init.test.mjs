import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const source = readFileSync('themes/goodui/login/resources/js/theme-init.js', 'utf8');
function run({query='', saved=null, dark=false, blocked=false}={}) {
  const classes = new Set();
  const events = {};
  const root = {dataset:{}, style:{}, classList:{toggle(k,on){on ? classes.add(k) : classes.delete(k);}}};
  const storage = new Map(saved ? [['goodui-keycloak-theme-mode',saved]] : []);
  const store = {getItem(k){if(blocked)throw Error();return storage.get(k);},setItem(k,v){if(blocked)throw Error();storage.set(k,v);}};
  const media = {matches:dark,addEventListener(k,fn){events.media=fn;}};
  const window = {location:{search:query,href:'https://login.example.test/auth?client_id=demo&state=abc'+query.replace('?','&')}, matchMedia:()=>media, history:{state:null,replaceState(s,t,u){window.location.href=u.href;}},addEventListener(k,fn){events[k]=fn;}};
  vm.runInNewContext(source,{window, document:{documentElement:root},localStorage:store,sessionStorage:store, URL, URLSearchParams});
  return {root,window,media,events,classes};
}
test('URL wins over saved and OS preference before first paint',()=>{
 const {root,classes}=run({query:'?theme_mode=light',saved:'dark',dark:true});
 assert.equal(root.dataset.theme,'light');assert.equal(root.style.colorScheme,'light');assert.equal(classes.has('pf-v5-theme-dark'),false);
});
test('dark works with blocked storage',()=>assert.equal(run({query:'?theme_mode=dark',blocked:true}).root.dataset.theme,'dark'));
test('invalid query cannot introduce arbitrary classes',()=>assert.equal(run({query:'?theme_mode=evil',saved:'dark'}).root.dataset.theme,'dark'));
test('system preference follows OS changes',()=>{
 const x=run({query:'?theme_mode=system',saved:'dark'});assert.equal(x.root.dataset.theme,'light');x.media.matches=true;x.events.media();assert.equal(x.root.dataset.theme,'dark');
});
test('explicit mode ignores OS changes',()=>{
 const x=run({query:'?theme_mode=dark'});x.media.matches=false;x.events.media();assert.equal(x.root.dataset.theme,'dark');
});
test('switching preserves OIDC parameters and synchronizes storage events',()=>{
 const x=run();x.window.gooduiTheme.set('dark');const u=new URL(x.window.location.href);assert.equal(u.searchParams.get('state'),'abc');assert.equal(u.searchParams.get('client_id'),'demo');assert.equal(u.searchParams.get('theme_mode'),'dark');x.events.storage({key:'goodui-keycloak-theme-mode',newValue:'light'});assert.equal(x.root.dataset.theme,'light');
});

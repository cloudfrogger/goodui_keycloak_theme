import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const source = readFileSync('themes/goodui/login/resources/js/theme-init.js', 'utf8');
function run({query='', saved=null, dark=false, blocked=false, pathname='/realms/goodui/login-actions/authenticate', tabStorage=new Map(), welcome=false}={}) {
  const classes = new Set();
  const events = {};
  const root = {dataset:{}, style:{setProperty(name,value){this[name]=value;}}, classList:{toggle(k,on){on ? classes.add(k) : classes.delete(k);}}};
  const storage = new Map(saved ? [['goodui-keycloak-theme-mode',saved]] : []);
  const store = {getItem(k){if(blocked)throw Error();return storage.get(k);},setItem(k,v){if(blocked)throw Error();storage.set(k,v);}};
  const tabStore = {getItem(k){if(blocked)throw Error();return tabStorage.get(k);},setItem(k,v){if(blocked)throw Error();tabStorage.set(k,v);},removeItem(k){if(blocked)throw Error();tabStorage.delete(k);}};
  const media = {matches:dark,addEventListener(k,fn){events.media=fn;}};
  const window = {location:{search:query,pathname,href:'https://login.example.test/auth?client_id=demo&state=abc'+query.replace('?','&')}, matchMedia:()=>media, history:{state:null,replaceState(s,t,u){window.location.href=u.href;}},addEventListener(k,fn){events[k]=fn;}};
  vm.runInNewContext(source,{window, document:{documentElement:root,currentScript:welcome ? {hasAttribute:()=>true} : null},localStorage:store,sessionStorage:tabStore, URL, URLSearchParams});
  return {root,window,media,events,classes,storage,tabStorage};
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

const colorKey='goodui-keycloak-theme-color:realm:goodui';
test('only six-digit hexadecimal colors enter fixed CSS variables',()=>{
 const x=run({query:'?theme_color=7C3AED'});
 assert.equal(x.root.dataset.themeColor,'7c3aed');
 assert.equal(x.root.style['--good-color-brand'],'#7c3aed');
 assert.equal(x.tabStorage.get(colorKey),'7c3aed');
 assert.equal(x.storage.has(colorKey),false);
});
test('CSS, URLs, HTML, fragments, shorthand and alpha colors are rejected',()=>{
 for(const input of ['red','#7c3aed','fff','12345678','7c3aed;display:none','url(https://example.test/a)','</style><script>alert(1)</script>','7c3aed\n',' 7c3aed','7c3aed/']) {
   const x=run({query:'?theme_color='+encodeURIComponent(input)});
   assert.equal(x.root.style['--good-color-brand'],undefined,input);
   assert.equal(x.root.dataset.themeColor,undefined,input);
   assert.equal(x.tabStorage.has(colorKey),false,input);
 }
});
test('stored colors are revalidated and invalid URL input cannot overwrite a valid preference',()=>{
 const tabStorage=new Map([[colorKey,'red;display:none']]);
 assert.equal(run({tabStorage}).root.style['--good-color-brand'],undefined);
 tabStorage.set(colorKey,'15803d');
 assert.equal(run({tabStorage,query:'?theme_color=javascript:alert(1)'}).root.style['--good-color-brand'],'#15803d');
});
test('color survives same-realm form navigation, is isolated by realm and resets explicitly',()=>{
 const first=run({query:'?theme_color=7c3aed'});
 const next=run({tabStorage:first.tabStorage});
 assert.equal(next.root.style['--good-color-brand'],'#7c3aed');
 assert.equal(run({tabStorage:first.tabStorage,pathname:'/realms/other/login'}).root.style['--good-color-brand'],undefined);
 const reset=run({tabStorage:first.tabStorage,query:'?theme_color=default'});
 assert.equal(reset.root.style['--good-color-brand'],undefined);
 assert.equal(first.tabStorage.has(colorKey),false);
});
test('admin and login pages of the same realm share only their tab preference',()=>{
 const first=run({pathname:'/auth/realms/master/login',query:'?theme_color=7c3aed'});
 assert.equal(run({pathname:'/auth/admin/master/console/',tabStorage:first.tabStorage}).root.style['--good-color-brand'],'#7c3aed');
 assert.equal(run().root.style['--good-color-brand'],undefined);
});
test('color remains usable when storage is blocked and never changes OIDC parameters',()=>{
 const x=run({query:'?theme_color=7c3aed',blocked:true});
 assert.equal(x.root.style['--good-color-brand'],'#7c3aed');
 x.window.gooduiTheme.set('dark');
 const u=new URL(x.window.location.href);
 assert.equal(u.searchParams.get('state'),'abc');
 assert.equal(u.searchParams.get('theme_color'),'7c3aed');
 assert.equal(x.root.dataset.themeColor,'7c3aed');
});
function luminance(hex) {
 const [r,g,b]=hex.match(/[0-9a-f]{2}/gi).map(x=>parseInt(x,16)/255).map(x=>x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4);
 return 0.2126*r+0.7152*g+0.0722*b;
}
function ratio(a,b) {const x=luminance(a),y=luminance(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05);}
test('button and hover text and light/dark links retain minimum contrast for extreme and intermediate colors',()=>{
 for(const color of ['000000','ffffff','ffff00','00ffff','777777','767676','ff0000','00ff00','0000ff','7c3aed','15803d','808080']) {
  for(const mode of ['light','dark']) {
   const {root}=run({query:'?theme_color='+color+'&theme_mode='+mode});
   assert.equal(root.style['--good-color-brand'],'#'+color);
   assert.ok(ratio(root.style['--good-brand-foreground'],'#'+color)>=4.5,color);
   assert.ok(ratio(root.style['--good-brand-foreground'],root.style['--good-brand-hover'])>=4.5,color);
   for(const background of mode==='dark'?['#09090b','#18181b']:['#ffffff','#f4f4f5']) assert.ok(ratio(root.style['--good-color-accent'],background)>=4.5,color);
  }
 }
});
test('system changes recalculate the accent without losing the requested primary color',()=>{
 const x=run({query:'?theme_color=000000&theme_mode=system'});
 assert.equal(x.root.style['--good-color-accent'],'#000000');
 x.media.matches=true;x.events.media();
 assert.notEqual(x.root.style['--good-color-accent'],'#000000');
 assert.equal(x.root.style['--good-color-brand'],'#000000');
});
test('welcome page handles the upstream trailing-slash redirect for a color parameter',()=>{
 const x=run({pathname:'/',query:'?theme_color=7c3aed/',welcome:true});
 assert.equal(x.root.style['--good-color-brand'],'#7c3aed');
});

test('a realm named welcome cannot share the server-wide welcome color',()=>{
 const x=run({pathname:'/realms/welcome/login',query:'?theme_color=7c3aed'});
 assert.equal(run({pathname:'/',welcome:true,tabStorage:x.tabStorage}).root.style['--good-color-brand'],undefined);
});

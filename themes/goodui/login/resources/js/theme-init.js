/* Runs synchronously in <head>, before stylesheets and first paint. */
(function () {
  'use strict';
  var key = 'goodui-keycloak-theme-mode';
  var root = document.documentElement;
  var media = window.matchMedia('(prefers-color-scheme: dark)');
  var params = new URLSearchParams(window.location.search);
  var requested = params.get('theme_mode');
  // Keycloak 26.8.2 root redirect may append '/' to the last query value.
  if (document.currentScript && document.currentScript.hasAttribute('data-goodui-welcome') && /^(light|dark|system)\/$/.test(requested)) {
    requested = requested.slice(0, -1);
  }
  var valid = function (value) { return ['light', 'dark', 'system'].indexOf(value) !== -1; };
  var mode = 'system';
  var hasSaved = false;
  try { var stored = localStorage.getItem(key); if (valid(stored)) { mode = stored; hasSaved = true; } } catch (_) {}
  if (valid(requested)) {
    mode = requested;
    try { localStorage.setItem(key, mode); } catch (_) {}
  } else if (!hasSaved) {
    // A tab-local fallback preserves the flow when persistent storage is blocked.
    try { var tab = sessionStorage.getItem(key); if (valid(tab)) mode = tab; } catch (_) {}
  }
  // Color is cosmetic, tab-local, and isolated by realm. Never accept CSS text.
  var realmPath = window.location.pathname.match(/(?:^|\/)(?:realms|admin)\/([^/]+)/);
  var colorKey = 'goodui-keycloak-theme-color:' + (realmPath ? 'realm:' + realmPath[1] : 'welcome');
  var color = null;
  var requestedColor = params.get('theme_color');
  if (document.currentScript && document.currentScript.hasAttribute('data-goodui-welcome') && /^(?:[0-9a-fA-F]{6}|default)\/$/.test(requestedColor)) {
    requestedColor = requestedColor.slice(0, -1);
  }
  function validColor(value) { return typeof value === 'string' && /^[0-9a-fA-F]{6}$/.test(value); }
  try { var savedColor = sessionStorage.getItem(colorKey); if (validColor(savedColor)) color = savedColor.toLowerCase(); } catch (_) {}
  if (requestedColor === 'default') {
    color = null;
    try { sessionStorage.removeItem(colorKey); } catch (_) {}
  } else if (validColor(requestedColor)) {
    color = requestedColor.toLowerCase();
    try { sessionStorage.setItem(colorKey, color); } catch (_) {}
  }
  function luminance(rgb) {
    return rgb.reduce(function (sum, channel, index) {
      var value = channel / 255;
      return sum + (value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4)) * [0.2126, 0.7152, 0.0722][index];
    }, 0);
  }
  function contrast(a, b) { return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05); }
  function mix(rgb, target, amount) { return rgb.map(function (value, index) { return Math.round(value + (target[index] - value) * amount); }); }
  function hex(rgb) { return '#' + rgb.map(function (value) { return value.toString(16).padStart(2, '0'); }).join(''); }
  function accent(rgb, dark) {
    // Selected surfaces are the lower-contrast standard GoodUI backgrounds.
    var background = luminance(dark ? [24, 24, 27] : [244, 244, 245]);
    var target = dark ? [255, 255, 255] : [0, 0, 0];
    for (var step = 0; step < 10 && contrast(luminance(rgb), background) < 4.5; step++) rgb = mix(rgb, target, 0.2);
    return hex(rgb);
  }
  function applyColor(dark) {
    if (!color) return;
    var rgb = color.match(/../g).map(function (value) { return parseInt(value, 16); });
    var whiteText = contrast(luminance(rgb), 1) >= contrast(luminance(rgb), 0);
    root.dataset.themeColor = color;
    root.style.setProperty('--good-color-brand', '#' + color);
    root.style.setProperty('--good-brand-foreground', whiteText ? '#ffffff' : '#000000');
    root.style.setProperty('--good-brand-hover', hex(mix(rgb, whiteText ? [0, 0, 0] : [255, 255, 255], 0.15)));
    root.style.setProperty('--good-color-accent', accent(rgb, dark));
  }
  function apply(value) {
    mode = value;
    var dark = value === 'dark' || (value === 'system' && media.matches);
    root.dataset.theme = dark ? 'dark' : 'light';
    root.dataset.themeMode = value;
    root.classList.toggle('pf-v5-theme-dark', dark);
    root.style.colorScheme = dark ? 'dark' : 'light';
    applyColor(dark);
    try { sessionStorage.setItem(key, value); } catch (_) {}
  }
  apply(mode);
  window.gooduiTheme = {
    set: function (value) {
      if (!valid(value)) return;
      try { localStorage.setItem(key, value); } catch (_) {}
      // Replace only this parameter, keeping all OIDC/session parameters intact.
      var url = new URL(window.location.href);
      url.searchParams.set('theme_mode', value);
      window.history.replaceState(window.history.state, '', url);
      apply(value);
    }
  };
  media.addEventListener('change', function () { if (mode === 'system') apply(mode); });
  window.addEventListener('storage', function (event) {
    if (event.key === key) apply(valid(event.newValue) ? event.newValue : 'system');
  });
}());

/* Runs synchronously in <head>, before stylesheets and first paint. */
(function () {
  'use strict';
  var key = 'goodui-keycloak-theme-mode';
  var root = document.documentElement;
  var media = window.matchMedia('(prefers-color-scheme: dark)');
  var requested = new URLSearchParams(window.location.search).get('theme_mode');
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
  function apply(value) {
    mode = value;
    var dark = value === 'dark' || (value === 'system' && media.matches);
    root.dataset.theme = dark ? 'dark' : 'light';
    root.dataset.themeMode = value;
    root.classList.toggle('pf-v5-theme-dark', dark);
    root.style.colorScheme = dark ? 'dark' : 'light';
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

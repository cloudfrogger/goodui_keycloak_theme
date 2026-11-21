document.addEventListener('DOMContentLoaded', function () {
  var select = document.getElementById('goodui-theme-mode');
  if (!select || !window.gooduiTheme) return;
  select.value = document.documentElement.dataset.themeMode;
  select.addEventListener('change', function () { window.gooduiTheme.set(select.value); });
  window.addEventListener('storage', function () { select.value = document.documentElement.dataset.themeMode; });
});

<#macro content>
  <footer class="goodui-footer">
    <label for="goodui-theme-mode">${msg("gooduiAppearance")}</label>
    <select id="goodui-theme-mode" aria-label="${msg('gooduiAppearance')}">
      <option value="system">${msg("gooduiSystem")}</option>
      <option value="light">${msg("gooduiLight")}</option>
      <option value="dark">${msg("gooduiDark")}</option>
    </select>
  </footer>
</#macro>

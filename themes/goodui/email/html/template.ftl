<#-- Content and security-sensitive action links remain upstream. -->
<#macro emailLayout>
<!doctype html>
<html lang="${locale.language}" dir="${(ltr)?then('ltr','rtl')}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark">
<style>
a { color: ${properties.brandColor!'#2563eb'}; }
@media (prefers-color-scheme: dark) {
  body, .goodui-email { background-color: #09090b !important; color: #fafafa !important; }
  .goodui-email { border-color: #27272a !important; }
  a { color: #60a5fa !important; }
}
</style></head>
<body style="margin:0;padding:32px 16px;background-color:#ffffff;color:#09090b;font-family:Inter,Arial,sans-serif;font-size:14px;line-height:1.6">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" class="goodui-email" width="100%" cellpadding="28" cellspacing="0" style="max-width:560px;border:1px solid #e4e4e7;border-radius:12px;background-color:#ffffff;color:#09090b"><tr><td>
<#if properties.logoUrl?has_content><p style="margin:0 0 24px"><img src="${properties.logoUrl}" alt="${realmName}" width="184" style="max-width:100%;height:auto"></p></#if>
<p style="margin:0 0 24px;font-size:20px;font-weight:bold">${realmName}</p>
<#nested>
</td></tr></table>
</td></tr></table></body></html>
</#macro>

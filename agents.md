# Working guidelines for this repository

- Goal: provide complete native Keycloak themes that match the visual style of https://goodui.cloudfrogger.com. Keep Keycloak's authentication flows and native templates rather than building an Angular application or a replacement authentication flow.
- Supported and locally verified baseline: Keycloak 26.8.2. Login extends `keycloak.v2`, Account extends `keycloak.v3`, Admin extends `keycloak.v2`, and Email and Welcome extend `keycloak`.
- Preserve original form templates, authentication actions, translations, CSRF/OIDC parameters, accessibility, and Keycloak JavaScript. Override layout and branding only. Record upstream sources in NOTICE.
- Load `theme-init.js` synchronously in the document head before every stylesheet. Do not add async/defer/module attributes or restore the competing upstream system preference script.
- For `theme_mode=light|dark|system`, a valid URL value takes precedence over saved preferences, then the system preference. Never insert unchecked URL values into HTML or CSS. Handle browser storage errors and preserve all OIDC and session parameters when switching modes.
- Accept URL primary colors only through `theme_color` as exactly six hexadecimal digits without `#`, or `default` to reset. Revalidate stored colors, use fixed CSS property names, and keep the override in realm-scoped sessionStorage. Never accept arbitrary CSS, URLs, or HTML. Preserve the initializer's early execution and verify contrast on standard light/dark surfaces.
- Canonical web resources are in `themes/goodui/login/resources/`. Run `python3 scripts/sync-resources.py` after changes and version the synchronized files. Edit branding in `css/brand.css` and logos in `img/`.
- Emails use inline styles and separate dark mode rules. Check rendering in actual email clients as well. Do not assume email clients support URL appearance parameters or browser storage.
- After functional changes, run `npm test`, `npm run build`, and `npm run test:e2e` against the local test instance. Browser checks must cover light/dark modes, form errors, registration, password resets, real sign-in, consoles, and mobile widths. Report hardware passkey and actual email delivery checks separately.
- Browser tests modify only the local demo instance from compose.yaml. Never run them against production Keycloak servers.
- When upgrading Keycloak, compare the overridden layouts with the new upstream version and repeat all browser tests. Do not claim compatibility with untested versions.
- Demo credentials are local examples only. Never commit production secrets or realm exports containing real users.
- Keep the README and screenshots current. Preserve unrelated changes. Do not make additional commits or pushes without an instruction to do so; the original creation request explicitly authorized the initial publication.

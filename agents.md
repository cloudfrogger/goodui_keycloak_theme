# Arbeitsregeln für dieses Repository

- Ziel: vollständige native Keycloak-Themes im visuellen Stil von https://goodui.cloudfrogger.com; keine Angular-Anwendung und kein nachgebauter Authentifizierungsablauf.
- Unterstützte und lokal geprüfte Basis: Keycloak 26.8.2. Login erbt `keycloak.v2`, Account `keycloak.v3`, Admin `keycloak.v2`, E-Mail und Welcome `keycloak`.
- Originale Formular-Templates, Authentifizierungsaktionen, Übersetzungen, CSRF-/OIDC-Parameter, Accessibility und Keycloak-JavaScript erhalten. Nur Layout und Branding überschreiben. Upstream-Herkunft in NOTICE pflegen.
- Die synchron geladene `theme-init.js` muss im Head vor sämtlichen Stylesheets stehen. Keine async/defer/module-Attribute. Den konkurrierenden Upstream-Systemmodus nicht erneut hinzufügen.
- `theme_mode=light|dark|system`: gültiger URL-Wert vor gespeicherter Präferenz vor System. Keine ungeprüften URL-Werte in HTML/CSS einsetzen. Fehler bei Browser-Speicherzugriff abfangen. OIDC- und Sessionparameter beim Umschalten vollständig erhalten.
- Kanonische Web-Ressourcen liegen in `themes/goodui/login/resources/`. Nach Änderungen `python3 scripts/sync-resources.py` ausführen; die synchronisierten Dateien mit versionieren. Branding in `css/brand.css`, Logos in `img/`.
- E-Mails verwenden Inline-Stile und eigene Darkmode-Regeln; ihre Darstellung zusätzlich in tatsächlichen Mailclients prüfen. Niemals URL-Modi oder Browser-Speicher in E-Mails voraussetzen.
- Nach funktionalen Änderungen `npm test`, `npm run build` sowie mit lokaler Testinstanz `npm run test:e2e` ausführen. Browserprüfungen müssen Hell/Dunkel, Formularfehler, Registrierung, Passwortreset, echte Anmeldung, Konsolen und mobile Breite abdecken. Hardware-Passkeys und tatsächliche E-Mail-Zustellung separat ausweisen.
- Browsertests verändern ausschließlich die lokale Demo-Instanz aus compose.yaml; niemals gegen produktive Keycloak-Server ausführen.
- Bei Keycloak-Upgrades die überschriebenen Layouts mit dem neuen Upstream vergleichen und sämtliche Browsertests wiederholen. Nicht ungeprüft Kompatibilität mit anderen Versionen behaupten.
- Demo-Zugangsdaten sind ausschließlich lokale Beispieldaten. Keine produktiven Geheimnisse oder Realm-Exporte mit echten Benutzern einchecken.
- README und Screenshots aktuell halten. Unabhängige Änderungen bewahren. Keine weiteren Commits/Pushes ohne Auftrag; die initiale Veröffentlichung ist im Erstellungsauftrag ausdrücklich freigegeben.

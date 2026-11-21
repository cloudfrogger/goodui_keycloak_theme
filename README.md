# GoodUI Keycloak Theme

![GoodUI für Keycloak: Anmeldung in Hell und Dunkel, Registrierung, Konto, Administration und mobile Ansicht](docs/theme-collage.png)

Native Keycloak-Themes im Stil von [GoodUI](https://goodui.cloudfrogger.com): klare Flächen, blaue Akzente, feine Rahmen und gerundete Bedienelemente. Hell, Dunkel und automatische Systemauswahl. Ohne Angular, zusätzliche Keycloak-Erweiterung oder externe Webfonts.

**Entdecke das Designsystem hinter dem Theme: [goodui.cloudfrogger.com](https://goodui.cloudfrogger.com) — mit weiteren Informationen zu GoodUI und seinen Komponenten.**

## Umfang und Basis

Entwickelt und lokal getestet mit **Keycloak 26.8.2**. Die originalen Keycloak-Themes werden erweitert; Authentifizierungsabläufe und React-Konsolen bleiben Keycloak-Code.

| Bereich | Eltern-Theme | Anpassung |
| --- | --- | --- |
| Login | `keycloak.v2` | Gemeinsames Layout, GoodUI-Bedienelemente, Logos, Modusauswahl |
| Konto | `keycloak.v3` | Originale Account Console, GoodUI-Farben, Logos und Darkmode |
| Administration | `keycloak.v2` | Originale Admin Console mit GoodUI-Branding |
| E-Mail | `keycloak` | Gemeinsames HTML-Layout, Inline-Stile und Darkmode nach Mailclient |
| Willkommen | `keycloak` | Originale Willkommensseite mit GoodUI-Branding |

Das Login-Layout gilt für alle geerbten Seiten, darunter Anmeldung, Registrierung, Passwortreset/-änderung, E-Mail-Verifikation, OTP/MFA, Wiederherstellungscodes, Passkeys/WebAuthn, Identity Provider, Zustimmungs-, Fehler- und Informationsseiten. Bestehende Übersetzungen und Plaintext-E-Mails werden geerbt. Für den zusätzlichen Moduswähler sind Deutsch und Englisch enthalten; weitere Übersetzungen können in `login/messages/` ergänzt werden.

Die Account- und Admin-Konsole behalten Aufbau, Navigation und Funktionen des Originals. Ihre visuelle Anpassung erfolgt über CSS, nicht über einen eigenen React-Build. Herkunft und Version der überschriebenen Layouts stehen in [NOTICE](NOTICE). Grundlagen: [Keycloak Theme-Dokumentation](https://www.keycloak.org/ui-customization/themes), [Keycloak-Quellcode](https://github.com/keycloak/keycloak/tree/26.8.2).

## Lokal ausprobieren

Voraussetzungen: Docker mit Compose. Node.js 20+ und Python 3 werden nur für Tests beziehungsweise Paketbau benötigt.

```sh
docker compose up -d
```

Nach dem ersten Start:

- [Login, hell](http://localhost:8089/realms/goodui/protocol/openid-connect/auth?client_id=theme-preview&redirect_uri=http%3A%2F%2Flocalhost%3A8089%2Fcallback&response_type=code&scope=openid&theme_mode=light)
- [Login, dunkel](http://localhost:8089/realms/goodui/protocol/openid-connect/auth?client_id=theme-preview&redirect_uri=http%3A%2F%2Flocalhost%3A8089%2Fcallback&response_type=code&scope=openid&theme_mode=dark)
- [Konto](http://localhost:8089/realms/goodui/account/?theme_mode=dark): `demo` / `demo-change-me`
- [Administration](http://localhost:8089/admin/): `admin` / `local-admin-change-me`
- [Willkommensseite](http://localhost:8089/?theme_mode=dark)

Der Demo-Client zeigt nach erfolgreicher Anmeldung auf `/callback`; dort gibt es keine Demo-Anwendung. Die vollständige Anmeldung lässt sich über die Account Console ausprobieren.

Die Instanz lauscht ausschließlich auf `127.0.0.1:8089`. Zugangsdaten, H2-Datenbank und abgeschaltete Theme-Caches sind für lokale Entwicklung gedacht. `docker compose down` entfernt diese lokale Instanz einschließlich ihrer im Container gespeicherten Änderungen. Der Demo-Realm wird beim nächsten Start neu importiert. Bereits importierte Realms werden bei einem einfachen Neustart nicht überschrieben.

## Installation auf einem Keycloak-Server

### Verzeichnisinstallation

`themes/goodui` vollständig nach `/opt/keycloak/themes/goodui` kopieren oder als schreibgeschütztes Volume einhängen:

```yaml
volumes:
  - ./themes/goodui:/opt/keycloak/themes/goodui:ro
```

Danach unter **Realm Settings → Themes** für Login, Account, Admin und Email jeweils `goodui` auswählen. Jede Auswahl ist unabhängig. Für das Branding der Master-Administration auch im Realm `master` das Admin-Theme setzen; dessen Login-Theme bestimmt die Administrator-Anmeldeseite.

Die Willkommensseite wird serverweit aktiviert:

```sh
/opt/keycloak/bin/kc.sh start --spi-theme--welcome-theme=goodui
```

### JAR oder ZIP bauen

```sh
python3 scripts/sync-resources.py
python3 scripts/build.py
```

Der Paketbau synchronisiert die Web-Ressourcen ebenfalls automatisch. Erzeugt ohne Java-/Maven-Build:

- `dist/goodui-keycloak-theme.jar`: nach `/opt/keycloak/providers/` kopieren, anschließend `kc.sh build` ausführen und Keycloak neu starten. In einem optimierten Container das JAR **vor** dessen Build-Schritt hinzufügen.
- `dist/goodui-keycloak-theme.zip`: nach `/opt/keycloak/themes/` entpacken; enthält den Ordner `goodui/`.

Nur eine Installationsvariante für denselben Theme-Namen einsetzen. In Produktion die Standard-Caches aktiv lassen. Nach Austausch gecachter Theme-Ressourcen Keycloak neu starten und gegebenenfalls den Theme-Gzip-Cache der betroffenen Instanz erneuern. CI stellt beide Pakete als Workflow-Artefakte bereit.

## Keycloak mit Docker betreiben

### Theme in einen bestehenden Container einbinden

Dieses Repository auf dem Docker-Host auschecken. Das Theme liegt anschließend unter `themes/goodui`. Nach eigenen Branding-Änderungen zuerst `python3 scripts/sync-resources.py` ausführen.

In der vorhandenen Compose-Datei des Keycloak-Dienstes das Theme-Verzeichnis ergänzen:

```yaml
services:
  keycloak:
    # Vorhandenes Image, Datenbank, Umgebungsvariablen und Ports beibehalten.
    volumes:
      - ./goodui_keycloak_theme/themes/goodui:/opt/keycloak/themes/goodui:ro
```

Der linke Pfad ist relativ zur Compose-Datei. Bei einer anderen Ablage entsprechend einen absoluten Host-Pfad verwenden. Rechts muss genau `/opt/keycloak/themes/goodui` stehen: Darin liegen unmittelbar `login/`, `account/`, `admin/`, `email/` und `welcome/`. Das zusätzliche Volume ergänzt vorhandene Volumes, insbesondere für Daten; es ersetzt sie nicht. Nur diesen Theme-Unterordner mounten, nicht das gesamte Verzeichnis `/opt/keycloak/themes`.

Den betroffenen Dienst mit der ergänzten Konfiguration neu erstellen:

```sh
docker compose up -d keycloak
docker compose exec keycloak ls /opt/keycloak/themes/goodui
```

Anschließend im gewünschten Realm unter **Realm Settings → Themes** `goodui` aktivieren. Die Montage allein ändert das ausgewählte Theme nicht. Die optional angepasste Willkommensseite erfordert zusätzlich das Startargument `--spi-theme--welcome-theme=goodui`; die übrigen vorhandenen Startargumente beibehalten.

### Eigenständiges Docker-Beispiel zum Ausprobieren

Aus dem Stammverzeichnis dieses Repositorys:

```sh
docker run --rm --name keycloak-goodui-demo \
  -p 127.0.0.1:8091:8080 \
  -e KC_BOOTSTRAP_ADMIN_USERNAME=admin \
  -e KC_BOOTSTRAP_ADMIN_PASSWORD=local-admin-change-me \
  --mount "type=bind,source=$(pwd)/themes/goodui,target=/opt/keycloak/themes/goodui,readonly" \
  --mount "type=bind,source=$(pwd)/dev/realm.json,target=/opt/keycloak/data/import/goodui-realm.json,readonly" \
  quay.io/keycloak/keycloak:26.8.2 \
  start-dev --import-realm --spi-theme--welcome-theme=goodui
```

Danach [http://localhost:8091/realms/goodui/account/?theme_mode=dark](http://localhost:8091/realms/goodui/account/?theme_mode=dark) öffnen und mit `demo` / `demo-change-me` anmelden. Der importierte Demo-Realm verwendet das Theme bereits. Der Beispiel-Client `theme-preview` bleibt auf Port 8089 konfiguriert; für dieses Beispiel deshalb die Account Console verwenden. Beim Stoppen wird der Demo-Container entfernt; seine Daten sind nicht dauerhaft gespeichert. Für den regulären Betrieb die bestehende Datenbank und Serverkonfiguration verwenden.

### Fertiges Image von Docker Hub verwenden

Das vollständige Keycloak-Image mit eingebautem Theme ist auf [Docker Hub: cloudfrogger/goodui-keycloak-theme](https://hub.docker.com/r/cloudfrogger/goodui-keycloak-theme) verfügbar:

```sh
docker pull cloudfrogger/goodui-keycloak-theme:26.8.2
```

Enthalten sind Keycloak **26.8.2**, das Theme-JAR, ein abgeschlossener Keycloak-Build für **PostgreSQL** sowie aktivierte Health- und Metrics-Endpunkte. Standardmäßig startet das Image mit `start --optimized` und der GoodUI-Willkommensseite. Es enthält keine Benutzer, Demo-Passwörter oder Datenbank. Plattform: **linux/amd64**.

| Image-Tag | Bedeutung |
| --- | --- |
| `latest` | Letzter erfolgreicher Build von `main` |
| `26.8.2` | Letzter erfolgreicher `main`-Build für diese Keycloak-Version |
| `sha-<vollständiger-Commit>` | Eindeutige Build-Version für reproduzierbare Deployments |
| `0.1.0` bei Git-Tag `v0.1.0` | Version des Themes; wird bei einem entsprechenden Release-Tag erzeugt |

`latest` und `26.8.2` werden bei neuen erfolgreichen Builds aktualisiert. Zum Festschreiben einer konkreten Version den Commit-Tag oder Image-Digest verwenden; veröffentlichte Tags stehen in der GitHub-Workflow-Zusammenfassung und auf Docker Hub.

Ein vollständiges Compose-Beispiel mit dauerhaft gespeicherter PostgreSQL-Datenbank liegt in [compose.hub.yaml](compose.hub.yaml):

```sh
cp .env.example .env
# In .env beide Beispiel-Passwörter durch eigene Passwörter ersetzen.
docker compose -p goodui-hub -f compose.hub.yaml up -d
docker compose -p goodui-hub -f compose.hub.yaml logs -f keycloak
```

Falls bereits eine `.env` existiert, die benötigten Werte aus [.env.example](.env.example) ergänzen, statt die Datei zu ersetzen. Anschließend [http://localhost:8091/admin/](http://localhost:8091/admin/) öffnen und das Theme im gewünschten Realm aktivieren. Das Beispiel importiert keine Demo-Benutzer. Die Datenbank liegt im benannten Volume `goodui-hub_goodui-postgres-data` und bleibt bei einem normalen `docker compose down` erhalten.

Bei einer bereits vorhandenen PostgreSQL-Installation genügt es, das Image des bestehenden Keycloak-Dienstes auf `cloudfrogger/goodui-keycloak-theme:26.8.2` zu setzen, `start --optimized` zu verwenden und die bestehende Datenbank-/Secret-Konfiguration beizubehalten. Ein Theme-Volume ist dann nicht mehr erforderlich. Für öffentliche Installationen Hostname sowie TLS-/Proxy-Konfiguration an die eigene Umgebung anpassen; das Compose-Beispiel lauscht lokal auf Port 8091.

### Eigenes Image mit eigenem Branding bauen

Der mitgelieferte [Dockerfile](Dockerfile) baut das Theme direkt aus den Quellen, nimmt das JAR vor `kc.sh build` in Keycloak auf und erzeugt das optimierte Laufzeit-Image. Auf dem Docker-Host sind dafür weder Python noch Node.js oder ein vorhandenes `dist/`-Verzeichnis nötig:

```sh
docker build -t my-keycloak-goodui:26.8.2 .
```

Nach Änderungen an Farben oder Logos reicht ein erneuter Image-Build. Für eine andere Datenbank `KC_DB` in den beiden Keycloak-Stufen des Dockerfiles anpassen und neu bauen. Zugangsdaten erst beim Start übergeben. Der Docker-Build-Kontext enthält ausschließlich Theme- und Build-Dateien; `.env`, Git-Daten, Demo-Realm und Screenshots werden ausgeschlossen. Grundlage ist die [offizielle Container-Dokumentation von Keycloak](https://www.keycloak.org/server/containers).

### Automatischer Build und Push zu Docker Hub

Der [GitHub-Workflow](.github/workflows/check.yml) prüft zuerst Theme und Browserabläufe. Danach baut er das vollständige Docker-Image und testet es mit PostgreSQL im optimierten Startmodus; dabei wird kein Theme-Verzeichnis eingebunden. Erst nach erfolgreichen Browserprüfungen wird **genau dieses getestete Image** zu Docker Hub gepusht.

- Push auf `main`: Veröffentlichung als `latest`, `26.8.2` und `sha-<Commit>`.
- Push eines Git-Tags wie `v0.1.0`: Veröffentlichung als `0.1.0` und `sha-<Commit>`; `latest` wird dabei nicht geändert.
- Pull Requests und andere Branches: Build und Tests ohne Docker-Hub-Push.
- Manueller Workflow-Start auf `main`: ebenfalls Build, Tests und Veröffentlichung.

Die Anmeldung wird in den GitHub-Repository-Einstellungen unter **Settings → Secrets and variables → Actions** konfiguriert: Repository-Variable `DOCKERHUB_USERNAME` und Repository-Secret `DOCKERHUB_TOKEN` mit Schreibzugriff auf das Ziel-Image. Für dieses Repository ist die Anmeldung eingerichtet. In einem Fork zusätzlich `DOCKERHUB_IMAGE` im Workflow auf das eigene Docker-Hub-Repository setzen. Die Einrichtung folgt dem [Docker-Workflow für GitHub Actions](https://docs.docker.com/build/ci/github-actions/push-multi-registries/).

Die Image-Prüfungen lassen sich lokal in einer getrennten Testinstanz wiederholen:

```sh
docker build -t goodui-keycloak-theme:test .
docker compose -p goodui-image-test -f compose.image-test.yaml up -d
# Warten, bis Keycloak vollständig gestartet ist.
KEYCLOAK_BASE_URL=http://localhost:8092 npm run test:e2e
docker compose -p goodui-image-test -f compose.image-test.yaml down -v
```

`compose.image-test.yaml` verwendet ausschließlich lokale Demo-Zugangsdaten und einen separaten Test-Stack. Das abschließende `down -v` entfernt dessen Testdatenbank. Die Testinstanz darf keine produktive Datenbank verwenden.

## Keycloak mit YAML unter Kubernetes betreiben

### Bestehendes Keycloak-Deployment erweitern

Das fertige Docker-Hub-Image enthält das Theme bereits. Wenn das bestehende Deployment ebenfalls Keycloak 26.8.2 mit PostgreSQL verwendet, im Deployment dessen Keycloak-Image durch die eigene Image-Version ersetzen. Vorhandene Datenbank, Secrets, Services und Ingress-Konfiguration behalten. Die bestehenden Build-Optionen und Erweiterungen ebenfalls in das eigene Image übernehmen, falls das bisherige Image solche enthält.

Ein Imagewechsel allein erfordert keinen Realm-Import und keine neue Datenbank. Nach dem Rollout im jeweiligen Realm das Theme `goodui` auswählen. Bei Betrieb über einen Keycloak-Operator oder Helm das Image in der zugehörigen Custom Resource beziehungsweise den Helm-Values setzen, damit der Controller die Änderung nicht zurücksetzt.

Ein Docker-Host-Pfad wie `./themes/goodui` lässt sich nicht direkt als Kubernetes-Volume verwenden. Das eingebaute Theme im Image ist auf jedem Node und in jedem Pod vorhanden; dafür ist weder `hostPath` noch ein zusätzliches Persistent Volume erforderlich. Die Datenbank benötigt unabhängig davon ihre eigene dauerhafte Speicherung.

### Beispiel: Deployment, Secret, Service und TLS-Ingress

Vorausgesetzt sind eine erreichbare PostgreSQL-Datenbank, ein installierter Ingress-Controller und ein TLS-Secret für den öffentlichen Hostnamen. Das öffentliche Image wird direkt von Docker Hub geladen; eine eigene Registry ist dafür nicht nötig. Das Beispiel verwendet einen einzelnen Keycloak-Pod und bildet keinen HA-Cluster ab.

Die folgenden Platzhalter an die eigene Umgebung anpassen und den Block als `keycloak-goodui.yaml` speichern:

- Image `cloudfrogger/goodui-keycloak-theme:26.8.2` oder einen konkreten Commit-Tag aus Docker Hub verwenden.
- Hostname `login.example.org`, Ingress-Klasse `nginx` und TLS-Secret `keycloak-tls`.
- JDBC-Adresse und Zugangsdaten in `keycloak-runtime`. Die PostgreSQL-Datenbank muss bereits existieren.
- Die Bootstrap-Admin-Daten dienen der Ersteinrichtung einer neuen Instanz. Bei einem vorhandenen Admin-Konto gelten weiterhin dessen Zugangsdaten.

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: identity
---
apiVersion: v1
kind: Secret
metadata:
  name: keycloak-runtime
  namespace: identity
type: Opaque
stringData:
  KC_DB_URL: jdbc:postgresql://postgres.database.svc.cluster.local:5432/keycloak
  KC_DB_USERNAME: keycloak
  KC_DB_PASSWORD: REPLACE_WITH_DATABASE_PASSWORD
  KC_BOOTSTRAP_ADMIN_USERNAME: admin
  KC_BOOTSTRAP_ADMIN_PASSWORD: REPLACE_WITH_INITIAL_ADMIN_PASSWORD
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: keycloak
  namespace: identity
spec:
  replicas: 1
  strategy:
    type: Recreate
  selector:
    matchLabels:
      app: keycloak
  template:
    metadata:
      labels:
        app: keycloak
    spec:
      terminationGracePeriodSeconds: 60
      containers:
        - name: keycloak
          image: cloudfrogger/goodui-keycloak-theme:26.8.2
          args:
            - start
            - --optimized
            - --spi-theme--welcome-theme=goodui
          envFrom:
            - secretRef:
                name: keycloak-runtime
          env:
            - name: KC_HOSTNAME
              value: https://login.example.org
            # HTTPS endet am Ingress; dessen Verbindung zu Keycloak nutzt HTTP.
            - name: KC_HTTP_ENABLED
              value: "true"
            - name: KC_PROXY_HEADERS
              value: xforwarded
          ports:
            - name: http
              containerPort: 8080
            - name: management
              containerPort: 9000
          startupProbe:
            httpGet:
              path: /health/started
              port: management
            periodSeconds: 5
            failureThreshold: 60
          readinessProbe:
            httpGet:
              path: /health/ready
              port: management
            periodSeconds: 10
          livenessProbe:
            httpGet:
              path: /health/live
              port: management
            periodSeconds: 10
          resources:
            requests:
              cpu: 500m
              memory: 512Mi
            limits:
              cpu: "2"
              memory: 1Gi
---
apiVersion: v1
kind: Service
metadata:
  name: keycloak
  namespace: identity
spec:
  selector:
    app: keycloak
  ports:
    - name: http
      port: 80
      targetPort: http
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: keycloak
  namespace: identity
spec:
  ingressClassName: nginx
  tls:
    - hosts:
        - login.example.org
      secretName: keycloak-tls
  rules:
    - host: login.example.org
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: keycloak
                port:
                  name: http
```

Das TLS-Secret muss im Namespace `identity` liegen. Bei einer privaten Registry zusätzlich ein vorhandenes Pull-Secret über `spec.template.spec.imagePullSecrets` am Deployment referenzieren. Die Datei mit echten Kennwörtern nicht ins Git-Repository übernehmen; vorhandene Secret-Verwaltung kann das gezeigte Secret ersetzen.

Der Ingress muss `X-Forwarded-*`-Header selbst korrekt setzen und eingehende gleichnamige Header überschreiben. Der Pod-Zugriff ist im Zielcluster passend auf Ingress und interne Verwaltungszugriffe einzuschränken. Der Service veröffentlicht ausschließlich den Anwendungsport; Port 9000 für Health/Metrics wird nicht über den Ingress freigegeben. Für andere TLS-/Proxy-Setups die Einstellungen anhand der [Keycloak-Proxy-Dokumentation](https://www.keycloak.org/server/reverseproxy) anpassen. Die Probe-Endpunkte sind in der [Keycloak-Health-Dokumentation](https://www.keycloak.org/observability/health) beschrieben.

Nach Anpassung der Platzhalter und Bereitstellung der Datenbank sowie des TLS-Secrets:

```sh
kubectl apply -f keycloak-goodui.yaml
kubectl -n identity rollout status deployment/keycloak
kubectl -n identity logs deployment/keycloak
kubectl -n identity exec deployment/keycloak -- ls /opt/keycloak/providers/
```

### Theme aktivieren und aktualisieren

Nach dem Start `https://login.example.org/admin/` öffnen. Im jeweiligen Realm unter **Realm Settings → Themes** für Login, Account, Admin und Email `goodui` auswählen und speichern. Für die Master-Administration die Auswahl im Realm `master` vornehmen. Die Willkommensseite wird durch das Startargument des Deployment-Beispiels aktiviert.

Bei automatisierter Realm-Provisionierung können diese Felder in der bestehenden Realm-Konfiguration gesetzt werden:

```json
{
  "loginTheme": "goodui",
  "accountTheme": "goodui",
  "adminTheme": "goodui",
  "emailTheme": "goodui"
}
```

Das ist ein Konfigurationsausschnitt, kein vollständiger Realm-Import. Für einen bestehenden Realm die Felder über die Admin-Konsole oder Admin-API aktualisieren; ein erneuter Start mit `--import-realm` überschreibt vorhandene Realms nicht.

Nach Änderungen an Farben, Logos oder Templates baut und veröffentlicht der Workflow das aktualisierte Image. Anschließend den neuen **Commit-Tag** aus der Workflow-Zusammenfassung in der YAML-Datei einsetzen; bei eigenen Builds einen neuen Image-Tag vergeben. Anschließend erneut `kubectl apply` und `kubectl rollout status` ausführen. So erhalten alle Pods dieselben Ressourcen, und Theme-Caches werden mit dem neuen Prozess neu aufgebaut. Bei `Recreate` entsteht während eines Updates eine Unterbrechung; für Hochverfügbarkeit ein entsprechend konfiguriertes Keycloak-Cluster-Deployment verwenden.

## Hell-/Dunkelmodus ohne Aufblitzen

Die Anwendung hängt `theme_mode` an die **Keycloak-Autorisierungs-URL** an:

```text
https://login.example.org/realms/my-realm/protocol/openid-connect/auth
  ?client_id=my-app
  &redirect_uri=https%3A%2F%2Fapp.example.org%2Fcallback
  &response_type=code
  &scope=openid
  &theme_mode=dark
```

In der tatsächlichen URL werden keine Zeilenumbrüche oder Einrückungen verwendet.

| Wert | Verhalten |
| --- | --- |
| `light` | Helles Theme, unabhängig vom Betriebssystem |
| `dark` | Dunkles Theme, unabhängig vom Betriebssystem |
| `system` | Systempräferenz; reagiert auf Änderungen des Betriebssystems |
| Fehlt oder ungültig | Gespeicherte Auswahl, sonst Systempräferenz |

`theme-init.js` steht als **synchrones klassisches Script im Head vor allen Stylesheets**. Es setzt `data-theme`, die PatternFly-Darkmode-Klasse und `color-scheme`, bevor die Seite gerendert wird. Das originale konkurrierende Systemmodus-Script wurde aus den Layouts entfernt. Kein `async`, `defer` oder `type="module"` ergänzen. Das Script wird vom eigenen Keycloak-Host geladen und benötigt keine zusätzliche Inline-Script-Freigabe in der CSP. Die originalen Keycloak-Scripts und deren CSP-Anforderungen bleiben bestehen.

Die Auswahl wird unter `goodui-keycloak-theme-mode` in `localStorage` gespeichert, mit `sessionStorage` als Rückfall. Dadurch bleibt sie bei Formular-POSTs, Sprachwechseln und Folgeseiten erhalten, auch wenn Keycloak den beliebigen URL-Parameter dort nicht weiterträgt. Der Login-Footer erlaubt die Auswahl; bei einem Wechsel bleiben OIDC- und Sitzungsparameter erhalten. Andere Tabs übernehmen Änderungen über das Storage-Event.

Der Speicher gilt pro Browser-Origin, also für die Realms und Konsolen desselben Keycloak-Hosts. Die GoodUI-Anwendung und Keycloak auf verschiedenen Hosts teilen ihn nicht: die Anwendung muss die aktuelle Auswahl beim Login neu übergeben. Wenn der Browser beide Speicher vollständig sperrt, gilt die URL-Auswahl nur auf Seiten mit diesem Parameter; Folgeseiten verwenden sonst die Systempräferenz. E-Mails folgen ausschließlich den Fähigkeiten und Präferenzen des Mailclients.

## Farben anpassen

Die zentrale Datei für alle **Web-Seiten** ist:

```text
themes/goodui/login/resources/css/brand.css
```

Beispiel für eine violette Marke:

```css
:root {
  --good-color-brand: #7c3aed;
  --good-brand-hover: #6d28d9;
  --good-brand-foreground: #ffffff;
  --good-color-accent: #7c3aed;
}
:root[data-theme="dark"] {
  --good-color-accent: #c4b5fd;
}
```

Die vorhandenen Variablen direkt ändern. `--good-color-brand` bestimmt primäre Schaltflächen, `--good-color-accent` Links und Fokusmarkierungen. Weitere Variablen steuern Canvas, Oberfläche, Text, Rahmen, gedämpften Text, Statusfarben, Schrift, Radien und Logobreite. Für beide Modi ausreichenden Kontrast wählen. Es werden keine Fonts von Drittanbietern geladen; Inter wird verwendet, wenn lokal vorhanden, sonst die Systemschrift.

Danach die Ressourcen verteilen und neu paketieren:

```sh
python3 scripts/sync-resources.py
python3 scripts/build.py
```

Der Sync kopiert die kanonischen Dateien nach Account, Admin und Welcome. Nicht die generierten Kopien bearbeiten. Im lokalen Compose sind Änderungen unmittelbar verfügbar; bei einer produktiven Installation das vollständige Theme beziehungsweise JAR erneut ausliefern.

## Logos und Favicon anpassen

Am einfachsten diese drei Dateien ersetzen und ihre Namen beibehalten:

```text
themes/goodui/login/resources/img/goodui-logo-light.svg
themes/goodui/login/resources/img/goodui-logo-dark.svg
themes/goodui/login/resources/img/favicon.svg
```

Das helle Logo steht auf hellem Hintergrund, das dunkle auf dunklem Hintergrund. SVGs mit passender `viewBox` und transparentem Hintergrund verwenden. Die Breite lässt sich in `brand.css` über `--good-logo-width` ändern. Danach `scripts/sync-resources.py` und gegebenenfalls den Paketbau ausführen.

In `login/theme.properties` zusätzlich `brandName` für den Alternativtext setzen. Dort lassen sich auch `logoLight`, `logoDark` und `favicon` auf andere relative Dateipfade setzen. Diese abweichenden Login-Pfade gelten nur für Login: bei anderen Dateinamen auch die Logo-URLs in `css/console.css`, `welcome/index.ftl` und die `logo`-/`favIcon`-Eigenschaften in Account/Admin anpassen. Das Ersetzen unter den vorhandenen Dateinamen aktualisiert alle Web-Bereiche ohne diese zusätzlichen Änderungen.

Der kleine Name unter dem Logo kommt aus dem Anzeigenamen des Keycloak-Realms. Seitentitel, Formulartexte und Sprachen kommen weiterhin aus Keycloak.

### E-Mails branden

E-Mails verwenden bewusst eigene, mailtaugliche Inline-Stile in `themes/goodui/email/html/template.ftl`. Dort können Hintergrund, Rahmen, Schrift und die Darkmode-Farben geändert werden. `email/theme.properties` bietet:

```properties
parent=keycloak
logoUrl=https://static.example.org/brand/email-logo.png
brandColor=#7c3aed
```

`logoUrl` ist optional. Ohne URL wird nur der Realm-Name angezeigt. Für Bilder eine öffentlich erreichbare absolute HTTPS-Adresse verwenden; PNG funktioniert in vielen Mailclients zuverlässiger als SVG. Der Realm-Name wird durch Keycloak geliefert. Änderungen an Farben oder Web-Logos werden nicht automatisch in das E-Mail-Layout übertragen. Plaintext-Alternativen bleiben die Originale. Externe Bilder und Darkmode können vom Mailclient eingeschränkt werden.

## Entwicklung und Prüfung

```sh
npm ci
npm test
npm run build
npx playwright install chromium
docker compose up -d
npm run test:e2e
```

**Browsertests ausschließlich gegen die lokale Demo ausführen.** Sie setzen die Themes in `goodui` und `master` und weisen dem Demo-Benutzer Account-Rollen zu. Die Basis-URL kann für isolierte CI-Instanzen mit `KEYCLOAK_BASE_URL` überschrieben werden; sie ist kein Werkzeug zum Prüfen produktiver Realms.

Die Tests prüfen Moduspriorität, gesperrten Browser-Speicher, Systemwechsel, Erhalt von OIDC-Parametern, den ersten Paint, sichtbare Logos, fehlerhafte Anmeldung, Registrierung, Passwortreset, mobile Breite, echte Konto-/Admin-Anmeldung, Passwortänderung und vollständige TOTP-Einrichtung sowie die Willkommensseite. Lokal wurden sowohl die Verzeichnisinstallation als auch das eigenständig installierte JAR mit allen sechs Browserprüfungen getestet. Screenshots liegen in `docs/`. Die GitHub Action baut die Pakete und führt dieselben Browserprüfungen gegen Keycloak 26.8.2 aus.

Passkeys benötigen geeignete Browser-/Authenticator-Hardware; tatsächliche SMTP-Zustellung und die Darstellung in verschiedenen Mailclients sind separat zu prüfen. Diese Bereiche erben Keycloaks Implementierung und werden nicht durch die Browserprüfung allein als vollständig getestet betrachtet.

Bei einem Keycloak-Upgrade insbesondere `login/template.ftl`, `account/index.ftl`, `admin/index.ftl` und `welcome/index.ftl` gegen den jeweiligen Upstream vergleichen. Auch geerbte Formular-Klassen und die CSS-Anpassungen der React-Konsolen prüfen. Kompatibilität mit anderen Versionen wird nicht vorausgesetzt.

Die Collage am Anfang dieser README besteht aus echten Screenshots der lokalen Keycloak-Demo. Nach Änderungen am Design lässt sie sich mit laufender Demo-Instanz und installiertem Playwright neu aufnehmen:

```sh
node scripts/create-collage.mjs
```

Das Script verwendet ausschließlich `http://localhost:8089`, meldet sich mit den lokalen Demo-Zugängen an und legt die Einzelansichten in `docs/views/` sowie die Collage unter `docs/theme-collage.png` ab. Es verändert keine Realm-Einstellungen.

## Lizenz

[Apache-2.0](LICENSE); die angepassten Keycloak-Layouts stammen aus dem gleich lizenzierten Upstream. GoodUI-Logos und Farbreferenzen stammen aus dem [GoodUI-Projekt](https://github.com/cloudfrogger/goodui); dessen [MIT-Lizenz](licenses/GoodUI-MIT.txt) liegt bei. Siehe [NOTICE](NOTICE). Markenrechte werden durch diese Lizenzen nicht übertragen.

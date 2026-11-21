# Build the native theme from source; no local dist/ directory is needed.
FROM python:3.13-alpine AS theme-builder
WORKDIR /build
COPY scripts/build.py scripts/sync-resources.py ./scripts/
COPY themes/ ./themes/
COPY LICENSE NOTICE ./
COPY licenses/ ./licenses/
RUN python3 scripts/build.py

FROM quay.io/keycloak/keycloak:26.8.2 AS keycloak-builder
ENV KC_DB=postgres \
    KC_HEALTH_ENABLED=true \
    KC_METRICS_ENABLED=true
COPY --from=theme-builder --chown=1000:0 /build/dist/goodui-keycloak-theme.jar /opt/keycloak/providers/goodui-keycloak-theme.jar
# Keep provider metadata stable across image layers and optimized startup.
RUN touch -m --date=@1743465600 /opt/keycloak/providers/goodui-keycloak-theme.jar
RUN /opt/keycloak/bin/kc.sh build

FROM quay.io/keycloak/keycloak:26.8.2
COPY --from=keycloak-builder /opt/keycloak/ /opt/keycloak/
ENV KC_DB=postgres \
    KC_HEALTH_ENABLED=true \
    KC_METRICS_ENABLED=true
LABEL org.opencontainers.image.title="GoodUI Keycloak Theme" \
      org.opencontainers.image.description="Keycloak 26.8.2 with native GoodUI themes, dark mode and customizable branding" \
      org.opencontainers.image.source="https://github.com/cloudfrogger/goodui_keycloak_theme" \
      org.opencontainers.image.url="https://goodui.cloudfrogger.com" \
      org.opencontainers.image.licenses="Apache-2.0 AND MIT"
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized", "--spi-theme--welcome-theme=goodui"]

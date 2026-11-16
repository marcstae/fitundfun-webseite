/// <reference path="../pb_data/types.d.ts" />
// Hinter dem Cloudflare Tunnel sah PocketBase für alle Besuchenden dieselbe Docker-IP: Das
// Login-Limit (10 pro Minute, Migration 16) galt für alle zusammen, und wer falsche Logins schickte,
// sperrte die Lagerleitung aus. CF-Connecting-IP setzt Cloudflare selbst; PocketBase ist nur über den
// Tunnel und 127.0.0.1 erreichbar (docker-compose.yml). Anfragen der Website intern über pb:8090
// haben den Header nicht und zählen weiter nach Container-IP.
migrate(
  (app) => {
    const settings = app.settings();
    unmarshal({ trustedProxy: { headers: ["CF-Connecting-IP"], useLeftmostIP: false } }, settings);
    app.save(settings);
  },
  (app) => {
    const settings = app.settings();
    unmarshal({ trustedProxy: { headers: [], useLeftmostIP: false } }, settings);
    app.save(settings);
  }
);

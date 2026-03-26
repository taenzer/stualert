# Remote-Zugriff: Architektur

Ziel:

- Extern erreichbar: 
  - stualert.sportverein-tambach.de (App)
  - portainer.sportverein-tambach.de (Portainer)
- Raspberry Pi bleibt **nicht** öffentlich erreichbar (keine Portfreigaben am Sportplatz).
- Externe Authentifizierung findet am vServer statt (Traefik Basic Auth), der Pi bleibt entlastet.
- Im lokalen WLAN gibt es trotzdem eine simple Passwortabfrage (Basic Auth in der App).

## High-Level Datenfluss

1. Browser (Internet) → vServer (Traefik, HTTPS, Basic Auth)
2. Traefik → (vServer) Upstream-Proxy-Container (nginx)
3. nginx → WireGuard-Tunnel → Pi App (HTTP :3000)

Warum nginx?

- Traefik wird bei dir rein über Docker-Labels in Portainer konfiguriert.
- Ein Target außerhalb von Docker (z.B. IP 10.8.0.2) wird damit typischerweise nicht direkt als Service-Target abgebildet.
- nginx als Container ist für Traefik ein normales Label-Target und kann auf die WireGuard-IP des Pi forwarden.

## Auth-Strategie

- Extern: Traefik `basicAuth` auf dem Router für `stualert.sportverein-tambach.de`.
- Intern/Lokal: Die App erzwingt Basic Auth für UI + `/api/*`.
  - Ausnahme: `/health` ist immer frei, damit Docker-Healthchecks funktionieren.
  - Bypass: Requests aus dem WireGuard-Netz (z.B. `10.8.0.0/24`) umgehen die App-Basic-Auth.
    - Effekt: Extern nur 1× Passwortabfrage (Traefik).
    - Lokal im WLAN weiterhin Passwortabfrage (App).

## SSE (Activity Stream)

Die UI nutzt Server-Sent Events:

- Endpoint: `GET /api/activity/stream`
- Proxy-Hinweis: SSE ist langlaufend. Timeouts/Buffering im Proxy müssen passend gesetzt werden (siehe vServer-Setup).

# stualert

Status: Läuft lokal; Remote-Zugriff wird über vServer abgesichert.

## Überblick

- Der Service läuft auf einem Raspberry Pi im (Gäste-)WLAN am Sportplatz.
- Externer Zugriff erfolgt **nur über den vServer** (Traefik + HTTPS + Basic Auth).
- Der Pi wird **nicht** ins Internet freigegeben. Stattdessen wird ein **WireGuard-Tunnel** vServer ↔ Pi aufgebaut.
- Zusätzlich schützt die App auf dem Pi UI + API per **Basic Auth** (mit Bypass für WireGuard-CIDR, damit extern nur 1× Passwortabfrage erscheint).

## Doku (alle Schritte außerhalb des Codes)

- Architektur/Entscheidungen: docs/remote-access-architecture.md
- vServer (DNS, TLS, WireGuard, Traefik+Labels, Portainer): docs/vserver-setup.md
- Pi (WireGuard-Client, App-Container, Firewall/Ports): docs/pi-setup.md
- Lokales HTTPS – Optionen & Aufwand: docs/local-https-options.md
- Passwörter/Secrets (Traefik BasicAuth + App BasicAuth): docs/secrets-and-passwords.md

## Konfiguration

- Beispiel: .env.example
- Basic Auth (App): `BASIC_AUTH_USER`, `BASIC_AUTH_PASSWORD`, optional `AUTH_BYPASS_CIDRS`

## Dev

- `npm run dev` (braucht eine lokale `.env` Datei für den Server-Teil)
- `npm run type-check`
- `npm run build`

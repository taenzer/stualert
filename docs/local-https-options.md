# Lokales HTTPS – Optionen & Aufwand

Ausgangslage:

- Extern ist HTTPS am vServer bereits vorhanden.
- Lokal im Sportplatz-WLAN sind teilweise Gäste im Netz.
- Die App nutzt Basic Auth.

Wichtig:

- Basic Auth ohne HTTPS ist technisch leicht mitzuschneiden (wenn ein Angreifer im gleichen WLAN sniffen kann).

## Option A: Lokal HTTP lassen + WLAN sauber trennen (geringster Aufwand)

Aufwand: niedrig (WLAN/Router/Access-Point Konfiguration)

- Gäste-WLAN strikt trennen (VLAN, Client Isolation)
- Nur “Admin/Intern” Netz darf den Pi erreichen

Vorteile:

- Keine Zertifikats-Themen
- Keine Browser-Warnungen

Nachteile:

- Wenn Gäste im gleichen L2-Netz sind, ist HTTP riskant

## Option B: Lokal immer den vServer-FQDN per HTTPS nutzen (mittlerer Aufwand)

Aufwand: mittel

- Im lokalen WLAN nutzt man ebenfalls `https://stualert.sportverein-tambach.de`.
- Traffic geht dann lokal → Internet → vServer → WireGuard → Pi.

Vorteile:

- Echte TLS-Sicherheit, keine Browser-Warnungen
- Keine lokalen Zertifikate nötig

Nachteile:

- Funktioniert nur zuverlässig, wenn Internet/Uplink verfügbar ist
- Latenz ggf. höher

## Option C: HTTPS direkt am Pi (höchster Aufwand)

Aufwand: hoch

Technisch:

- Reverse Proxy auf dem Pi (Traefik/Caddy/nginx) + TLS
- Zertifikate:
  - Self-signed ist für Gäste-Geräte unpraktisch (Warnungen)
  - Let’s Encrypt auf dem Pi meist nur via DNS-01 sinnvoll (Secrets/Automatisierung)

Vorteile:

- Lokales HTTPS unabhängig vom Internet

Nachteile:

- Mehr Komponenten auf dem Pi
- Zertifikats- und Secret-Handling ist fehleranfällig

## Empfehlung

- Wenn “Gäste im selben WLAN” realistisch sniffen könnten: Option A (Netztrennung) oder Option B.
- Option C erst später, wenn du bewusst Zertifikats-Management auf dem Pi betreiben willst.

# vServer Setup (Traefik/Portainer/WireGuard/DNS/TLS)

Diese Anleitung beschreibt alles, was auf dem vServer passieren muss, um

- `stualert.sportverein-tambach.de` (App) extern via HTTPS + Basic Auth bereitzustellen
- `portainer.sportverein-tambach.de` (Portainer) extern via HTTPS bereitzustellen
- den Raspberry Pi über WireGuard erreichbar zu machen, ohne ihn ins Internet freizugeben

## 1) DNS

- `A` Record: `stualert.sportverein-tambach.de` → öffentliche IP des vServer
- `A` Record: `portainer.sportverein-tambach.de` → öffentliche IP des vServer

## 2) Firewall am vServer

Erlaubte Inbound-Ports:

- TCP 80 (HTTP) – optional nur für ACME/Redirect
- TCP 443 (HTTPS)
- UDP 51820 (WireGuard) – Beispiel

Alle anderen Management-Ports (Portainer UI etc.) nicht direkt exponieren.

## 3) Traefik (Labels only) – TLS / Let’s Encrypt

Voraussetzungen:

- Traefik v2.x als Docker-Container
- ACME (Let’s Encrypt) aktiviert und `acme.json` persistent gespeichert

Wichtige Punkte:

- Nutze einen `certresolver` (z.B. `letsencrypt`) und ein persistentes Volume für `acme.json`.
- Standardmäßig Router auf `websecure` terminieren.

## 4) WireGuard Server (vServer)

Beispiel-IP-Plan:

- vServer (wg0): `10.8.0.1/24`
- Pi (wg0): `10.8.0.2/24`

Beispiel: `/etc/wireguard/wg0.conf`

```ini
[Interface]
Address = 10.8.0.1/24
ListenPort = 51820
PrivateKey = <VSERVER_PRIVATE_KEY>

# Optional: Firewall/NAT-Regeln hier oder via systemd hooks

[Peer]
PublicKey = <PI_PUBLIC_KEY>
AllowedIPs = 10.8.0.2/32
PersistentKeepalive = 25
```

Aktivieren:

- `sysctl -w net.ipv4.ip_forward=1` (wenn du Routing brauchst; häufig nicht nötig, wenn nur vServer→Pi)
- `systemctl enable --now wg-quick@wg0`

Test (nachdem der Pi online ist):

- `ping 10.8.0.2`
- `curl http://10.8.0.2:3000/health`

## 5) Upstream-Proxy-Container (nginx) für stualert

Warum:

- Traefik wird bei dir über Docker-Labels konfiguriert.
- nginx als Container kann auf `http://10.8.0.2:3000` forwarden.

### nginx Konfiguration (SSE-freundlich)

`nginx.conf` Beispiel:

```nginx
events {}
http {
  server {
    listen 8080;

    # Default upstream: Pi via WireGuard
    location / {
      proxy_pass http://10.8.0.2:3000;
      proxy_http_version 1.1;

      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;

      proxy_read_timeout 3600s;
      proxy_send_timeout 3600s;
    }

    # SSE: keine Buffering-Optimierungen
    location /api/activity/stream {
      proxy_pass http://10.8.0.2:3000;
      proxy_http_version 1.1;

      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;

      proxy_buffering off;
      proxy_cache off;

      proxy_read_timeout 3600s;
      proxy_send_timeout 3600s;
    }
  }
}
```

### Traefik Labels (Portainer Stack)

Hinweis: Labels müssen an den nginx-Container.

Beispiel (sinngemäß; an deine Naming-Konvention anpassen):

- `traefik.enable=true`
- Router:
  - `traefik.http.routers.stualert.rule=Host(`stualert.sportverein-tambach.de`)`
  - `traefik.http.routers.stualert.entrypoints=websecure`
  - `traefik.http.routers.stualert.tls=true`
  - `traefik.http.routers.stualert.tls.certresolver=letsencrypt`
- Service:
  - `traefik.http.services.stualert.loadbalancer.server.port=8080`
- Middleware BasicAuth:
  - `traefik.http.middlewares.stualert-auth.basicauth.users=<user:hashedpass>`
  - `traefik.http.routers.stualert.middlewares=stualert-auth`

### BasicAuth Hash erzeugen

Beispiel (Apache htpasswd, bcrypt):

- `htpasswd -nbB <USER> '<PASSWORD>'`

Den Output (z.B. `user:$2y$...`) in das Label `...basicauth.users=` übernehmen.

## 6) Portainer extern über Traefik

Ziel: `portainer.sportverein-tambach.de` → Portainer UI

- Portainer-Container nicht direkt per `ports:` ins Internet veröffentlichen.
- Stattdessen Traefik-Router per Labels:
  - `traefik.http.routers.portainer.rule=Host(`portainer.sportverein-tambach.de`)`
  - `traefik.http.routers.portainer.entrypoints=websecure`
  - `traefik.http.routers.portainer.tls=true`
  - `traefik.http.routers.portainer.tls.certresolver=letsencrypt`
  - `traefik.http.services.portainer.loadbalancer.server.port=9000` (oder 9443 je nach Setup)

Optional: Zusätzliche Traefik-BasicAuth davor (reduziert unnötige Login-Versuche).

## 7) Checkliste

- DNS zeigt auf vServer IP
- Traefik hat gültiges Zertifikat (Browser zeigt kein TLS-Warnbanner)
- WireGuard: vServer kann `10.8.0.2` erreichen
- nginx Container kann `curl http://10.8.0.2:3000/health`
- `https://stualert.sportverein-tambach.de` fragt 1× BasicAuth ab und lädt
- `https://portainer.sportverein-tambach.de` lädt Portainer UI

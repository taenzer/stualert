# Raspberry Pi Setup (WireGuard + App-Container)

Diese Anleitung beschreibt alles, was auf dem Raspberry Pi passieren muss, sobald du wieder Zugriff hast.

Ziel:

- Pi nimmt **keine** eingehenden Verbindungen aus dem Internet an.
- Pi baut einen ausgehenden WireGuard-Tunnel zum vServer auf.
- Die App läuft lokal auf Port 3000 (HTTP) und ist im WLAN durch App-Basic-Auth geschützt.
- Requests aus dem WireGuard-Netz (vom vServer) umgehen die App-Basic-Auth, damit extern nur Traefik nach Credentials fragt.

## 1) WireGuard Client (Pi)

### Keys erzeugen

- `wg genkey | tee pi.key | wg pubkey > pi.pub`

### Konfig anlegen

Beispiel: `/etc/wireguard/wg0.conf`

```ini
[Interface]
Address = 10.8.0.2/24
PrivateKey = <PI_PRIVATE_KEY>

# Optional: DNS, wenn du es brauchst
# DNS = 1.1.1.1

[Peer]
PublicKey = <VSERVER_PUBLIC_KEY>
Endpoint = <VSERVER_PUBLIC_IP_OR_DNS>:51820
AllowedIPs = 10.8.0.1/32
PersistentKeepalive = 25
```

Hinweise:

- Wenn der Pi auch andere Ziele über den Tunnel erreichen soll, erweitere `AllowedIPs`.
- Für den hier beschriebenen Use-Case reicht meist vServer-IP als `AllowedIPs`.

### Starten & Autostart

- `sudo systemctl enable --now wg-quick@wg0`

### Test

- `ip a show wg0` zeigt `10.8.0.2`
- vServer kann `ping 10.8.0.2`

## 2) App-Container auf dem Pi starten

Wichtig:

- Den App-Port **nicht** ins Internet publishen.
- Idealerweise nur in LAN/WireGuard verfügbar machen.

Beispiel (Docker Run / Compose sinngemäß):

- Container lauscht intern auf `3000`.
- Port-Mapping optional: `3000:3000` nur auf LAN-Interface (oder gar nicht publishen, wenn du ausschließlich über LAN-Proxy nutzt).

### Env Variablen (Auth)

Setze auf dem Pi:

- `BASIC_AUTH_USER=<lokalerUser>`
- `BASIC_AUTH_PASSWORD=<lokalesPasswort>`
- `AUTH_BYPASS_CIDRS=10.8.0.0/24`

Effekt:

- Lokal im WLAN: Basic Auth Prompt erscheint.
- Extern via vServer/WireGuard: Pi sieht Requests vom WireGuard-Netz und fragt nicht erneut nach.

### Healthcheck

- `/health` ist absichtlich ohne Auth, damit Docker-Healthchecks funktionieren.

## 3) Optional: Firewall/Ports

Empfehlung:

- Erlaube inbound `3000/tcp` nur aus dem lokalen WLAN-Subnetz und/oder WireGuard.
- Blocke inbound `3000/tcp` aus allen anderen Netzen.

Wie genau das umgesetzt wird (ufw/iptables/nftables) hängt vom Pi-Setup ab.

## 4) Checkliste

- `curl http://localhost:3000/health` (am Pi) liefert 200
- `curl -i http://<pi-lan-ip>:3000/` fordert 401 Basic Auth
- `curl -i http://10.8.0.2:3000/` ist vom vServer erreichbar
- Extern: `https://stualert.sportverein-tambach.de` fragt 1× (Traefik) nach Passwort und lädt

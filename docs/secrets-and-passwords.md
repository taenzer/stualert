# Secrets & Passwörter

Ziel:

- Extern: ein Passwort-Prompt (Traefik BasicAuth)
- Lokal: ein Passwort-Prompt (App BasicAuth)
- Keine Secrets im Git

## 1) Traefik BasicAuth (vServer)

- Nutzt Traefik Middleware `basicAuth`.
- Passwort sollte als bcrypt-Hash im Label hinterlegt werden.

Hash erzeugen (Beispiel):

- `htpasswd -nbB <USER> '<PASSWORD>'`

Output (z.B. `user:$2y$...`) in das Label übernehmen:

- `traefik.http.middlewares.stualert-auth.basicauth.users=<user:hashedpass>`

Hinweise:

- Wenn du Labels in Portainer pflegst, speichere das Label in einem Stack/Template und nicht in Git.
- Alternative: Traefik File-Provider + Docker Secret (bei dir aktuell nicht genutzt).

## 2) App BasicAuth (Pi)

Die App schützt UI + API (außer `/health`) per Basic Auth.

Env Variablen auf dem Pi:

- `BASIC_AUTH_USER=<lokalerUser>`
- `BASIC_AUTH_PASSWORD=<lokalesPasswort>`
- `AUTH_BYPASS_CIDRS=10.8.0.0/24` (damit vServer/WireGuard den Prompt nicht doppelt auslöst)

## 3) Passwörter rotieren

- Traefik: bcrypt neu generieren, Label ersetzen, Container neu deployen.
- App: Env aktualisieren, Container neu starten.

## 4) Logging

- Vermeide es, Credentials in Logs auszugeben.
- Basic Auth kommt über `Authorization` Header. Dieser darf nicht geloggt werden.

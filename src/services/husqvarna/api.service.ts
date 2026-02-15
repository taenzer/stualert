import path from "node:path";
import { Config, loadConfig } from "../../config";
import fs from "fs/promises";

export class HusqvarnaApi {
  private _token?: Token;
  private readonly TOKEN_FILE = path.join(process.cwd(), ".token-cache.json");

  constructor() {}

  async getMowerList(): Promise<Mower[]> {
    const token = await this.getToken();
    const config: Config = loadConfig();
    const res = await fetch(`${config.husqvarna.apiBaseUrl}/mowers`, {
      headers: {
        Authorization: `Bearer ${token.accessToken}`,
        "Authorization-Provider": "Husqvarna",
        "X-Api-Key": config.husqvarna.clientId,
      },
    });

    if (!res.ok) {
      console.log(await res.json());
      throw new Error(`Failed to fetch mower list: ${res.statusText}`);
    }

    const data = (await res.json()) as { data: MowerResponse[] };

    return data.data.map((item) => ({
      id: item.id,
      name: item.attributes.system.name,
    }));
  }

  async getToken(): Promise<Token> {
    await this.loadTokenFromDisk();

    if (this._token && this._token.expiresAt > new Date()) {
      return this._token;
    }

    const tokenResponse = await this.login();
    const expiresAt = new Date();
    expiresAt.setSeconds(
      expiresAt.getSeconds() + tokenResponse.expires_in - 60,
    ); // Refresh 1 minute before expiry

    const token: Token = { accessToken: tokenResponse.access_token, expiresAt };
    this._token = token;
    // Token auf Disk speichern
    await this.saveTokenToDisk(token);
    return token;
  }

  private async loadTokenFromDisk(): Promise<void> {
    try {
      const data = await fs.readFile(this.TOKEN_FILE, "utf-8");
      const cached = JSON.parse(data);

      // Date-String zurück zu Date konvertieren
      const token: Token = {
        accessToken: cached.accessToken,
        expiresAt: new Date(cached.expiresAt),
      };

      // Nur nutzen wenn noch gültig
      if (token.expiresAt > new Date()) {
        this._token = token;
        console.log("✅ Loaded valid token from cache");
      } else {
        console.log("⚠️  Cached token expired, will fetch new one");
        await this.deleteTokenFile();
      }
    } catch (error) {
      // Datei existiert nicht oder ist korrupt - kein Problem
      console.log("ℹ️  No cached token found");
    }
  }

  private async saveTokenToDisk(token: Token): Promise<void> {
    try {
      await fs.writeFile(
        this.TOKEN_FILE,
        JSON.stringify(token, null, 2),
        { mode: 0o600 }, // Nur Owner kann lesen/schreiben
      );
      console.log("💾 Token cached to disk");
    } catch (error) {
      console.error("Failed to cache token:", error);
      // Nicht kritisch, weiter machen
    }
  }

  private async deleteTokenFile(): Promise<void> {
    try {
      await fs.unlink(this.TOKEN_FILE);
    } catch {
      // Ignorieren wenn Datei nicht existiert
    }
  }

  private async login(): Promise<TokenResponse> {
    const config: Config = loadConfig();
    const params = new URLSearchParams();
    params.set("grant_type", "client_credentials");
    params.set("client_id", config.husqvarna.clientId);
    params.set("client_secret", config.husqvarna.clientSecret);

    const res = await fetch(config.husqvarna.tokenUrl, {
      method: "POST",
      body: params,
    });

    if (!res.ok) {
      throw new Error(res.statusText);
    }

    return res.json() as Promise<TokenResponse>;
  }
}

type TokenResponse = {
  access_token: string;
  scope: string;
  expires_in: number;
  provider: string;
  user_id: string;
  token_type: string;
};

type Token = {
  accessToken: string;
  expiresAt: Date;
};

type Mower = {
  id: string;
  name: string;
};

type MowerResponse = {
  id: string;
  attributes: {
    system: {
      name: string;
    };
  };
};

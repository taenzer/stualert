import path from "node:path";
import { Config, loadConfig } from "../../config";
import fs from "fs/promises";
import { CurrentActivity } from "../activity/activity.service";
import { MowerActivity, MowerMode } from "../../shared/mower.type";

export class HusqvarnaApi {
  private _token?: Token;
  private readonly TOKEN_FILE = path.join(process.cwd(), ".token-cache.json");
  private readonly _config: Config;

  constructor(config: Config) {
    this._config = config;
  }

  async getCurrentActivity(mowerId: string): Promise<CurrentActivity> {
    const res = await fetch(
      `${this._config.husqvarna.apiBaseUrl}/mowers/${mowerId}`,
      {
        headers: await this.getAuthHeaders(),
      },
    );
    if (!res.ok) {
      throw new Error(`Failed fetch mower activity: ${res.statusText}`);
    }
    const mower = (await res.json()) as { data: MowerResponse };

    return {
      activity: mower.data.attributes.mower.activity,
      timestamp: new Date(),
    };
  }

  private async getMowerList(): Promise<Mower[]> {
    const res = await fetch(`${this._config.husqvarna.apiBaseUrl}/mowers`, {
      headers: await this.getAuthHeaders(),
    });

    if (!res.ok) {
      console.error(res);
      throw new Error(`Failed to fetch mower list: ${res.statusText}`);
    }

    const data = (await res.json()) as { data: MowerResponse[] };

    return data.data.map((item) => ({
      id: item.id,
      name: item.attributes.system.name,
    }));
  }

  private async getAuthHeaders() {
    const token = await this.getToken();

    return {
      Authorization: `Bearer ${token.accessToken}`,
      "Authorization-Provider": "Husqvarna",
      "X-Api-Key": this._config.husqvarna.clientId,
    };
  }

  async printMowerIds(): Promise<void> {
    const mowers = await this.getMowerList();
    console.log("ℹ️  Available mowers:");
    mowers.map((mower) => console.log(`-> ${mower.name}: ${mower.id}`));
  }

  async checkMowerId(mowerId: string): Promise<boolean> {
    const mowers = await this.getMowerList();
    return mowers.filter((mower) => mower.id == mowerId).length == 1;
  }

  private async initToken(): Promise<void> {
    const diskToken = await this.loadTokenFromDisk();

    if (diskToken && this.isTokenValid(diskToken)) {
      this._token = diskToken;
      console.log("✅ Loaded valid auth token from cache");
      return;
    }

    await this.renewToken();

    return;
  }

  async getToken(): Promise<Token> {
    if (!this._token) {
      await this.initToken();
    }
    if (!this.isTokenValid(this._token!)) {
      await this.renewToken();
    }
    return this._token!;
  }

  async forceRenewToken(): Promise<void> {
    await this.renewToken();
  }

  private isTokenValid(token: Token): boolean {
    return token.expiresAt > new Date();
  }

  private async renewToken(): Promise<void> {
    console.log("⚠️  Renewing auth token");
    this.deleteTokenFile();
    const token = await this.fetchNewToken();
    this._token = token;
    this.saveTokenToDisk(token);
    return;
  }

  async fetchNewToken(): Promise<Token> {
    const tokenResponse = await this.login();
    const expiresAt = new Date();
    expiresAt.setSeconds(
      expiresAt.getSeconds() + tokenResponse.expires_in - 60,
    ); // Refresh 1 minute before expiry

    const token: Token = { accessToken: tokenResponse.access_token, expiresAt };
    return token;
  }

  private async loadTokenFromDisk(): Promise<Token | undefined> {
    try {
      const data = await fs.readFile(this.TOKEN_FILE, "utf-8");
      const cached = JSON.parse(data);
      const token: Token = {
        accessToken: cached.accessToken,
        expiresAt: new Date(cached.expiresAt),
      };
      return token;
    } catch (error) {
      console.log("ℹ️  No cached auth token found");
      return;
    }
  }

  private async saveTokenToDisk(token: Token): Promise<void> {
    try {
      await fs.writeFile(
        this.TOKEN_FILE,
        JSON.stringify(token, null, 2),
        { mode: 0o600 }, // Nur Owner kann lesen/schreiben
      );
      console.log("💾 Auth Token cached to disk");
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
    mower: {
      mode: MowerMode;
      activity: MowerActivity;
    };
  };
};

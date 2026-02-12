import { loadConfig } from "../../config";
import { HusqvarnaApi } from "./api";
import ReconnectingWebSocket from "reconnecting-websocket";
import WS from "ws";

export class HusqvarnaWebsocket {
  private _ws?: ReconnectingWebSocket;
  private _api: HusqvarnaApi;
  private _pingInterval?: NodeJS.Timeout;

  constructor(api: HusqvarnaApi) {
    this._api = api;
  }

  async setup() {
    const config = loadConfig();
    const token = await this._api?.getToken();

    this._ws = new ReconnectingWebSocket(
      `${config.husqvarna.websocketUrl}`,
      undefined,
      {
        minReconnectionDelay: 1.8 * 60 * 60_000,
        maxReconnectionDelay: 2 * 60 * 60_000,
        WebSocket: this.makeAuthWebSocket(() => `Bearer ${token.accessToken}`),
      },
    );
    this._ws.addEventListener("open", () => {
      console.log("✅ WebSocket connection established");

      this._pingInterval = setInterval(() => {
        if (this._ws && this._ws.readyState === WebSocket.OPEN) {
          this._ws.send("ping");
        }
      }, 59_000);
    });

    this._ws.addEventListener("message", (event) => {
      const data = event.data;
      if (data.type === "mover-event-v2") {
        console.log("ℹ️ Status Change detected!");
        const mower = data.attributes.mower;
        const status = mower.status;
        console.log("Mower Status:", status);
      }
    });

    // Aufräumen, wenn Verbindung geschlossen wird
    this._ws.addEventListener("close", (code) => {
      //   console.log(code);
      if (this._pingInterval) {
        clearInterval(this._pingInterval);
        this._pingInterval = undefined;
      }
    });

    this._ws.addEventListener("error", (err) => {
      //   console.error("WebSocket error:", err);
      // bei schwerwiegenden Fehlern Interval entfernen
      if (this._pingInterval) {
        clearInterval(this._pingInterval);
        this._pingInterval = undefined;
      }
    });
  }

  makeAuthWebSocket(getAuthHeader: () => string) {
    // ReconnectingWebSocket erwartet einen Constructor wie: new WebSocket(url, protocols?)
    return class AuthWebSocket extends WS {
      constructor(url: string, protocols?: string | string[]) {
        super(url, protocols as any, {
          headers: {
            Authorization: getAuthHeader(),
          },
        });
      }
    };
  }
}

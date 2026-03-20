import { Config } from "../../config";
import { HusqvarnaApi } from "./api.service";
import { ActivityStateService } from "../activity/activity.service";
import ReconnectingWebSocket from "reconnecting-websocket";
import WS from "ws";
import {
  isWebsocketMessage,
  isWebSocketOpenMessage,
  parseJsonMessage,
} from "../../shared/type-parse.helper";

export class HusqvarnaWebsocket {
  private _ws?: ReconnectingWebSocket;
  private _api: HusqvarnaApi;
  private _activityService?: ActivityStateService;
  private _pingInterval?: NodeJS.Timeout;
  private _config: Config;

  constructor(
    api: HusqvarnaApi,
    config: Config,
    activityService?: ActivityStateService,
  ) {
    this._api = api;
    this._activityService = activityService;
    this._config = config;
  }

  async setup() {
    const token = await this._api?.getToken();

    this._ws = new ReconnectingWebSocket(
      `${this._config.husqvarna.websocketUrl}`,
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
      const msg = parseJsonMessage((event as any).data);
      if (!msg) return;

      if (isWebSocketOpenMessage(msg)) {
        console.log("✅ WebSocket ready! Connection-Id: " + msg.connectionId);
        return;
      } else if (isWebsocketMessage(msg)) {
        if (msg.type === "mower-event-v2") {
          const mower = msg.attributes.mower;
          const activity = mower.activity;

          if (mower.id != this._config.mower.id) {
            return;
          }

          if (
            this._activityService &&
            this._activityService.hasChanged(activity)
          ) {
            this._activityService.updateActivity(activity);
          }
        }
      } else {
        console.warn("⚠️ Ignoring malformed websocket message");
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
      console.error("WebSocket error:", err);
      // bei schwerwiegenden Fehlern Interval entfernen
      if (this._pingInterval) {
        clearInterval(this._pingInterval);
        this._pingInterval = undefined;
      }
      process.exit(1);
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

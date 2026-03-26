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
import { MowerActivity, MowerState } from "../../shared/mower.type";

export class HusqvarnaWebsocket {
  private _ws?: ReconnectingWebSocket;
  private _api: HusqvarnaApi;
  private _activityService?: ActivityStateService;
  private _pingInterval?: NodeJS.Timeout;
  private _tokenRefreshTimeout?: NodeJS.Timeout;
  private _accessToken?: string;
  private _restartInFlight = false;
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
    await this.refreshAccessTokenAndScheduleNext();
    this.initWebSocket();
  }

  private initWebSocket() {
    const ws = new ReconnectingWebSocket(
      `${this._config.husqvarna.websocketUrl}`,
      undefined,
      {
        minReconnectionDelay: 1.8 * 60 * 60_000,
        maxReconnectionDelay: 1.99 * 60 * 60_000,
        WebSocket: this.makeAuthWebSocket(
          () => `Bearer ${this._accessToken ?? ""}`,
        ),
      },
    );

    this._ws = ws;

    ws.addEventListener("open", () => {
      if (this._ws !== ws) return;
      console.log("✅ WebSocket connection established");

      if (this._pingInterval) {
        clearInterval(this._pingInterval);
        this._pingInterval = undefined;
      }

      this._pingInterval = setInterval(() => {
        if (this._ws === ws && ws.readyState === 1 /* OPEN */) {
          ws.send("ping");
        }
      }, 59_000);
    });

    ws.addEventListener("message", (event) => {
      if (this._ws !== ws) return;
      const msg = parseJsonMessage((event as any).data);
      if (!msg) return;

      if (isWebSocketOpenMessage(msg)) {
        console.log("✅ WebSocket ready! Connection-Id: " + msg.connectionId);
        return;
      } else if (isWebsocketMessage(msg)) {
        if (msg.type === "mower-event-v2") {
          const mower = msg.attributes.mower;

          if (!mower.state || !mower.activity) {
            return;
          }

          if (msg.id != this._config.mower.id) {
            console.debug(
              "⚠️ Skipped Mower Event Webhook Message because of invalid mower id.",
              mower.id,
              this._config.mower.id,
            );
            return;
          }

          let activity = mower.activity;
          if (
            activity == MowerActivity.NOT_APPLICABLE &&
            mower.state == MowerState.PAUSED
          ) {
            activity = MowerActivity.PAUSED;
          }

          if (activity == MowerActivity.NOT_APPLICABLE) {
            return;
          }

          if (this._activityService) {
            this._activityService.updateActivity(activity);
          }
        }
      } else {
        console.warn("⚠️ Ignoring malformed websocket message");
      }
    });

    // Aufräumen, wenn Verbindung geschlossen wird
    ws.addEventListener("close", () => {
      if (this._ws !== ws) return;
      if (this._pingInterval) {
        clearInterval(this._pingInterval);
        this._pingInterval = undefined;
      }
    });

    ws.addEventListener("error", (err) => {
      if (this._ws !== ws) return;
      console.error("WebSocket error:", err);

      if (this._pingInterval) {
        clearInterval(this._pingInterval);
        this._pingInterval = undefined;
      }

      const message = (err as any)?.message
        ? String((err as any).message)
        : String(err);

      // Typischer Fehler, wenn der Bearer Token abgelaufen ist.
      if (message.includes("401") || message.includes("403")) {
        void this.restartWebSocket().catch((restartErr) => {
          console.error("Failed to restart websocket:", restartErr);
        });
      }
    });
  }

  private async restartWebSocket() {
    if (this._restartInFlight) return;
    this._restartInFlight = true;
    try {
      await this._api.forceRenewToken();
      await this.refreshAccessTokenAndScheduleNext();

      // Schließe die aktuelle Verbindung und initialisiere direkt neu,
      // damit wir nicht Stunden auf das Reconnect-Backoff warten.
      try {
        this._ws?.close();
      } catch {
        // ignore
      }
      this._ws = undefined;

      this.initWebSocket();
    } finally {
      this._restartInFlight = false;
    }
  }

  private async refreshAccessTokenAndScheduleNext(): Promise<void> {
    const token = await this._api.getToken();
    this._accessToken = token.accessToken;

    if (this._tokenRefreshTimeout) {
      clearTimeout(this._tokenRefreshTimeout);
      this._tokenRefreshTimeout = undefined;
    }

    // Token 30s vor Ablauf auffrischen (min. 30s, damit wir nicht in einer Tight-Loop landen)
    const refreshInMs = Math.max(
      30_000,
      token.expiresAt.getTime() - Date.now() - 30_000,
    );

    this._tokenRefreshTimeout = setTimeout(() => {
      void this.refreshAccessTokenAndScheduleNext().catch((err) => {
        console.error("Failed to refresh auth token:", err);
      });
    }, refreshInMs);
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

import { loadConfig } from "../../config";
import { WebsocketMessage } from "../../shared/ws.type";
import { HusqvarnaApi } from "./api";
import { ActivityState } from "../activity/state";
import { ActivityEmitter } from "../activity/emitter";
import ReconnectingWebSocket from "reconnecting-websocket";
import WS from "ws";

export class HusqvarnaWebsocket {
  private _ws?: ReconnectingWebSocket;
  private _api: HusqvarnaApi;
  private _activityState?: ActivityState;
  private _activityEmitter?: ActivityEmitter;
  private _pingInterval?: NodeJS.Timeout;

  constructor(
    api: HusqvarnaApi,
    activityState?: ActivityState,
    activityEmitter?: ActivityEmitter,
  ) {
    this._api = api;
    this._activityState = activityState;
    this._activityEmitter = activityEmitter;
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
      const msg = JSON.parse(event.data) as WebsocketMessage;
      if (msg.type == "mower-event-v2") {
        const mower = msg.attributes.mower;
        const activity = mower.activity;

        console.log("Mower Status:", activity);

        // Update activity state if provided
        if (this._activityState) {
          if (this._activityState.hasChanged(activity)) {
            this._activityState.updateActivity(activity);

            // Emit event to subscribers
            if (this._activityEmitter) {
              this._activityEmitter.emitActivityChanged({
                previous: this._activityState.getCurrent()?.activity,
                current: {
                  activity: activity,
                  timestamp: new Date(),
                },
              });
            }
          }
        }
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

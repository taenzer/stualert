import { Mower, MowerActivity, MowerMode } from "./mower.type";

export type WebsocketMessage = {
  id: string;
  type:
    | "battery-event-v2"
    | "mower-event-v2"
    | "calendar-event-v2"
    | "cuttingHeight-event-v2"
    | "headlights-event-v2"
    | "message-event-v2"
    | "planner-event-v2"
    | "position-event-v2";
  attributes: any;
};

export type WebsocketMowerEventMessage = WebsocketMessage & {
  type: "mower-event-v2";
  attributes: {
    mower: {
      mode: MowerMode;
      activity: MowerActivity;
      inactiveReason: string;
      state: string;
      errorCode: number;
    };
  };
};

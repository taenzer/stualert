import { ActivityLogEntry } from "../services/activity/activity.service";
import { RelayState } from "../services/gpio/gpio.service";
import { MowerActivity } from "./mower.type";

export type ApiMowerUpdateResponse = {
  activity: MowerActivity;
  history: ActivityLogEntry[];
  warningLightStatus: RelayState;
};

import { EventEmitter } from "events";
import { MowerActivity } from "../../shared/mower.type";
import { CurrentActivity } from "./state";

export interface ActivityChangeEvent {
  previous?: MowerActivity;
  current: CurrentActivity;
}

export class ActivityEmitter extends EventEmitter {
  emitActivityChanged(event: ActivityChangeEvent): void {
    const activityName = `activity-changed:${event.current.activity}`;

    // Emit generic event
    this.emit("activity-changed", event);

    // Emit specific activity event
    this.emit(activityName, event);
  }

  onActivityChanged(listener: (event: ActivityChangeEvent) => void): void {
    this.on("activity-changed", listener);
  }

  onActivityChangedTo(
    activity: MowerActivity,
    listener: (event: ActivityChangeEvent) => void,
  ): void {
    const activityName = `activity-changed:${activity}`;
    this.on(activityName, listener);
  }

  removeActivityListener(listener: (...args: any[]) => void): void {
    this.removeListener("activity-changed", listener);
  }
}

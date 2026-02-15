import { EventEmitter } from "node:stream";
import { MowerActivity } from "../../shared/mower.type";

export interface ActivityLogEntry {
  activity: MowerActivity;
  timestamp: Date;
  previousActivity?: MowerActivity;
}

export interface CurrentActivity {
  activity: MowerActivity;
  timestamp: Date;
}

export interface ActivityChangeEvent {
  previous?: MowerActivity;
  current: CurrentActivity;
}

export class ActivityStateService extends EventEmitter {
  private current: CurrentActivity | null = null;
  private history: ActivityLogEntry[] = [];
  private maxHistorySize: number;

  constructor(maxHistorySize: number = 10) {
    super();
    this.maxHistorySize = maxHistorySize;
  }

  updateActivity(newActivity: MowerActivity): void {
    const now = new Date();
    const previousActivity = this.current?.activity;

    this.current = {
      activity: newActivity,
      timestamp: now,
    };

    // Emit event to subscribers

    this.emitActivityChanged({
      previous: previousActivity,
      current: this.current,
    });

    this.history.push({
      activity: newActivity,
      timestamp: now,
      previousActivity,
    });

    // Keep only the last N entries
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }

  getCurrent(): CurrentActivity | null {
    return this.current;
  }

  getHistory(): ActivityLogEntry[] {
    return [...this.history];
  }

  hasChanged(newActivity: MowerActivity): boolean {
    return this.current?.activity !== newActivity;
  }
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

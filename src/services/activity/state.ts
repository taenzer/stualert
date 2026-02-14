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

export class ActivityState {
  private current: CurrentActivity | null = null;
  private history: ActivityLogEntry[] = [];
  private maxHistorySize: number;

  constructor(maxHistorySize: number = 10) {
    this.maxHistorySize = maxHistorySize;
  }

  updateActivity(newActivity: MowerActivity): void {
    const now = new Date();
    const previousActivity = this.current?.activity;

    this.current = {
      activity: newActivity,
      timestamp: now,
    };

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
}

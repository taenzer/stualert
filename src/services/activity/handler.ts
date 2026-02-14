import { ActivityEmitter, ActivityChangeEvent } from "./emitter";
import { ActivityState } from "./state";
import { MockGPIOManager } from "../gpio/manager";
import { Config } from "../../config";

export class ActivityHandler {
  private activityState: ActivityState;
  private emitter: ActivityEmitter;
  private gpioManager: MockGPIOManager;

  constructor(
    activityState: ActivityState,
    emitter: ActivityEmitter,
    config: Config,
  ) {
    this.activityState = activityState;
    this.emitter = emitter;
    this.gpioManager = new MockGPIOManager(config);

    // Register listener for all activity changes
    this.emitter.onActivityChanged((event) => this.handleActivityChange(event));
  }

  private handleActivityChange(event: ActivityChangeEvent): void {
    const activity = event.current.activity;

    console.log(`[ActivityHandler] Activity changed to: ${activity}`);

    // Switch GPIO pins based on activity
    // For now, we just set pins HIGH when activity is active
    this.gpioManager.switchPinsForActivity(activity, "HIGH");

    // You can add more handlers here:
    // - Send notifications
    // - Log to external service
    // - Trigger webhooks
    // etc.
  }

  /**
   * Register a custom handler for specific activity changes
   */
  onActivityChange(
    activity: string | undefined,
    handler: (event: ActivityChangeEvent) => void,
  ): void {
    if (activity) {
      this.emitter.onActivityChangedTo(activity as any, handler);
    } else {
      this.emitter.onActivityChanged(handler);
    }
  }
}

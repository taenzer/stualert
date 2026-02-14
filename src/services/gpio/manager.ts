import { Config } from "../../config";

export interface IGPIOManager {
  setPinHigh(pinNumber: number): void;
  setPinLow(pinNumber: number): void;
}

export class MockGPIOManager implements IGPIOManager {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  setPinHigh(pinNumber: number): void {
    console.log(`[GPIO Mock] PIN ${pinNumber}: HIGH`);
  }

  setPinLow(pinNumber: number): void {
    console.log(`[GPIO Mock] PIN ${pinNumber}: LOW`);
  }

  /**
   * Switch pins for a specific activity.
   * Can be extended later for more complex GPIO patterns.
   */
  switchPinsForActivity(activity: string, state: "HIGH" | "LOW"): void {}
}

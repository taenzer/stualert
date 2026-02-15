import { Config } from "../../config";

export enum RelayState {
  OFF = "LOW",
  ON = "HIGH",
}

export interface IGPIOService {
  switchWarningLight(newState: RelayState): void;
}

export class MockGPIOService implements IGPIOService {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  switchWarningLight(newState: RelayState): void {
    const pinNumber = this.config.gpio.warningLight.powerPin;
    console.log(`[GPIO Mock] Turned WL ${newState}! PIN ${pinNumber}`);
  }
}

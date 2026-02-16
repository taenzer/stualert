import { Config } from "../../config";

export enum RelayState {
  OFF = "LOW",
  ON = "HIGH",
}

export interface IGPIOService {
  switchWarningLight(newState: RelayState): void;
  getWarningLightState(): RelayState;
}

export class MockGPIOService implements IGPIOService {
  private config: Config;
  private warningLightState: RelayState = RelayState.OFF;

  constructor(config: Config) {
    this.config = config;
  }

  switchWarningLight(newState: RelayState): void {
    const pinNumber = this.config.gpio.warningLight.powerPin;
    this.warningLightState = newState;
    console.log(`[GPIO Mock] Turned WL ${newState}! PIN ${pinNumber}`);
  }

  getWarningLightState(): RelayState {
    return this.warningLightState;
  }
}

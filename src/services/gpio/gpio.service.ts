import { Config } from "../../config";
import rpio from "rpio";

export enum RelayState {
  OFF = "LOW",
  ON = "HIGH",
}

export interface IGPIOService {
  switchWarningLight(newState: RelayState): void;
  getWarningLightState(): RelayState;
  cleanup(): void;
}

class GPIOService implements IGPIOService {
  private config: Config;
  private warningLightState: RelayState = RelayState.OFF;
  private rpioReady: boolean = false;
  private powerPin: number;

  constructor(config: Config) {
    this.config = config;
    this.powerPin = config.gpio.warningLight.powerPin;
    this.initPins();
  }

  private initPins(): void {
    try {
      rpio.init({ mapping: "physical", gpiomem: true });
      rpio.open(this.powerPin, rpio.OUTPUT, rpio.HIGH);
      console.log(`⚡[GPIO] Initialized power pin: ${this.powerPin}`);
      this.rpioReady = true;
    } catch (err) {
      console.error("⚡[GPIO] Failed to initialize:", err);
      throw err;
    }
  }

  switchWarningLight(newState: RelayState): void {
    if (!this.rpioReady) return;

    const value = newState === RelayState.ON ? rpio.LOW : rpio.HIGH;
    rpio.write(this.powerPin, value);
    this.warningLightState = newState;
    console.log(`[GPIO] Warning light switched to ${newState}`);
  }

  getWarningLightState(): RelayState {
    return this.warningLightState;
  }

  cleanup(): void {
    if (this.rpioReady) {
      rpio.write(this.powerPin, rpio.HIGH);
      rpio.close(this.powerPin);
      console.log("⚡[GPIO] Pins cleaned up");
    }
  }
}

class MockGPIOService implements IGPIOService {
  private config: Config;
  private warningLightState: RelayState = RelayState.OFF;

  constructor(config: Config) {
    this.config = config;
  }

  switchWarningLight(newState: RelayState): void {
    const pinNumber = this.config.gpio.warningLight.powerPin;
    this.warningLightState = newState;
    console.log(`⚡[GPIO Mock] Turned WL ${newState}! PIN ${pinNumber}`);
  }

  getWarningLightState(): RelayState {
    return this.warningLightState;
  }

  cleanup(): void {
    console.log("⚡[GPIO Mock] Cleanup called");
  }
}

// Factory-Funktion
export function createGPIOService(config: Config): IGPIOService {
  if (config.gpio.useMock) {
    console.log("⚡[GPIO] Using mock service");
    return new MockGPIOService(config);
  }

  try {
    console.log("⚡[GPIO] Using real GPIO service");
    return new GPIOService(config);
  } catch (err) {
    console.warn("⚡[GPIO] Failed to initialize GPIO, using mock:", err);
    return new MockGPIOService(config);
  }
}

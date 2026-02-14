export interface Config {
  husqvarna: {
    tokenUrl: string;
    apiBaseUrl: string;
    websocketUrl: string;
    clientId: string;
    clientSecret: string;
  };
  gpio: {
    warningLight: {
      powerPin: number;
      switchModePin: number;
    };
  };
  http: {
    port: number;
  };
  activity: {
    maxHistorySize: number;
  };
}

export function loadConfig(): Config {
  return {
    husqvarna: {
      tokenUrl: process.env.HUSQVARNA_TOKEN_URL || "",
      clientId: process.env.HUSQVARNA_CLIENT_ID || "",
      clientSecret: process.env.HUSQVARNA_CLIENT_SECRET || "",
      apiBaseUrl: process.env.HUSQVARNA_API_BASE_URL || "",
      websocketUrl: process.env.HUSQVARNA_WEBSOCKET_URL || "",
    },
    gpio: {
      warningLight: {
        powerPin: parseInt(
          process.env.GPIO_WARNING_LIGHT_POWER_PIN || "37",
          10,
        ),
        switchModePin: parseInt(
          process.env.GPIO_WARNING_LIGHT_SWITCH_MODE_PIN || "38",
          10,
        ),
      },
    },
    http: {
      port: parseInt(process.env.HTTP_PORT || "3000", 10),
    },
    activity: {
      maxHistorySize: parseInt(
        process.env.ACTIVITY_MAX_HISTORY_SIZE || "37",
        10,
      ),
    },
  };
}

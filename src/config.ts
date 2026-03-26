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
    useMock: boolean;
  };
  http: {
    port: number;
  };
  activity: {
    maxHistorySize: number;
  };
  watchdog: {
    warningPersistResetMs: number;
    hardResetCooldownMs: number;
  };
  mower: {
    id: string | null | undefined;
  };
  auth: {
    basic: {
      username: string;
      password: string;
    };
    bypassCidrs: string[];
  };
}

function parseCsv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
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
      useMock: process.env.USE_GPIO_MOCK == "true",
    },
    http: {
      port: parseInt(process.env.HTTP_PORT || "3000", 10),
    },
    activity: {
      maxHistorySize: parseInt(
        process.env.ACTIVITY_MAX_HISTORY_SIZE || "5",
        10,
      ),
    },
    watchdog: {
      warningPersistResetMs: parseInt(
        process.env.WATCHDOG_WARNING_PERSIST_RESET_MS || String(15 * 60_000),
        10,
      ),
      hardResetCooldownMs: parseInt(
        process.env.WATCHDOG_HARD_RESET_COOLDOWN_MS || String(10 * 60_000),
        10,
      ),
    },
    mower: {
      id: process.env.MOWER_ID,
    },
    auth: {
      basic: {
        username: process.env.BASIC_AUTH_USER || "",
        password: process.env.BASIC_AUTH_PASSWORD || "",
      },
      bypassCidrs: parseCsv(process.env.AUTH_BYPASS_CIDRS),
    },
  };
}

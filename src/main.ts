import { Config, loadConfig } from "./config";
import { HusqvarnaApi } from "./services/husqvarna/api.service";
import { HusqvarnaWebsocket } from "./services/husqvarna/websocket.service";
import { ActivityStateService } from "./services/activity/activity.service";
import { createServer, startServer } from "./server";
import { createGPIOService } from "./services/gpio/gpio.service";
import type { IGPIOService } from "./services/gpio/gpio.service";
import { MowerActivity } from "./shared/mower.type";
import { RelayState } from "./shared/gpio.type";

function isWarningLightActivity(activity?: MowerActivity): boolean {
  return (
    !!activity &&
    [MowerActivity.LEAVING, MowerActivity.GOING_HOME].includes(activity)
  );
}
function logInvalidMowerIdAndHelp(api: HusqvarnaApi): void {
  console.error(
    "❌ STARTUP FAILED. No or invalid mower ID found in env! Please make sure to set MOWER_ID environment variable.",
  );
  api.printMowerIds();
}

async function createActivityService(
  config: Config,
  api: HusqvarnaApi,
  mowerId: string,
): Promise<ActivityStateService> {
  const initial = await api.getCurrentActivity(mowerId);
  return new ActivityStateService(config.activity.maxHistorySize, initial);
  // return new ActivityStateService(config.activity.maxHistorySize, {
  //   activity: MowerActivity.LEAVING,
  //   timestamp: new Date(),
  // });
}

function registerProcessHandlers(gpioManager: IGPIOService): void {
  const gracefulCleanup = () => {
    console.log("\n🧹 Cleaning up...");
    gpioManager.cleanup();
    process.exit(0);
  };

  const fatalCleanup = (label: string) => (err: unknown) => {
    console.error(label, err);
    gpioManager.cleanup();
    process.exit(1);
  };

  process.on("SIGINT", gracefulCleanup); // Ctrl+C
  process.on("SIGTERM", gracefulCleanup); // Docker stop / kill
  process.on("uncaughtException", fatalCleanup("❌ Uncaught Exception:"));
  process.on("unhandledRejection", fatalCleanup("❌ Unhandled Rejection:"));
}

function wireWarningLight(
  activityService: ActivityStateService,
  gpioManager: IGPIOService,
): void {
  if (
    isWarningLightActivity(
      activityService.getCurrent()?.activity ?? MowerActivity.UNKNOWN,
    )
  ) {
    gpioManager.switchWarningLight(RelayState.ON);
  }

  activityService.onActivityChanged(({ previous, current }) => {
    if (isWarningLightActivity(current.activity)) {
      gpioManager.switchWarningLight(RelayState.ON);
      return;
    }

    if (previous && isWarningLightActivity(previous)) {
      gpioManager.switchWarningLight(RelayState.OFF);
    }
  });
}

function startHttpServer(
  config: Config,
  activityService: ActivityStateService,
  gpioManager: IGPIOService,
  hardResetMowerStatus: () => Promise<void>,
): void {
  const httpServer = createServer(
    activityService,
    gpioManager,
    hardResetMowerStatus,
  );
  startServer(httpServer, config.http.port);
}

async function main() {
  const config = loadConfig();
  const api = new HusqvarnaApi(config);

  const mowerId = config.mower.id;
  if (!mowerId) {
    logInvalidMowerIdAndHelp(api);
    return;
  }

  if (!(await api.checkMowerId(mowerId))) {
    logInvalidMowerIdAndHelp(api);
    return;
  }

  const activityService = await createActivityService(config, api, mowerId);
  const gpioManager = createGPIOService(config);

  registerProcessHandlers(gpioManager);
  wireWarningLight(activityService, gpioManager);

  // Start WebSocket connection
  const ws = new HusqvarnaWebsocket(api, config, activityService);
  await ws.setup();

  let resetInFlight = false;
  const hardResetMowerStatus = async (reason: "manual" | "watchdog") => {
    if (resetInFlight) return;
    resetInFlight = true;

    try {
      console.log(`🧱 Hard-reset started (${reason})`);

      try {
        await ws.restartNow();
      } catch (err) {
        console.warn(
          "⚠️ WebSocket restart failed (continuing with REST refresh):",
          err,
        );
      }

      const fresh = await api.getCurrentActivity(mowerId);
      activityService.updateActivity(fresh.activity);

      console.log(
        `✅ Hard-reset finished (${reason}). Activity: ${fresh.activity}`,
      );
    } finally {
      resetInFlight = false;
    }
  };

  // Watchdog: if warning activity persists too long, force a hard-reset once per warning episode
  const warningThresholdMs = config.watchdog.warningPersistResetMs;
  const cooldownMs = config.watchdog.hardResetCooldownMs;
  const watchdogIntervalMs = 30_000;

  let lastWatchdogResetAt = 0;
  let watchdogTriggeredForEpisode = false;

  setInterval(() => {
    const current = activityService.getCurrent();
    if (!current) return;

    const isWarning = isWarningLightActivity(current.activity);
    if (!isWarning) {
      watchdogTriggeredForEpisode = false;
      return;
    }

    const warningDurationMs = Date.now() - current.timestamp.getTime();
    const cooldownOk = Date.now() - lastWatchdogResetAt >= cooldownMs;

    if (
      !watchdogTriggeredForEpisode &&
      cooldownOk &&
      warningDurationMs >= warningThresholdMs
    ) {
      watchdogTriggeredForEpisode = true;
      lastWatchdogResetAt = Date.now();

      void hardResetMowerStatus("watchdog").catch((err) => {
        console.error("❌ Watchdog hard-reset failed:", err);
      });
    }
  }, watchdogIntervalMs);

  // Start HTTP Server
  startHttpServer(config, activityService, gpioManager, () =>
    hardResetMowerStatus("manual"),
  );

  console.log("✅ Application started successfully");
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

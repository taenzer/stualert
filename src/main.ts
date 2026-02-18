import { Config, loadConfig } from "./config";
import { HusqvarnaApi } from "./services/husqvarna/api.service";
import { HusqvarnaWebsocket } from "./services/husqvarna/websocket.service";
import { ActivityStateService } from "./services/activity/activity.service";
import { createServer, startServer } from "./server";
import { createGPIOService } from "./services/gpio/gpio.service";
import { MowerActivity } from "./shared/mower.type";
import { RelayState } from "./shared/gpio.type";

async function main() {
  const config = loadConfig();
  const activityService = new ActivityStateService(
    config.activity.maxHistorySize,
  );
  const gpioManager = createGPIOService(config);

  const cleanup = () => {
    console.log("\n🧹 Cleaning up...");
    gpioManager.cleanup();
    process.exit(0);
  };

  process.on("SIGINT", cleanup); // Ctrl+C
  process.on("SIGTERM", cleanup); // Docker stop / kill
  process.on("uncaughtException", (err) => {
    console.error("❌ Uncaught Exception:", err);
    gpioManager.cleanup();
    process.exit(1);
  });
  process.on("unhandledRejection", (err) => {
    console.error("❌ Unhandled Rejection:", err);
    gpioManager.cleanup();
    process.exit(1);
  });

  activityService.onActivityChanged(({ previous, current }) => {
    if (
      [MowerActivity.LEAVING, MowerActivity.GOING_HOME].includes(
        current.activity,
      )
    ) {
      gpioManager.switchWarningLight(RelayState.ON);
    } else {
      if (
        previous &&
        [MowerActivity.LEAVING, MowerActivity.GOING_HOME].includes(previous)
      ) {
        gpioManager.switchWarningLight(RelayState.OFF);
      }
    }
  });

  // Initialize Husqvarna Services
  const api: HusqvarnaApi = new HusqvarnaApi();
  const ws: HusqvarnaWebsocket = new HusqvarnaWebsocket(api, activityService);

  // Start HTTP Server
  const httpServer = createServer(activityService, gpioManager);
  startServer(httpServer, config.http.port);

  // Start WebSocket connection
  await ws.setup();

  console.log("✅ Application started successfully");
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

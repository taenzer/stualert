import { Config, loadConfig } from "./config";
import { HusqvarnaApi } from "./services/husqvarna/api.service";
import { HusqvarnaWebsocket } from "./services/husqvarna/websocket.service";
import { ActivityStateService } from "./services/activity/activity.service";
import { createServer, startServer } from "./server";
import { MockGPIOService, RelayState } from "./services/gpio/gpio.service";
import { MowerActivity } from "./shared/mower.type";

async function main() {
  const config = loadConfig();
  const activityService = new ActivityStateService(
    config.activity.maxHistorySize,
  );
  const gpioManager = new MockGPIOService(config);

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
  const httpServer = createServer(activityService);
  startServer(httpServer, config.http.port);

  // Start WebSocket connection
  await ws.setup();

  console.log("✅ Application started successfully");
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

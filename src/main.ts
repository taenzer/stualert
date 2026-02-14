import { Config, loadConfig } from "./config";
import { HusqvarnaApi } from "./services/husqvarna/api";
import { HusqvarnaWebsocket } from "./services/husqvarna/websocket";
import { ActivityState } from "./services/activity/state";
import { ActivityEmitter } from "./services/activity/emitter";
import { ActivityHandler } from "./services/activity/handler";
import { createServer, startServer } from "./server";

async function main() {
  const config = loadConfig();

  // Initialize Activity Services
  const activityState = new ActivityState(config.activity.maxHistorySize);
  const activityEmitter = new ActivityEmitter();
  const activityHandler = new ActivityHandler(
    activityState,
    activityEmitter,
    config,
  );

  // Initialize Husqvarna Services
  const api: HusqvarnaApi = new HusqvarnaApi();
  const ws: HusqvarnaWebsocket = new HusqvarnaWebsocket(
    api,
    activityState,
    activityEmitter,
  );

  // Start HTTP Server
  const httpServer = createServer();
  startServer(httpServer, config.http.port);

  // Start WebSocket connection
  await ws.setup();

  console.log("✅ Application started successfully");
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

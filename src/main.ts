import { Config, loadConfig } from "./config";
import { HusqvarnaApi } from "./services/husqvarna/api";
import { HusqvarnaWebsocket } from "./services/husqvarna/websocket";

async function main() {
  const api: HusqvarnaApi = new HusqvarnaApi();
  const ws: HusqvarnaWebsocket = new HusqvarnaWebsocket(api);

  await ws.setup();
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

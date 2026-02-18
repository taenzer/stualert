import express, { Express, Request, Response } from "express";
import path from "path";
import { MowerActivity } from "./shared/mower.type";
import {
  ActivityStateService,
  CurrentActivity,
} from "./services/activity/activity.service";
import { ApiMowerUpdateResponse } from "./shared/api.type";
import { IGPIOService } from "./services/gpio/gpio.service";

export function createServer(
  activityService: ActivityStateService,
  gpioService: IGPIOService,
): Express {
  const app = express();

  // Health-Check Endpoint
  app.get("/health", (req: Request, res: Response) => {
    const health = {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
    };
    res.status(200).json(health);
  });

  // Serve static files from public directory
  const publicDir = path.join(__dirname, "public");
  app.use(express.static(publicDir));

  // Serve index.html for all other routes (SPA routing)
  app.get("/", (req: Request, res: Response) => {
    res.sendFile(path.join(publicDir, "index.html"));
  });

  const buildApiResponse = (
    current?: CurrentActivity,
  ): ApiMowerUpdateResponse => {
    return {
      activity:
        current?.activity ??
        activityService.getCurrent()?.activity ??
        MowerActivity.UNKNOWN,
      history: activityService.getHistory(),
      warningLightStatus: gpioService.getWarningLightState(),
    };
  };

  app.get("/api/activity/stream", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const send = (data: ApiMowerUpdateResponse) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    send(buildApiResponse());

    activityService.onActivityChanged(({ previous, current }) => {
      send(buildApiResponse(current));
    });

    req.on("close", () => {
      console.log("Client disconnected from activity stream");
    });
  });

  return app;
}

export function startServer(server: Express, port: number): void {
  server.listen(port, () => {
    console.log(`✅ HTTP Server running on http://localhost:${port}`);
  });
}

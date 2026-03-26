import crypto from "crypto";
import express, { Express, Request, Response } from "express";
import path from "path";
import { Config } from "./config";
import { MowerActivity } from "./shared/mower.type";
import {
  ActivityStateService,
  CurrentActivity,
} from "./services/activity/activity.service";
import { ApiMowerUpdateResponse } from "./shared/api.type";
import { IGPIOService } from "./services/gpio/gpio.service";

function sha256(input: string): Buffer {
  return crypto.createHash("sha256").update(input, "utf8").digest();
}

function safeEqualString(a: string, b: string): boolean {
  return crypto.timingSafeEqual(sha256(a), sha256(b));
}

function normalizeIp(ip: string | undefined | null): string | null {
  if (!ip) return null;
  if (ip.startsWith("::ffff:")) return ip.slice("::ffff:".length);
  return ip;
}

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const octets = parts.map((p) => Number(p));
  if (octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return (
    ((octets[0] << 24) + (octets[1] << 16) + (octets[2] << 8) + octets[3]) >>> 0
  );
}

function isIpInCidr(ip: string, cidr: string): boolean {
  // Supports IPv4 CIDR only.
  const [cidrIp, prefixRaw] = cidr.split("/");
  const prefix = prefixRaw === undefined ? 32 : Number(prefixRaw);
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) return false;

  const ipInt = ipv4ToInt(ip);
  const cidrInt = ipv4ToInt(cidrIp);
  if (ipInt === null || cidrInt === null) return false;

  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipInt & mask) === (cidrInt & mask);
}

function shouldBypassAuth(
  remoteIp: string | null,
  bypassCidrs: string[],
): boolean {
  if (!remoteIp) return false;
  if (!bypassCidrs.length) return false;
  // Only check IPv4-ish values; ignore everything else.
  if (!/^[0-9.]+$/.test(remoteIp)) return false;
  return bypassCidrs.some((cidr) => isIpInCidr(remoteIp, cidr));
}

function parseBasicAuthHeader(header: string | undefined): {
  username: string;
  password: string;
} | null {
  if (!header) return null;
  const [scheme, encoded] = header.split(" ", 2);
  if (!scheme || scheme.toLowerCase() !== "basic" || !encoded) return null;

  let decoded: string;
  try {
    decoded = Buffer.from(encoded, "base64").toString("utf8");
  } catch {
    return null;
  }

  const idx = decoded.indexOf(":");
  if (idx < 0) return null;
  return {
    username: decoded.slice(0, idx),
    password: decoded.slice(idx + 1),
  };
}

export function createServer(
  config: Config,
  activityService: ActivityStateService,
  gpioService: IGPIOService,
  hardResetMowerStatus: () => Promise<void>,
): Express {
  const app = express();

  const basicUser = config.auth.basic.username;
  const basicPass = config.auth.basic.password;
  const basicAuthEnabled = Boolean(basicUser && basicPass);

  if (!basicAuthEnabled) {
    console.warn(
      "⚠️ Basic Auth is disabled because BASIC_AUTH_USER/BASIC_AUTH_PASSWORD are not set.",
    );
  }

  app.use((req, res, next) => {
    if (req.path === "/health") return next();
    if (!basicAuthEnabled) return next();

    const remoteIp = normalizeIp(req.socket.remoteAddress);
    if (shouldBypassAuth(remoteIp, config.auth.bypassCidrs)) return next();

    const creds = parseBasicAuthHeader(req.header("authorization"));
    const ok =
      creds !== null &&
      safeEqualString(creds.username, basicUser) &&
      safeEqualString(creds.password, basicPass);

    if (ok) return next();

    res.setHeader("WWW-Authenticate", 'Basic realm="stualert"');
    res.status(401).send("Unauthorized");
  });

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

  // Test Warning Light Endpoint
  app.post("/api/warning-light/test", (req: Request, res: Response) => {
    console.log("🧪 Test warning light requested");

    gpioService.testWarningLight(() => activityService.getCurrent()?.activity);

    res.status(200).json({
      success: true,
      message: "Warning light test started (5 seconds)",
    });
  });

  // Hard Reset Mower Status (force REST refresh + WS restart)
  app.post("/api/mower/hard-reset", async (req: Request, res: Response) => {
    console.log("🧱 Hard-reset requested");
    try {
      await hardResetMowerStatus();
      res.status(200).json({
        success: true,
        data: buildApiResponse(),
      });
    } catch (err) {
      console.error("❌ Hard-reset failed:", err);
      res.status(500).json({
        success: false,
        message: "Hard-reset failed",
      });
    }
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

    const listener = (event: { current: CurrentActivity }) => {
      send(buildApiResponse(event.current));
    };

    activityService.onActivityChanged(listener);

    req.on("close", () => {
      console.log("Client disconnected from activity stream");
      activityService.removeActivityListener(listener);
    });
  });

  return app;
}

export function startServer(server: Express, port: number): void {
  server.listen(port, () => {
    console.log(`✅ HTTP Server running on http://localhost:${port}`);
  });
}

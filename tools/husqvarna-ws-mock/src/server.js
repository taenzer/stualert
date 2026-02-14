// tools/husqvarna-ws-mock/server.js
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import { events } from "./events.js";

const PORT = 8081;
const WS_PATH = "/v1";

// Cycle (optional)
const CYCLE_EVERY_MS = 10_000; // 10s
const CYCLE_SEQUENCE = [
  "parked",
  "leaving",
  "mowing",
  "going_home",
  "charging",
]; // presets to cycle through

const app = express();
app.use(express.json({ limit: "1mb" }));

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: WS_PATH });

function broadcast(payload) {
  const msg = JSON.stringify(payload);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(msg);
  }
  return msg;
}

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

// WebSocket behavior
wss.on("connection", (ws) => {
  ws.send(JSON.stringify(events.battery()));
});

server.listen(PORT, () => {
  console.log(`[ws-mock] listening on http://0.0.0.0:${PORT}`);
  console.log(`[ws-mock] websocket at ws://localhost:${PORT}${WS_PATH}`);
  console.log(`[ws-mock] cycle every ${CYCLE_EVERY_MS}ms`);
});

let cycleIndex = 0;

function getNextPayload() {
  if (CYCLE_SEQUENCE.length === 0) return null;

  const name = CYCLE_SEQUENCE[cycleIndex];
  const fn = events[name];
  console.log(`[ws-mock] event broadcast: ${name}`);

  // advance index
  cycleIndex += 1;
  if (cycleIndex >= CYCLE_SEQUENCE.length) {
    cycleIndex = 0;
  }

  if (!fn) {
    // Falls sich jemand vertippt hat: sende ein "debug"-Event statt crash
    return {
      type: "mock-error-v1",
      attributes: { message: `Unknown preset in CYCLE_SEQUENCE: "${name}"` },
    };
  }
  return fn();
}

// Cycle loop
if (CYCLE_EVERY_MS > 0) {
  setInterval(() => {
    const p = getNextPayload();
    if (!p) return;
    broadcast(p);
  }, CYCLE_EVERY_MS);
}

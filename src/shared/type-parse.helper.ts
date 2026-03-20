import { WebsocketMessage, WebSocketOpenMessage } from "./ws.type";

export function isWebSocketOpenMessage(
  value: unknown,
): value is WebSocketOpenMessage {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as any).ready === "boolean" &&
    typeof (value as any).connectionId === "string"
  );
}

export function isWebsocketMessage(value: unknown): value is WebsocketMessage {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as any).id === "string" &&
    typeof (value as any).type === "string" &&
    "attributes" in (value as any)
  );
}

export function parseJsonMessage(
  data: unknown,
): WebsocketMessage | WebSocketOpenMessage | undefined {
  let text: string | undefined;

  if (typeof data === "string") {
    text = data;
  } else if (Buffer.isBuffer(data)) {
    text = data.toString("utf8");
  } else if (data instanceof ArrayBuffer) {
    text = Buffer.from(data).toString("utf8");
  } else if (
    data &&
    typeof data === "object" &&
    // Some websocket libs expose Uint8Array
    (data as any).buffer instanceof ArrayBuffer
  ) {
    try {
      text = Buffer.from(data as any).toString("utf8");
    } catch {
      text = undefined;
    }
  }

  const trimmed = text?.trim();
  if (!trimmed) return undefined;
  if (trimmed === "ping" || trimmed === "pong") return undefined;

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (isWebSocketOpenMessage(parsed) || isWebsocketMessage(parsed)) {
      return parsed;
    }
    return undefined;
  } catch (err) {
    return undefined;
  }
}

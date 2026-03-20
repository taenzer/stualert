import { useEffect, useState } from "preact/hooks";
import { ApiMowerUpdateResponse } from "../../../src/shared/api.type";

export function useActivity() {
  const [data, setData] = useState<ApiMowerUpdateResponse>();
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessageAt, setLastMessageAt] = useState<number>(Date.now());

  useEffect(() => {
    let es: EventSource | null = null;
    let retryTimer: number | undefined;
    let retryCount = 0;
    const baseDelay = 2000; // 2s
    const maxDelay = 30000; // 30s

    const connect = () => {
      es = new EventSource("/api/activity/stream");

      es.onopen = () => {
        setConnected(true);
        setError(null);
      };

      es.onmessage = (ev) => {
        // Aktualisiere letzten Nachrichten-Timestamp
        setLastMessageAt(Date.now());

        try {
          const data = JSON.parse(ev.data) as ApiMowerUpdateResponse;
          setData(data);
        } catch (e) {
          setError("Invalid SSE payload");
        }
      };

      es.onerror = () => {
        // Browser reconnectet SSE manchmal automatisch, aber wir schließen und
        // versuchen eigenständig, um kontrolliertes Backoff zu haben.
        setConnected(false);
        setError("SSE connection error (reconnecting…)");

        try {
          es?.close();
        } catch (e) {
          // ignore
        }
        es = null;

        // Exponentielles Backoff mit Obergrenze
        const delay = Math.min(maxDelay, baseDelay * Math.pow(2, retryCount));
        retryCount += 1;
        retryTimer = window.setTimeout(() => {
          connect();
        }, delay);
      };
    };

    // Erste Verbindung aufbauen
    connect();

    return () => {
      if (es) {
        try {
          es.close();
        } catch (e) {
          // ignore
        }
      }
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, []);

  return { data, connected, error, lastMessageAt };
}

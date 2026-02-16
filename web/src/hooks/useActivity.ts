import { useEffect, useState } from "preact/hooks";
import { ApiMowerUpdateResponse } from "../../../src/shared/api.type";

export function useActivity() {
  const [data, setData] = useState<ApiMowerUpdateResponse>();
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let es: EventSource | null = null;
    let retryTimer: number | undefined;
    let retryCount = 0;
    const baseDelay = 2000; // 2s
    const maxDelay = 30000; // 30s

    // Heartbeat / Offline-Erkennung
    let lastMessageAt = Date.now();
    let monitorTimer: number | undefined;
    const heartbeatTimeout = 45_000; // 45s ohne Nachricht -> Backend wahrscheinlich offline
    const monitorInterval = 10_000; // prüfe alle 10s

    const connect = () => {
      es = new EventSource("/api/activity/stream");

      es.onopen = () => {
        setConnected(true);
        setError(null);
        // Verbindung steht wieder, Rücksetzen des Backoffs
        retryCount = 0;
        if (retryTimer) {
          clearTimeout(retryTimer);
          retryTimer = undefined;
        }

        // reset heartbeat timestamp
        lastMessageAt = Date.now();

        // Starte Monitor, falls noch nicht gestartet
        if (!monitorTimer) {
          monitorTimer = window.setInterval(() => {
            if (Date.now() - lastMessageAt > heartbeatTimeout) {
              console.warn(
                "Keine Nachrichten vom Backend innerhalb des Heartbeat-Timeouts. Vermutlich offline.",
              );
              setConnected(false);
              setError("Verbindung verloren. Reconnecting...");

              try {
                es?.close();
              } catch (e) {
                // ignore
              }
              es = null;

              // Exponentielles Backoff mit Obergrenze
              const delay = Math.min(
                maxDelay,
                baseDelay * Math.pow(2, retryCount),
              );
              retryCount += 1;
              if (retryTimer) {
                clearTimeout(retryTimer);
              }
              retryTimer = window.setTimeout(() => {
                connect();
              }, delay);
            }
          }, monitorInterval);
        }
      };

      es.onmessage = (ev) => {
        // Aktualisiere letzten Nachrichten-Timestamp
        lastMessageAt = Date.now();

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

        // Monitor anhalten (falls läuft) — reconnect-Logik übernimmt wieder
        if (monitorTimer) {
          clearInterval(monitorTimer);
          monitorTimer = undefined;
        }

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
      if (monitorTimer) {
        clearInterval(monitorTimer);
      }
    };
  }, []);

  return { data, connected, error };
}

import { useEffect, useState } from "preact/hooks";
import { ApiMowerUpdateResponse } from "../../../src/shared/api.type";

export function useActivity() {
  const [data, setData] = useState<ApiMowerUpdateResponse>();
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const es = new EventSource("/api/activity/stream");
    es.onopen = () => {
      setConnected(true);
      setError(null);
    };

    es.onmessage = (ev) => {
      console.log("Received SSE message:", ev.data);
      try {
        const data = JSON.parse(ev.data) as ApiMowerUpdateResponse;
        console.log(data);
        setData(data);
      } catch (e) {
        setError("Invalid SSE payload");
      }
    };

    es.onerror = () => {
      // Browser reconnectet SSE automatisch.
      setConnected(false);
      setError("SSE connection error (reconnecting…)");
    };
    return () => es.close();
  }, []);

  return { data, connected, error };
}

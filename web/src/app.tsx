import { h, Fragment } from "preact";
import { useState, useEffect } from "preact/hooks";

interface ActivityData {
  activity: string;
  timestamp: string;
  previousActivity: string | null;
}

interface ApiResponse {
  current: ActivityData | null;
  history: ActivityData[];
}

export function App() {
  const [current, setCurrent] = useState<ActivityData | null>(null);
  const [history, setHistory] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivityData = async () => {
    try {
      const response = await fetch("/api/activity");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: ApiResponse = await response.json();
      setCurrent(data.current);
      setHistory(data.history);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Error fetching activity data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchActivityData();
  }, []);

  // Poll every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchActivityData();
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        padding: "20px",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h1>🌾 Mower Activity Monitor</h1>

      {error && (
        <div
          style={{
            color: "red",
            padding: "10px",
            backgroundColor: "#ffe6e6",
            borderRadius: "4px",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && !current && (
        <div style={{ color: "#666", padding: "20px", textAlign: "center" }}>
          Loading activity data...
        </div>
      )}

      {current && (
        <div
          style={{
            border: "1px solid #ddd",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "20px",
            backgroundColor: "#f9f9f9",
          }}
        >
          <h2>Current Status</h2>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              color: "#2c3e50",
              marginBottom: "10px",
            }}
          >
            {current.activity}
          </div>
          <div style={{ color: "#7f8c8d", fontSize: "14px" }}>
            Since: {new Date(current.timestamp).toLocaleString()}
          </div>
          {current.previousActivity && (
            <div
              style={{ color: "#95a5a6", fontSize: "12px", marginTop: "5px" }}
            >
              Previous: {current.previousActivity}
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div>
          <h2>Recent Activity History</h2>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              backgroundColor: "#fff",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              borderRadius: "4px",
              overflow: "hidden",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#34495e", color: "#fff" }}>
                <th
                  style={{
                    padding: "10px",
                    textAlign: "left",
                    borderBottom: "2px solid #2c3e50",
                  }}
                >
                  Activity
                </th>
                <th
                  style={{
                    padding: "10px",
                    textAlign: "left",
                    borderBottom: "2px solid #2c3e50",
                  }}
                >
                  Timestamp
                </th>
                <th
                  style={{
                    padding: "10px",
                    textAlign: "left",
                    borderBottom: "2px solid #2c3e50",
                  }}
                >
                  From
                </th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry, index) => (
                <tr
                  key={`${entry.timestamp}-${index}`}
                  style={{
                    borderBottom: "1px solid #ecf0f1",
                    backgroundColor: index % 2 === 0 ? "#fff" : "#f8f9fa",
                  }}
                >
                  <td style={{ padding: "10px" }}>
                    <span style={{ fontWeight: "bold", color: "#2c3e50" }}>
                      {entry.activity}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      color: "#7f8c8d",
                      fontSize: "14px",
                    }}
                  >
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
                  <td
                    style={{
                      padding: "10px",
                      color: "#95a5a6",
                      fontSize: "13px",
                    }}
                  >
                    {entry.previousActivity || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !current && !error && (
        <div style={{ color: "#95a5a6", padding: "20px", textAlign: "center" }}>
          No activity data available yet. Waiting for mower connection...
        </div>
      )}
    </div>
  );
}

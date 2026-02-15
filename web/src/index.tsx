import { render } from "preact";
import { useActivity } from "./hooks/useActivity";

export function App() {
  const { data, connected, error } = useActivity();

  return (
    <div class="flex justify-center p-10">
      <div class="bg-base-200 p-4 rounded shadow border border-neutral-300">
        <div class="flex gap-8 items-center">
          <h1 class="text-xl font-bold">StuAlert Dashboard</h1>
          {connected && (
            <span class="inline-flex items-center border border-success text-success text-xs font-medium px-1.5 py-0.5 rounded-sm">
              <span class="w-2 h-2 me-1 bg-success rounded-full animate-pulse"></span>
              Verbunden
            </span>
          )}
          {!connected && (
            <span class="inline-flex items-center border border-error text-error text-xs font-medium px-1.5 py-0.5 rounded-sm">
              <span class="w-2 h-2 me-1 bg-error rounded-full animate-pulse"></span>
              Getrennt
            </span>
          )}
        </div>
        <div class="divider my-2"></div>
        <div>
          <span>Aktueller Status:&nbsp;</span>
          <span class="font-semibold">{data?.activity ?? "Unbekannt"}</span>
        </div>

        <div>
          <div class="btn btn-sm w-full mt-4">Warnlicht testen</div>
        </div>
        {error && <div class="text-red-600">{error}</div>}
        <div class="divider divider-start text-sm">Verlauf</div>
        <div>
          {data?.history
            .sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1))
            .map((entry) => (
              <div class="flex items-center gap-4 py-1">
                <div class="w-3 h-3 bg-gray-400 rounded-full"></div>
                <div>
                  <div class="font-semibold">{entry.activity}</div>
                  <div class="text-xs text-gray-500">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}

render(<App />, document.getElementById("app"));

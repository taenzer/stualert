import { render } from "preact";
import { useActivity } from "./hooks/useActivity";
import {
  MowerActivity,
  translateMowerActivity,
} from "../../src/shared/mower.type";
import { MowerIcon } from "./components/mower-icon";
import { Flash } from "./components/flash";
import { RelayState } from "../../src/shared/gpio.type";

export function App() {
  const { data, connected, error } = useActivity();

  const bntClass = (activity: MowerActivity) => {
    switch (activity) {
      case MowerActivity.UNKNOWN:
      case MowerActivity.NOT_APPLICABLE:
        return "";
      case MowerActivity.MOWING:
        return "btn-success";
      case MowerActivity.GOING_HOME:
      case MowerActivity.LEAVING:
        return "btn-warning";
      case MowerActivity.CHARGING:
      case MowerActivity.PARKED_IN_CS:
        return "btn-neutral";
      case MowerActivity.STOPPED_IN_GARDEN:
        return "btn-error";
      default:
        return activity;
    }
  };

  return (
    <div class="flex justify-center p-4">
      <div class="w-full max-w-xl flex flex-col items-center">
        <div class="text-xl">
          <Flash active={data && data.warningLightStatus == RelayState.ON} />
        </div>
        <div class="bg-base-200 p-4 rounded shadow border border-neutral-300 w-full">
          <div class="flex sm:gap-8 sm:items-center items-start justify-between flex-col gap-1 sm:flex-row">
            <div class="flex gap-2 items-center">
              <h1 class="text-xl font-bold">StuAlert Dashboard</h1>
            </div>
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
          {error && (
            <div class="alert alert-error border-error! alert-soft">
              <span class="font-semibold">Fehler:</span>
              <span>{error}</span>
            </div>
          )}
          {connected && (
            <div>
              <div>
                <button
                  class={`btn btn-block cursor-default btn-md sm:btn-xl ${bntClass(data?.activity ?? MowerActivity.UNKNOWN)}`}
                >
                  <MowerIcon />
                  {translateMowerActivity(
                    data?.activity ?? MowerActivity.UNKNOWN,
                  )}
                  ...
                </button>
              </div>

              <div>
                <div class="btn btn-sm w-full mt-4">Warnlicht testen</div>
              </div>

              <div class="divider divider-start text-sm">
                Aktivitätsprotokoll
              </div>
              <div class="">
                <ul class="timeline timeline-vertical timeline-compact">
                  {data?.history
                    .sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1))
                    .map((entry) => (
                      <li class="odd:bg-base-300 even:bg-base-100/50 px-2 rounded">
                        <hr class="bg-neutral-300" />
                        <div class="timeline-middle">
                          <div class="w-3 h-3 bg-gray-400 rounded-full"></div>
                        </div>
                        <div class="timeline-end leading-snug py-2 px-2">
                          <p class="text-xs italic">
                            ab {new Date(entry.timestamp).toLocaleTimeString()}{" "}
                            Uhr
                          </p>
                          <p class="text-sm uppercase font-semibold">
                            {translateMowerActivity(entry.activity)}
                          </p>
                        </div>
                        <hr class="bg-neutral-300" />
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

render(<App />, document.getElementById("app"));

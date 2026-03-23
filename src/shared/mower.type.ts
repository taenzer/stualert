export type Mower = {
  mode: MowerMode;
  activity: MowerActivity;
};

export enum MowerMode {
  MAIN_AREA = "MAIN_AREA",
  SECONDARY_AREA = "SECONDARY_AREA",
  HOME = "HOME",
  DEMO = "DEMO",
  UNKNOWN = "UNKNOWN",
  POI = "POI",
}

export enum MowerActivity {
  UNKNOWN = "UNKNOWN",
  NOT_APPLICABLE = "NOT_APPLICABLE",
  MOWING = "MOWING",
  GOING_HOME = "GOING_HOME",
  CHARGING = "CHARGING",
  LEAVING = "LEAVING",
  PARKED_IN_CS = "PARKED_IN_CS",
  STOPPED_IN_GARDEN = "STOPPED_IN_GARDEN",
  PAUSED = "PAUSED",
}

export enum MowerState {
  UNKNOWN = "UNKNOWN",
  PAUSED = "PAUSED",
  IN_OPERATION = "IN_OPERATION",
  WAIT_UPDATING = "WAIT_UPDATING",
  WAIT_POWER_UP = "WAIT_POWER_UP",
  RESTRICTED = "RESTRICTED",
  OFF = "OFF",
  STOPPED = "STOPPED",
  ERROR = "ERROR",
  FATAL_ERROR = "FATAL_ERROR",
  ERROR_AT_POWER_UP = "ERROR_AT_POWER_UP",
}

export function translateMowerActivity(activity: MowerActivity): string {
  switch (activity) {
    case MowerActivity.UNKNOWN:
      return "Unbekannt";
    case MowerActivity.NOT_APPLICABLE:
      return "Nicht anwendbar";
    case MowerActivity.MOWING:
      return "Mäht Rasen";
    case MowerActivity.GOING_HOME:
      return "Fährt zur Ladestation";
    case MowerActivity.CHARGING:
      return "Lädt Akku";
    case MowerActivity.LEAVING:
      return "Verlässt Ladestation";
    case MowerActivity.PARKED_IN_CS:
      return "In Ladestation geparkt";
    case MowerActivity.STOPPED_IN_GARDEN:
      return "Im Garten gestoppt";
    case MowerActivity.PAUSED:
      return "Pausiert";
    default:
      return activity;
  }
}

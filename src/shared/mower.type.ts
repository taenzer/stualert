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
}

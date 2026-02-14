export const events = {
  mowing: () => ({
    id: "mower-123",
    type: "mower-event-v2",
    attributes: {
      mower: {
        activity: "MOWING",
        state: "IN_OPERATION",
        mode: "MAIN_AREA",
      },
    },
  }),
  going_home: () => ({
    id: "mower-123",
    type: "mower-event-v2",
    attributes: {
      mower: {
        activity: "GOING_HOME",
        state: "IN_OPERATION",
        mode: "MAIN_AREA",
      },
    },
  }),
  leaving: () => ({
    id: "mower-123",
    type: "mower-event-v2",
    attributes: {
      mower: {
        activity: "LEAVING",
        state: "IN_OPERATION",
        mode: "MAIN_AREA",
      },
    },
  }),
  parked: () => ({
    id: "mower-123",
    type: "mower-event-v2",
    attributes: {
      mower: {
        activity: "PARKED_IN_CS",
        state: "IN_OPERATION",
        mode: "MAIN_AREA",
      },
    },
  }),
  charging: () => ({
    id: "mower-123",
    type: "mower-event-v2",
    attributes: {
      mower: {
        activity: "CHARGING",
        state: "IN_OPERATION",
        mode: "MAIN_AREA",
      },
    },
  }),
  battery: () => ({
    id: "mower-123",
    type: "battery-event-v2",
    attributes: {
      battery: {
        batteryPercent: 77,
      },
    },
  }),
};

export const settingsType = "json";
export const settingsFile = "settings.json";

export const StateMap = {
    on: "on",
    off: "off",
    open: "open",
    opening: "open",
    closing: "closed",
    closed: "closed",
    cleaning: "on",
    returning: "off",
    docked: "off",
    paused: "off",
    error: "off",
    idle: "off",
}

export const ActionMap = {
    on: "turn_off",
    off: "turn_on",
    open: "close_cover",
    opening: "close_cover",
    closing: "open_cover",
    closed: "open_cover",
    cleaning: "stop",
    returning: "start",
    docked: "start",
    paused: "start",
    error: "start",
    idle: "start",
}

export const ForcedMap = {
    turn_off: "off",
    turn_on: "on",
    close_cover: "closed",
    open_cover: "open",
    start: "on",
    stop: "off",
}

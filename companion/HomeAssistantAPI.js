/**
 * @module HomeAssistantAPI
 * @brief Provides interface for HomeAssistant communication
 */
import { gettext } from "i18n";
import { sendData, isEmpty } from "../common/utils";

const Groups = {
    switch: "switch",
    light: "light",
    group: "homeassistant",
    script: "script",
    automation: "automation",
    button: "button",
    cover: "cover",
    camera: "camera",
    fan: "fan",
    siren: "siren",
    vacuum: "vacuum",
    humidifier: "humidifier"
}

const NextStateOverrides = {
    script: "turn_on",
    automation: "trigger",
    button: "press"
}

const ForcedStates = {
    turn_on: "on",
    turn_off: "off",
    close_cover: "closed",
    open_cover: "open",
}

const StatesMap = {
    cleaning: "on",
    returning: "on",
    docked: "off",
    paused: "off",
    error: "off",
    idle: "off",
    recording: "on",
    streaming: "on",
}

/**
 * Create HomeAssistantAPI class object
 */
export function HomeAssistantAPI() {
    this.url = "";
    this.port = "";
    this.token = "";
    this.force = false;
}

/**
 * Configuration validity
 * @return True if configuration contains valid data, otherwise false.
 */
HomeAssistantAPI.prototype.isValid = function() {
    let self = this;
    return self.url !== undefined && self.port !== undefined && self.token !== undefined
        && self.url !== "" && self.port !== "" && self.token !== "";
}

/**
 * Configuration validity
 * @param {string} url - HomeAssistant instance URL 
 * @param {string} port - HomeAssistant instance port
 * @param {string} token - Access token
 * @param {boolean} force - Force update flag
 */
HomeAssistantAPI.prototype.setup = function(url, port, token, force) {
    let self = this;
    self.changeUrl(url);
    self.changePort(port);
    self.changeToken(token);
    self.changeForce(force);
}

/**
 * Change URL
 * @param {string} url - HomeAssistant instance URL 
 */
HomeAssistantAPI.prototype.changeUrl = function(url) {
    let self = this;
    if (url !== undefined) {
        self.url = url;
    }
    else {
        self.url = '127.0.0.1';
    }
}

/**
 * Change port number
 * @param {string} port - HomeAssistant instance port
 */
HomeAssistantAPI.prototype.changePort = function(port) {
    let self = this;
    if (port !== undefined) {
        self.port = port;
    }
    else {
        self.port = '8123';
    }
}

/**
 * Change token
 * @param {string} token - Access token
 */
HomeAssistantAPI.prototype.changeToken = function(token) {
    let self = this;
    if (token !== undefined) {
        self.token = token;
    }
    else {
        self.token = '';
    }
}

/**
 * Change force update flag
 * @param {boolean} force - Force update flag
 */
HomeAssistantAPI.prototype.changeForce = function(force) {
    let self = this;
    if (force !== undefined) {
        self.force = force;
    }
    else {
        self.force = true;
    }
}

/**
 * HomeAssistant address
 * @return The complete HomeAssistant address including url and port
 */
HomeAssistantAPI.prototype.address = function() {
    let self = this;
    return self.url + ':' + self.port
}

/**
 * Fetch entity
 * @param {string} entity - Entity name
 */
HomeAssistantAPI.prototype.fetchEntity = function(entity) {
    let self = this;
    if (self.isValid()) {
        fetch(`${self.address()}/api/states/${entity}`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${self.token}`,
                "content-type": "application/json",
            }
        })
        .then(async(response) => {
            if (response.ok) {
                let data = await response.json();
                let msgData = {
                    key: "add",
                    id: data["entity_id"],
                    name: data["entity_id"],
                    state: StatesMap[data["state"]] || data["state"],
                };
                if (data["attributes"] && data["attributes"]["friendly_name"]) {
                    msgData.name = data["attributes"]["friendly_name"];
                }
                if (self.isExecutable(data["entity_id"])) {
                    msgData.state = 'exe'
                }
                sendData(msgData);
            }
            else {
                console.log(`[fetchEntity] ${gettext("error")} ${response.status}`);
            }
        })
        .catch(err => console.log('[fetchEntity]: ' + err));
    }
}

/**
 * Fetch HomeAssistant API status
 */
HomeAssistantAPI.prototype.fetchApiStatus = function() {
    let self = this;
    if (self.isValid()) {
        fetch(`${self.address()}/api/config`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${self.token}`,
                "content-type": "application/json",
            }
        })
        .then(async(response) => {
            let data = await response.json();
            if (response.status === 200) {
                sendData({key: "api", value: "ok", name: data["location_name"]});
            }
            else {
                const json = JSON.stringify({
                    key: "api",
                    value: `${gettext("error")} ${response.status}`
                });
                sendData(json);
            }
        })
        .catch(err => {
            console.log('[fetchApiStatus]: ' + err);
            sendData({key: "api", value: gettext("connection_error")});
        })
    }
}

/**
 * Change entity
 * @param {string} entity - Entity name
 * @param {string} state - New state value
 */
HomeAssistantAPI.prototype.changeEntity = function(entity, state) {
    let self = this;
    if (self.isValid()) {
        const json = JSON.stringify({
            entity_id: `${entity}`
        });
        const domain = entity.split('.')[0];
        const group = Groups[domain];
        state = NextStateOverrides[domain] || state;
        //DEBUG console.log(`SENT ${self.url}/api/services/${group}/${state} FOR ${entity}`);
        fetch(`${self.address()}/api/services/${group}/${state}`, {
            method: "POST",
            body: json,
            headers: {
                "Authorization": `Bearer ${self.token}`,
                "content-type": "application/json",
            }
        })
        .then(async(response) => {
            if (response.ok) {
                let data = await response.json();
                //DEBUG console.log('RECEIVED ' + JSON.stringify(data));
                if (self.force) {
                    let msgData = {
                        key: "change",
                        id: entity,
                        state: ForcedStates[state] || state,
                    };
                    if (!self.isExecutable(entity)) {
                        //DEBUG console.log('FORCED ' + JSON.stringify(msgData));
                        sendData(msgData);
                    }
                }
                else if (!isEmpty(data)) {
                    data.forEach(element => {
                        if (element["entity_id"] === entity) {
                            let msgData = {
                                key: "change",
                                id: element["entity_id"],
                                state: StatesMap[element["state"]] || element["state"],
                            };
                            if (!self.isExecutable(element["entity_id"])) {
                                sendData(msgData);
                            }
                        }
                    })
                }
            }
            else {
                console.log(`[changeEntity] ${gettext("error")} ${response.status}`);
            }
        })
        .catch(err => console.log('[changeEntity]: ' + err));
    }
}

/**
 * Returns if an entity is an executable
 * @param {string} entity - Entity name
 * @return True if entity is an executable, otherwise false
 */
HomeAssistantAPI.prototype.isExecutable = function(entity) {
    if (!entity.startsWith("script") && !entity.startsWith("automation") && !entity.startsWith("button")) {
        return false;
    }
    return true;
}

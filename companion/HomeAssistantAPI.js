/**
 * @module HomeAssistantAPI
 * @brief Provides interface for HomeAssistant communication
 */
import { gettext } from "i18n";
import { sendData, isEmpty } from "../common/utils";
import { Entity, Entities } from "./Entity";

const Groups = {
    switch: "switch",
    light: "light",
    group: "homeassistant",
    script: "script",
    automation: "automation",
    button: "button",
    cover: "cover",
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

/**
 * Create HomeAssistantAPI class object
 */
export function HomeAssistantAPI() {
    this.url = "";
    this.port = "";
    this.token = "";
    this.force = false;
    this.status = "loading";
    this.name = "";
    this.entities = new Entities();
}

/**
 * Configuration validity
 * @return True if configuration contains valid data, otherwise false
 */
HomeAssistantAPI.prototype.isValid = function() {
    let self = this;
    return self.url !== undefined && self.port !== undefined && self.token !== undefined
        && self.url !== "" && self.port !== "" && self.token !== "";
}

/**
 * Setup configuration
 * @param {string} url - HomeAssistant instance URL 
 * @param {string} port - HomeAssistant instance port
 * @param {string} token - Access token
 * @param {boolean} force - Force update flag
 * @return True if configuration is valid
 */
HomeAssistantAPI.prototype.setup = function(url, port, token, force) {
    let self = this;
    self.changeUrl(url);
    self.changePort(port);
    self.changeToken(token);
    self.changeForce(force);
    return self.isValid();
}

/**
 * Send update of api status and all entities
 */
HomeAssistantAPI.prototype.update = function() {
    let self = this;
    sendData({key: "api", value: self.status, name: self.name});
    sendData({key: "update", value: "begin"});
    self.entities.list.forEach((entity, index) => {
        sendData({key: "add", index: index, id: entity.id, name: entity.name, state: entity.state});
    });
    sendData({key: "update", value: "end"});
}

/**
 * Clear internal entity list
 */
HomeAssistantAPI.prototype.clear = function() {
    let self = this;
    self.entities.clear();
}

/**
 * Sort internal entity list
 */
HomeAssistantAPI.prototype.sort = function() {
    let self = this;
    self.entities.sort();
}

/**
 * Change URL
 * @param {string} url - HomeAssistant instance URL
 * @return True if configuration is valid
 */
HomeAssistantAPI.prototype.changeUrl = function(url) {
    let self = this;
    if (url !== undefined) {
        self.url = url;
    }
    else {
        self.url = '127.0.0.1';
    }
    return self.isValid();
}

/**
 * Change port number
 * @param {string} port - HomeAssistant instance port
 * @return True if configuration is valid
 */
HomeAssistantAPI.prototype.changePort = function(port) {
    let self = this;
    if (port !== undefined) {
        self.port = port;
    }
    else {
        self.port = '8123';
    }
    return self.isValid();
}

/**
 * Change token
 * @param {string} token - Access token
 * @return True if configuration is valid
 */
HomeAssistantAPI.prototype.changeToken = function(token) {
    let self = this;
    if (token !== undefined) {
        self.token = token;
    }
    else {
        self.token = '';
    }
    return self.isValid();
}

/**
 * Change force update flag
 * @param {boolean} force - Force update flag
 * @return True if configuration is valid
 */
HomeAssistantAPI.prototype.changeForce = function(force) {
    let self = this;
    if (force !== undefined) {
        self.force = force;
    }
    else {
        self.force = true;
    }
    return self.isValid();
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
 * Fetch new entity
 * @param {string} entity - Entity ID
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
                    id: data["entity_id"],
                    name: data["entity_id"],
                    state: data["state"],
                };
                if (data["attributes"] && data["attributes"]["friendly_name"]) {
                    msgData.name = data["attributes"]["friendly_name"];
                }
                if (self.isExecutable(data["entity_id"])) {
                    msgData.state = 'exe'
                }
                //DEBUG console.log('ADDED ' + JSON.stringify(msgData));
                self.entities.add(msgData.id, msgData.name, msgData.state);
                slef.entities.sort();
                self.update();
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
                self.status = "ok";
                self.name = data["location_name"];
                sendData({key: "api", value: "ok", name: self.name});
            }
            else {
                self.status = `${gettext("error")} ${response.status}`;
                sendData({key: "api", value: self.status});
            }
        })
        .catch(err => {
            console.log('[fetchApiStatus]: ' + err);
            self.status = gettext("connection_error");
            sendData({key: "api", value: self.status});
        })
    }
    else {
        self.status = gettext("invalid_config");
        sendData({key: "api", value: self.status});
    }
}

/**
 * Change entity
 * @param {string} entity - Entity ID
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
                        key: "set",
                        id: entity,
                        state: ForcedStates[state] || state,
                    };
                    if (!self.isExecutable(entity)) {
                        //DEBUG console.log('FORCED ' + JSON.stringify(msgData));
                        self.entities.set(msgData.id, msgData.state);
                        sendData(msgData);
                    }
                }
                else if (!isEmpty(data)) {
                    data.forEach(element => {
                        if (element["entity_id"] === entity) {
                            let msgData = {
                                key: "set",
                                id: element["entity_id"],
                                state: element["state"],
                            };
                            if (!self.isExecutable(element["entity_id"])) {
                                //DEBUG console.log('UPDATED ' + JSON.stringify(msgData));
                                self.entities.set(msgData.id, msgData.state);
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
 * @param {string} entity - Entity ID
 * @return True if entity is an executable, otherwise false
 */
HomeAssistantAPI.prototype.isExecutable = function(entity) {
    if (!entity.startsWith("script") && !entity.startsWith("automation") && !entity.startsWith("button")) {
        return false;
    }
    return true;
}


import * as messaging from "messaging";
import { gettext } from "i18n";

import { settingsStorage } from "settings";
import { sendData, isEmpty } from "../common/utils";

let URL = "";
let Port = "8123";
let Token = "";
let Force = false;

// Return address as URL + Port
function address() {
    return URL + ':' + Port;
}

// Settings have been changed
settingsStorage.onchange = function(evt) {
    if (evt.key === "url") {
        let data = JSON.parse(evt.newValue);
        sendData({key: "url", value: data["name"]});
    }
    else if (evt.key === "port") {
        let data = JSON.parse(evt.newValue);
        sendData({key: "port", value: data["name"]});
    }
    else if (evt.key === "token") {
        let data = JSON.parse(evt.newValue);
        sendData({key: "token", value: data["name"]});
    }
    else if (evt.key === "entities") {
        sendData({key: "clear"});
        JSON.parse(evt.newValue).forEach(element => {
            fetchEntity(address(), Token, element["name"]);
        })
    }
    else if (evt.key === "force") {
        let data = JSON.parse(evt.newValue);
        sendData({key: "force", value: data});
    }
}

// Get entity info
function fetchEntity(url, token, entity) {
    fetch(`${url}/api/states/${entity}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "content-type": "application/json",
        }
    })
    .then(async(response) => {
        let data = await response.json();
        let msgData = {
            key: "add",
            id: data["entity_id"],
            name: data["entity_id"],
            state: data["state"],
        };
        if (data["attributes"] && data["attributes"]["friendly_name"]) {
            msgData.name = data["attributes"]["friendly_name"];
        }
        if (data["entity_id"].startsWith("script")) {
            msgData.state = 'exe'
        }
        else if (data["entity_id"].startsWith("automation")) {
            msgData.state = 'exe'
        }
        sendData(msgData);
    })
    .catch(err => console.log('[FETCH]: ' + err));
}

// Get Availability of HA
function fetchApiStatus(url, token) {
    fetch(`${url}/api/`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "content-type": "application/json",
        }
    })
    .then(async(response) => {
        let data = await response.json();
        if (response.status === 200) {
            if (data["message"] === "API running.") {
                sendData({key: "api", value: "ok"});
            }
            else {
                sendData({key: "api", value: data["message"]});
            }
        }
        else {
            const json = JSON.stringify({
                key: "api",
                value: `ErrorCode ${response.status}`
            });
            sendData(json);
        }
    })
    .catch(err => {
        console.log('[FETCH]: ' + err);
        sendData({key: "api", value: gettext("connection_error")});
    })
}

// Change entity state
function changeEntity(url, token, entity, state) {
    const json = JSON.stringify({
        entity_id: `${entity}`
    });
    let group = "switch";
    if (entity.startsWith("light")) {
        group = "light";
    }
    else if (entity.startsWith("group")) {
        group = "homeassistant";
    }
    else if (entity.startsWith("script")) {
        group = "script";
        state = "turn_on";
    }
    else if (entity.startsWith("automation")) {
        group = "automation";
        state = "trigger";
    }
    //DEBUG console.log(`SENT ${url}/api/services/${group}/${state} FOR ${entity}`);
    fetch(`${url}/api/services/${group}/${state}`, {
        method: "POST",
        body: json,
        headers: {
            "Authorization": `Bearer ${token}`,
            "content-type": "application/json",
        }
    })
    .then(async(response) => {
        let data = await response.json();
        //DEBUG console.log('RECEIVED ' + JSON.stringify(data));
        if (Force) {
            let msgData = {
                key: "change",
                id: entity,
                state: state === 'turn_on' ? 'on' : 'off'
            };
            if (!entity.startsWith("script") && !entity.startsWith("automation")) {
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
                        state: element["state"],
                    };
                    if (!element["entity_id"].startsWith("script") && !element["entity_id"].startsWith("automation")) {
                        sendData(msgData);
                    }
                }
            })
        }
    })
    .catch(err => console.log('[FETCH]: ' + err));
}

// Message socket opens
messaging.peerSocket.onopen = () => {
    console.log("Socket open");
};
  
// Message socket closes
messaging.peerSocket.onclose = () => {
    console.log("Socket closed");
};

// Received message
messaging.peerSocket.onmessage = evt => {
    console.log(`Received: ${JSON.stringify(evt.data)}`);
    if (evt.data.key === "change") {
        changeEntity(address(), Token, evt.data.entity, evt.data.state);
    }
    else if (evt.data.key === "url") {
        URL = evt.data.value;
        if (URL && Port && Token) {
            fetchApiStatus(address(), Token);
        }
    }
    else if (evt.data.key === "port") {
        Port = evt.data.value;
        if (URL && Port && Token) {
            fetchApiStatus(address(), Token);
        }
    }
    else if (evt.data.key === "token") {
        Token = evt.data.value;
        if (URL && Port && Token) {
            fetchApiStatus(address(), Token);
        }
    }
    else if (evt.data.key === "entities") {
        if (evt.data.value) {
            sendData({key: "clear"});
            evt.data.value.forEach(element => {
                fetchEntity(address(), Token, element["name"]);
            })
        }
    }
    else if (evt.data.key === "force") {
        Force = evt.data.value;
    }
};

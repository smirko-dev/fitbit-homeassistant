
import * as messaging from "messaging";

import { settingsStorage } from "settings";
import { sendData } from "../common/utils";

let Available = false;
let IP = ""
let Token = ""

// Settings have been changed
settingsStorage.onchange = function(evt) {
    if (evt.key === "ip") {
        let data = JSON.parse(evt.newValue);
        console.log("Changed IP " + data["name"]);
        sendData({key: "ip", value: data["name"]});
    }
    else if (evt.key === "token") {
        let data = JSON.parse(evt.newValue);
        console.log("Changed Token " + data["name"]);
        sendData({key: "token", value: data["name"]});
    }
    else if (evt.key === "entities") {
        sendData({key: "clear"});
        JSON.parse(evt.newValue).forEach(element => {
            fetchEntity(IP, Token, element["name"]);
        })
    }
}

// Get entity info
function fetchEntity(ip, token, entity) {
    fetch(`http://${ip}:8123/api/states/${entity}`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "content-type": "application/json",
        }
    })
    .then(function(res) {
        return res.json();
    })
    .then(function(data) {
        let msgData = {
            key: "add",
            id: data["entity_id"],
            name: data["entity_id"],
            state: data["state"],
        };
        if (data["attributes"] && data["attributes"]["friendly_name"]) {
            msgData.name = data["attributes"]["friendly_name"];
        }
        if (msgData.state === "on") {
            msgData.state = "ON";
        }
        else {
            msgData.state = "OFF";
        }
        sendData(msgData);
    })
    .catch(err => console.log('[FETCH]: ' + err));
}

// Get Availability of HA
function fetchApiStatus(ip, token) {
    fetch(`http://${ip}:8123/api/`, {
        method: "GET",
        headers: {
            "Authorization": `Bearer ${token}`,
            "content-type": "application/json",
        }
    })
    .then(function(res) {
        return res.json();
    })
    .then(function(data) {
        if (data["message"] === "API running.") {
            sendData({key: "api", value: "true"});
            Available = true;
        }
        else {
            sendData({key: "api", value: "false"});
            Available = false;
        }
    })
    .catch(err => console.log('[FETCH]: ' + err));
}

// Change entity state
function changeEntity(ip, token, entity, state) {
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
    console.log(`Update ${entity}: ${state} (${json})`);
    fetch(`http://${ip}:8123/api/services/${group}/${state}`, {
        method: "POST",
        body: json,
        headers: {
            "Authorization": `Bearer ${token}`,
            "content-type": "application/json",
        }
    })
    .then(function(res) {
        return res.json();
    })
    .then(function(data) {
        data.forEach(element => {
            if (element["entity_id"] === entity) {
                let msgData = {
                    key: "change",
                    id: element["entity_id"],
                    state: element["state"],
                };
                sendData(msgData);
            }
        })
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
        changeEntity(IP, Token, evt.data.entity, evt.data.state);
    }
    else if (evt.data.key === "ip") {
        IP = evt.data.value;
        if (IP && Token) {
            fetchApiStatus(IP, Token);
        }
    }
    else if (evt.data.key === "token") {
        Token = evt.data.value;
        if (IP && Token) {
            fetchApiStatus(IP, Token);
        }
    }
    else if (evt.data.key === "entities") {
        sendData({key: "clear"});
        evt.data.value.forEach(element => {
            fetchEntity(IP, Token, element["name"]);
        })
    }
};

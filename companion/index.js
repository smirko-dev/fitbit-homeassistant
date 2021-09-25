import { settingsStorage } from "settings";
import * as messaging from "messaging";

const Available = false;
const IP = "127.0.0.1"
const Token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiI4MGVhOGEwOWI4MjE0NTkxODI2Y2U4Njk5ZjQ3OTNhNSIsImlhdCI6MTYzMjUwNjEyOCwiZXhwIjoxOTQ3ODY2MTI4fQ.CnfNP0AS4B7Xd98_tfALaabGg7SexMkJmjeDY-1EA3M"

// Settings have been changed
settingsStorage.onchange = function(evt) {
    if (evt.key === "ip") {
        let data = JSON.parse(evt.newValue);
        console.log("Changed IP " + data["name"]);
        IP = data["name"];
    }
    else if (evt.key === "token") {
        let data = JSON.parse(evt.newValue);
        console.log("Changed Token " + data["name"]);
        Token = data["name"];
    }
    else if (evt.key === "entities") {
        sendData({key: "clear"});
        JSON.parse(evt.newValue).forEach(element => {
            fetchEntity("192.168.178.100", Token, element["name"]);
        })
    }
}

// Send data to app
function sendData(data) {
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        console.log(`Sent: ${JSON.stringify(data)}`);
        messaging.peerSocket.send(data);
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
function updateEntity(ip, token, entity, state) {
    const json = JSON.stringify({
        entity_id: `${entity}`
    });
    console.log(`Update ${entity}: ${state} (${json})`);
    fetch(`http://${ip}:8123/api/services/switch/${state}`, {
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
        console.log(`Ack ${JSON.stringify(data)}`);
        data.forEach(element => {
            if (element["entity_id"] === entity) {
                let msgData = {
                    key: "update",
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
    restoreSettings();
};
  
// Message socket closes
messaging.peerSocket.onclose = () => {
    console.log("Socket closed");
};

// Restore any previously saved settings and send to the device
function restoreSettings() {
    fetchApiStatus("192.168.178.100", Token);
}

// Received message
messaging.peerSocket.onmessage = evt => {
    console.log(`Received: ${JSON.stringify(evt.data)}`);
    if (evt.data.key === "entity") {
        updateEntity("192.168.178.100", Token, evt.data.entity, evt.data.state);
    }
};

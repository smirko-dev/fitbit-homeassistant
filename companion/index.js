
import * as messaging from "messaging";
import { gettext } from "i18n";
import { me as companion } from "companion";

import { settingsStorage } from "settings";
import { sendData, isEmpty } from "../common/utils";

var HA = require('./HomeAssistantAPI.js');
HA = new HomeAssistantAPI("127.0.0.1:8123", "", False);

let URL = "";
let Port = "8123";
let Token = "";
let Force = false;

const groups = {
    switch: "switch",
    light: "light",
    group: "homeassistant",
    script: "script",
    automation: "automation",
    cover: "cover",
}

const nextStateOverrides = {
    script: "turn_on",
    automation: "trigger",
}

const forcedStates = {
    turn_on: "on",
    turn_off: "off",
    close_cover: "closed",
    open_cover: "open",
}

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
            HA.fetchEntity(element["name"]);
        });
    }
    else if (evt.key === "force") {
        let data = JSON.parse(evt.newValue);
        sendData({key: "force", value: data});
    }
}

// Settings changed while companion was not running
if (companion.launchReasons.settingsChanged) {
    const keys = ["url", "port", "token", "force"];
    keys.forEach(function(keyName, index, array) {
        sendData({key: keyName, value: settingsStorage.getItem(keyName)});
    });
    sendData({key: "clear"});
    JSON.parse(settingsStorage?.getItem("entities"))?.forEach((element) => {
        HA.fetchEntity(element["name"]);
    });
}

// Message socket opens
messaging.peerSocket.onopen = () => {
    console.log('Socket open');
};

// Message socket closes
messaging.peerSocket.onclose = () => {
    console.log('Socket closed');
};

// Received message
messaging.peerSocket.onmessage = evt => {
    console.log('Received', JSON.stringify(evt.data));
    if (evt.data.key === "change") {
        HA.changeEntity(evt.data.entity, evt.data.state);
    }
    else if (evt.data.key === "url") {
        URL = evt.data.value;
        HA.setup(address(), Token, Force);
        if (URL && Port && Token) {
            HA.fetchApiStatus()
        }
    }
    else if (evt.data.key === "port") {
        Port = evt.data.value;
        HA.setup(address(), Token, Force);
        if (URL && Port && Token) {
            HA.fetchApiStatus()
        }
    }
    else if (evt.data.key === "token") {
        Token = evt.data.value;
        HA.setup(address(), Token, Force);
        if (URL && Port && Token) {
            HA.fetchApiStatus()
        }
    }
    else if (evt.data.key === "entities") {
        if (evt.data.value) {
            sendData({key: "clear"});
            evt.data.value.forEach(element => {
                HA.fetchEntity(element["name"]);
            })
        }
    }
    else if (evt.data.key === "force") {
        HA.setup(address(), Token, evt.data.value);
    }
};

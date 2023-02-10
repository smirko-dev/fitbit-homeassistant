
import * as messaging from "messaging";
import { gettext } from "i18n";
import { me as companion } from "companion";

import { settingsStorage } from "settings";
import { sendData, isEmpty } from "../common/utils";

import { HomeAssistantAPI } from "./HomeAssistantAPI";

// Create HomeAssistantAPI object
var HA = new HomeAssistantAPI();

// Load settings
let settings = loadSettings();
applySettings();

// Register for the unload event
companion.onunload = saveSettings;

// Settings have been changed
settingsStorage.onchange = function(evt) {
    if (evt.key === "entities") {
        HA.clear();
        JSON.parse(evt.newValue).forEach(element => {
            HA.fetchEntity(element["name"]);
        });
        HA.sort();
        HA.update();
    }
    else {
        let data = JSON.parse(evt.newValue);
        if (evt.key === "url") {
            HA.changeUrl(data["name"]);
        }
        else if (evt.key === "port") {
            HA.changePort(data["name"]);
        }
        else if (evt.data === "token") {
            HA.changeToken(data["name"]);
        }
        else if (evt.key === "force") {
            HA.changeForce(data);
        }
        if (HA.isValid()) {
            HA.fetchApiStatus();
        }
    }
}

// Settings changed while companion was not running
if (companion.launchReasons.settingsChanged) {
    applySettings();
}

// Message socket opens
messaging.peerSocket.onopen = () => {
    console.log('Companion socket open');
};

// Message socket closes
messaging.peerSocket.onclose = () => {
    console.log('Companion socket closed');
};

// Received message from App
messaging.peerSocket.onmessage = evt => {
    console.log('Received', JSON.stringify(evt.data));
    if (evt.data.key === "set") {
        HA.changeEntity(evt.data.entity, evt.data.state);
    }
    else if (evt.data.key === "refresh") {
        HA.update();
    }
};

// Load settings
function loadSettings() {
    try {
        return fs.readFileSync(settingsFile, settingsType);
    }
    catch (ex) {
        console.error("Error loading settings");
        // Default values
        return {
            url: "localhost",
            port: "8123",
            token: "",
            force: true
        };
    }
}

// Save settings
function saveSettings() {
    fs.writeFileSync(settingsFile, settingsStorage, settingsType);
}

// Apply settings
function applySettings() {
    if (HA.setup(settingsStorage.getItem("url"), settingsStorage.getItem("port"),
        settingsStorage.getItem("token"), settingsStorage.getItem("force"))) {
        HA.fetchApiStatus();

        HA.clear();
        JSON.parse(settingsStorage?.getItem("entities"))?.forEach((element) => {
            HA.fetchEntity(element["name"]);
        });
        HA.sort();
        HA.update();
    }
}

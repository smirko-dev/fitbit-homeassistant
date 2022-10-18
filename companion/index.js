
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

// Register for the unload event
me.onunload = saveSettings;

// Settings have been changed
settingsStorage.onchange = function(evt) {
    if (evt.key === "url") {
        let data = JSON.parse(evt.newValue);
        HA.changeUrl(data["name"]);
        HA.fetchApiStatus();
    }
    else if (evt.key === "port") {
        let data = JSON.parse(evt.newValue);
        HA.changePort(data["name"]);
        HA.fetchApiStatus();
    }
    else if (evt.key === "token") {
        let data = JSON.parse(evt.newValue);
        HA.changeToken(data["name"]);
        HA.fetchApiStatus();
    }
    else if (evt.key === "entities") {
        HA.clear();
        JSON.parse(evt.newValue).forEach(element => {
            HA.fetchEntity(element["name"]);
        });
        HA.sort();
        HA.update();
    }
    else if (evt.key === "force") {
        let data = JSON.parse(evt.newValue);
        HA.changeForce(data);
    }
}

// Settings changed while companion was not running
if (companion.launchReasons.settingsChanged) {
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
    fs.writeFileSync(settingsFile, settings, settingsType);
}

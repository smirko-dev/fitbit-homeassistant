
import * as fs from "fs";
import * as messaging from "messaging";

import { me } from "appbit";
import { settingsType, settingsFile } from "../common/constants";
import { sendData } from "../common/utils";

import document from "document";

const Available = false;
const EntityList = document.getElementById("entityList");

// Load settings
let settings = loadSettings();

// Register for the unload event
me.onunload = saveSettings;

// List of {id: "", name: "", state: ""}
const Entities = [];

function setupList(list, data) {
    list.delegate = {
        getTileInfo: function(index) {
            return {
                type: "item-pool",
                name: data[index].name,
                state: data[index].state,
                index: index
            };
        },
        configureTile: function(tile, info) {
            if (info.type == "item-pool") {
                tile.getElementById("itemText").text = `${info.name}`;
                tile.getElementById("itemState").text = `${info.state}`;
                let touch = tile.getElementById("itemTouch");
                touch.onclick = evt => {
                    console.log(`Touched [${info.index}] ${info.name} = ${info.state}`);
                    let state = "turn_on";
                    if (info.state === "ON") {
                        state = "turn_off";
                    }
                    sendData({key: "change", entity: Entities[info.index].id, state: `${state}`});
                };
            }
        }
    };
    list.length = data.length;
}

// Received message
messaging.peerSocket.onmessage = (evt) => {
    console.log(`Received: ${JSON.stringify(evt)}`);
    if (evt.data.key === "clear") {
        Entities = [];
        settings.entities = [];
    }
    else if (evt.data.key === "add") {
        console.log("Added " + evt.data.id + "(" + evt.data.name + ")");
        Entities.push({id: evt.data.id, name: evt.data.name, state: evt.data.state});
        settings.entities.push({name: evt.data.id});
        setupList(EntityList, Entities);
    }
    else if (evt.data.key === "change") {
        Entities.forEach((entity, index) => {
            if (entity.id === evt.data.id) {
                if (evt.data.state === "on") {
                    Entities[index].state = "ON";
                    console.log("Changed " + entity.id + " ON");
                }
                else {
                    Entities[index].state = "OFF";
                    console.log("Changed " + entity.id + " OFF");
                }
                setupList(EntityList, Entities);
            }
        })
    }
    else if (evt.data.key === "api") {
        if (evt.data.value === "true") {
            Available = true;
        }
        else {
            Available = false;
        }
    }
    else if (evt.data.key === "ip") {
        settings.ip = evt.data.value;
        sendData({key: "ip", value: settings.ip});
    }
    else if (evt.data.key === "token") {
        settings.token = evt.data.value;
        sendData({key: "token", value: settings.token});
    }
}

// Message socket opens
messaging.peerSocket.onopen = () => {
    console.log("Socket open");
    sendData({key: "ip", value: settings.ip});
    sendData({key: "token", value: settings.token});
    sendData({key: "entities", value: settings.entities});
};
  
// Message socket closes
messaging.peerSocket.onclose = () => {
    console.log("Socket closed");
};

// Load settings
function loadSettings() {
    try {
        return fs.readFileSync(settingsFile, settingsType);
    }
    catch (ex) {
        // Default values
        return {
            ip: "localhost",
            token: ""
        };
    }
}

// Save settings
function saveSettings() {
    fs.writeFileSync(settingsFile, settings, settingsType);
}

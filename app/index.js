
import * as fs from "fs";
import * as messaging from "messaging";

import { me } from "appbit";
import { settingsType, settingsFile } from "../common/constants";

import document from "document";

let EntityList = document.getElementById("entityList");
let IP = "";
let Token = "";

// List of {name: "", state: ""}
let Entities = [];

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
                };
            }
        }
    };
    list.length = data.length;
}

// Apply and store settings
function applySettings(ip, token, entities) {
    if (typeof ip !== 'undefined') {
        console.log("Changed settings: " + ip);
        settings.ip = ip;
        IP = ip;
    }
    if (typeof token !== 'undefined') {
        console.log("Changed settings: " + token);
        settings.token = token;
        Token = token;
    }
    if (typeof entities !== 'undefined') {
        settings.entities = entities;
        Entities = entities;
    }
}
  
// Load settings
let settings = loadSettings();
applySettings(settings.ip, settings.token, settings.entities);

function loadSettings() {
    try {
        return fs.readFileSync(settingsFile, settingsType);
    }
    catch (ex) {
        // Default values
        return {};
    }
}
  
// Save settings
function saveSettings() {
    fs.writeFileSync(settingsFile, settings, settingsType);
}

// Update settings
messaging.peerSocket.onmessage = (evt) => {
    if (evt.data.key === "ip") {
        console.log("Received " + evt.data.key + ": " + evt.data.value);
        settings.ip = evt.data.value;
    }
    else if (evt.data.key === "token") {
        console.log("Received " + evt.data.key + ": " + evt.data.value);
        settings.token = evt.data.value;
    }
    else if (evt.data.key === "entities") {
        Entities = []
        evt.data.value.forEach(function(value){
            console.log("Received " + evt.data.key + ": " + value["name"]);
            Entities.push({name: value["name"], state: "OFF"});
        });
        setupList(EntityList, Entities);
    }
}

// Register for the unload event
me.onunload = saveSettings;

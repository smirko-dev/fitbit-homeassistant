
import * as fs from "fs";
import * as messaging from "messaging";

import { me } from "appbit";
import { settingsType, settingsFile } from "../common/constants";

import document from "document";

const Available = false;
const EntityList = document.getElementById("entityList");

// List of {name: "", state: ""}
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
                    sendData({key: "entity", entity: Entities[info.index].name, state: `${state}`});
                };
            }
        }
    };
    list.length = data.length;
}

// Received message
messaging.peerSocket.onmessage = (evt) => {
    console.log(`Received: ${JSON.stringify(evt)}`);
    if (evt.data.key === "entities") {
        Entities = [];
        let data = JSON.parse(evt.data.value);
        data.forEach(entity => {
            console.log("Added " + entity["name"]);
            Entities.push({name: entity["name"], state: "OFF"});
            setupList(EntityList, Entities);
        })
    }
    else if (evt.data.key === "entity") {
        Entities.forEach((entity, index) => {
            if (entity.name === evt.data.id) {
                if (evt.data.state === "on") {
                    Entities[index].state = "ON";
                    console.log("Changed " + entity.name + " ON");
                }
                else {
                    Entities[index].state = "OFF";
                    console.log("Changed " + entity.name + " OFF");
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
}

// Message socket opens
messaging.peerSocket.onopen = () => {
    console.log("Socket open");
};
  
// Message socket closes
messaging.peerSocket.onclose = () => {
    console.log("Socket closed");
};

function sendData(data) {
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        console.log(`Sent: ${JSON.stringify(data)}`);
        messaging.peerSocket.send(data);
    }
}

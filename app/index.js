
import * as fs from "fs";
import * as messaging from "messaging";

import { me } from "appbit";
import { gettext } from "i18n";
import { sendData } from "../common/utils";

import document from "document";

const EntityList = document.getElementById("entityList");
const AddressText = document.getElementById("addressText");
AddressText.text = gettext("loading");

// List of {id: "", name: "", state: ""}
let Entities = [];

// List of state change by touch event
const NextStates = {
    on: "turn_off",
    off: "turn_on",
    open: "close_cover",
    opening: "close_cover",
    closing: "open_cover",
    closed: "open_cover",
}

// Update list data
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
            if (info.type === "item-pool") {
                tile.getElementById("itemText").text = `${info.name}`;
                tile.getElementById("itemState").text = `${gettext(info.state)}`;
                let touch = tile.getElementById("itemTouch");
                touch.onclick = () => sendData({key: "set", entity: Entities[info.index].id, state: NextStates[info.state]});
            }
        }
    };
    list.length = data.length;
}

// Received message from companion / HomeAssistantAPI
messaging.peerSocket.onmessage = (evt) => {
    console.log(`Received: ${JSON.stringify(evt)}`);
    if (evt.data.key === "update" && evt.data.value === "begin") {
        Entities = [];
    }
    else if (evt.data.key === "add") {
        Entities.push({id: evt.data.id, name: evt.data.name, state: evt.data.state});
    }
    else if (evt.data.key === "update" && evt.data.value === "end") {
        setupList(EntityList, Entities);
    }
    else if (evt.data.key === "set") {
        Entities.forEach((entity, index) => {
            if (entity.id === evt.data.id) {
                Entities[index].state = evt.data.state;
                setupList(EntityList, Entities);
            }
        })
    }
    else if (evt.data.key === "api") {
        if (evt.data.value === "ok") {
            AddressText.text = evt.data.name;
        }
        else {
            AddressText.text = evt.data.value;
        }
    }
}

// Message socket opens
messaging.peerSocket.onopen = () => {
    console.log("App socket open");
    sendData({key: "refresh"});
};

// Message socket closes
messaging.peerSocket.onclose = () => {
    console.log("App socket closed");
};

import { settingsStorage } from "settings";
import * as messaging from "messaging";

// Settings have been changed
settingsStorage.onchange = function(evt) {
    if (evt.key === "ip") {
        console.log("Changed " + evt.key + ": " + evt.newValue);
        let data = JSON.parse(evt.newValue);
        sendData(evt.key, data["name"]);
    }
    else if (evt.key === "token") {
        console.log("Changed " + evt.key + ": " + evt.newValue);
        let data = JSON.parse(evt.newValue);
        sendData(evt.key, data["name"]);
    }
    else if (evt.key === "entities") {
        console.log("Changed " + evt.key + ": " + evt.newValue);
        let data = JSON.parse(evt.newValue);
        sendData(evt.key, data);
    }
}

// Settings were changed while the companion was not running
//if (companion.launchReasons.settingsChanged) {
//    sendData("ip", settingsStorage.getItem("ip"));
//}

function sendData(keyParam, valueParam) {
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        console.log("Sent " + keyParam + ": " + valueParam);
        messaging.peerSocket.send({key: keyParam, value: valueParam});
    }
}
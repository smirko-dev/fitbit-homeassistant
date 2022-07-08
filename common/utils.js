
import * as messaging from "messaging";

// Send data
export function sendData(data) {
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        //DEBUG console.log('Sent', JSON.stringify(data));
        messaging.peerSocket.send(data);
    }
}

// Check if object is empty
export function isEmpty(obj) {
    //return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
    let json = JSON.stringify(obj);
    return json === '{}' || json === '[]';
}

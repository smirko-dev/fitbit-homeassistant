
import * as messaging from "messaging";

// Send data
export function sendData(data) {
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
        console.log(`Sent: ${JSON.stringify(data)}`);
        messaging.peerSocket.send(data);
    }
}

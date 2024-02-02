import { writable } from 'svelte/store';
import * as proto from "protobufjs";

const messageStore = writable();
let messageType;

const socket = new WebSocket('wss://api.openprio.nl/rt/positions');

proto.load("openprio_pt_position_data.proto", function(err, root) {
    if (err) {
        throw err;
    }

    // Obtain a message type
    messageType = root.lookupType("LocationMessage");
});

// Connection opened
socket.addEventListener('open', function (event) {
    console.log("It's open");
});

socket.onmessage = async function(event) {
    let arrayBuffer = await event.data.arrayBuffer();
    try {
        let result = messageType.decode(new Uint8Array(arrayBuffer));

        messageStore.set(result);

        console.log(result);
    } catch (error) {
        console.log('Couldn\'t read buffer.');
    }
    // plotPosition(result);
};

// const sendMessage = (message) => {
//     if (socket.readyState <= 1) {
//         socket.send(message);
//     }
// }

export default {
    subscribe: messageStore.subscribe,
    // sendMessage
}
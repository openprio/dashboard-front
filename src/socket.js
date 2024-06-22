import { writable } from 'svelte/store';
import * as proto from "protobufjs";
import mqtt from "mqtt"; 

const messageStore = writable();
let messageType;


const client = mqtt.connect('wss://mqtt-relay.openprio.nl/mqtt', {
    username:"public",
    password:"qnzci42ByX30XPnL8XTzdvKBkB1MtS6N9HH4TO9uSh8=",
    clean:true
});


proto.load("openprio_pt_position_data.proto", function(err, root) {
    if (err) {
        throw err;
    }

    // Obtain a message type https://open.spotify.com/track/1dCSj3mSC1mulxiBoWgDNV
    messageType = root.lookupType("LocationMessage");
});


client.on("connect", () => {
    client.subscribe("/prod/pt/position/#", (err) => {
    });
});
  
client.on("message", (topic, message) => {
    // message is Buffer
    // let arrayBuffer = await event.data.arrayBuffer();
    try {
        console.log(topic);
        let result = messageType.decode(new Uint8Array(message));

        messageStore.set(result);
    } catch (error) {
        console.log('Couldn\'t read buffer.');
    }
});



// socket.onmessage = async function(event) {
   
//     // plotPosition(result);
// };

// const sendMessage = (message) => {
//     if (socket.readyState <= 1) {
//         socket.send(message);
//     }
// }

export default {
    subscribe: messageStore.subscribe,
    // sendMessage
}
import { writable } from 'svelte/store';
import * as proto from "protobufjs";
import mqtt from "mqtt"; 
import { userCredential, getIdToken } from './auth';

const messageStore = writable();
const feedback = writable();
let messageType;
let filter_on_one_vehicle = null;
let signedIn = false;

let client = mqtt.connect('wss://mqtt-relay.openprio.nl/mqtt', {
    username:"public",
    password:"qnzci42ByX30XPnL8XTzdvKBkB1MtS6N9HH4TO9uSh8=",
    clean:true
});

function anonymous_login() {
    client = mqtt.connect('wss://mqtt-relay.openprio.nl/mqtt', {
        username:"public",
        password:"qnzci42ByX30XPnL8XTzdvKBkB1MtS6N9HH4TO9uSh8=",
        clean:true
    });

}

userCredential.subscribe(async userCredential => {
    client.end();
    if(userCredential != null) {
        console.log(userCredential);
        let token = await getIdToken();
        client = mqtt.connect('wss://mqtt-relay.openprio.nl/mqtt', {
            username:"jwt",
            password: token,
            clean:true
        });
        console.log("CONNECT");
        signedIn = true;
    } else {
        anonymous_login();
        signedIn = false;
    }
    register_callbacks(client);

});

export function subscribe_on_feedback(data_owner_code, vehicle_number) {
    if (!signedIn) {
        return;
    }

    if (filter_on_one_vehicle != null) {
        client.unsubscribe(filter_on_one_vehicle);
        filter_on_one_vehicle = null;
    }

    let topic = `/prod/pt/prg_feedback/${data_owner_code}/vehicle_number/${vehicle_number}`;
    client.subscribe(`/prod/pt/prg_feedback/${data_owner_code}/vehicle_number/${vehicle_number}`, (err) => {
    });
    filter_on_one_vehicle = topic;
  
}

proto.load("openprio_pt_position_data.proto", function(err, root) {
    if (err) {
        throw err;
    }

    messageType = root.lookupType("LocationMessage");
});

function register_callbacks(client) {
    client.on("connect", () => {
        console.log("HIER");
        client.subscribe("/prod/pt/position/#", (err) => {
        });
    });
      
    client.on("message", (topic, message) => {
        try {
            if (topic.startsWith("/prod/pt/prg_feedback/")) {
                feedback.set(JSON.parse(message.toString()));
                return;
            } 
    
            let result = messageType.decode(new Uint8Array(message));
            messageStore.set(result);
        } catch (error) {
            console.log('Couldn\'t read buffer.');
        }
    });
}




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
    feedback: feedback.subscribe,
    subscribe_on_feedback: subscribe_on_feedback
    // sendMessage
}
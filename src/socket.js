import { writable } from 'svelte/store';

const messageStore = writable('');

const socket = new WebSocket('wss://api.openprio.nl/rt/positions');

// Connection opened
socket.addEventListener('open', function (event) {
    console.log("It's open");
});

// Listen for messages
socket.addEventListener('message', function (event) {
    if (event.data instanceof Blob) {
        event.data.text()
            .then(r => {
                console.log(r);
                messageStore.set(r)
            })
    }
});

const sendMessage = (message) => {
    if (socket.readyState <= 1) {
        socket.send(message);
    }
}

export default {
    subscribe: messageStore.subscribe,
    sendMessage
}
import { writable } from "svelte/store";
import * as proto from "protobufjs";
import mqtt from "mqtt";
import { userCredential, getIdToken } from "./auth";

const MQTT_URL = "wss://mqtt-relay.openprio.nl/mqtt";
const PUBLIC_PASSWORD = "qnzci42ByX30XPnL8XTzdvKBkB1MtS6N9HH4TO9uSh8=";

const FEED_POSITION = "position";
const FEED_POSITION_PLUS = "position-plus";

const messageStore = writable();
const secondaryStore = writable(null);
const feedback = writable();

function readPersisted(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

let currentEnvironment = readPersisted("mqtt_environment", "prod");
let currentFeedType = readPersisted("mqtt_feed_type", FEED_POSITION);

export const environment = writable(currentEnvironment);
export const feedType = writable(currentFeedType);
export const secondaryPosition = secondaryStore;

environment.subscribe((value) => {
  localStorage.setItem("mqtt_environment", JSON.stringify(value));
  if (value !== currentEnvironment) {
    currentEnvironment = value;
    reconnect();
  }
});

feedType.subscribe((value) => {
  localStorage.setItem("mqtt_feed_type", JSON.stringify(value));
  if (value !== currentFeedType) {
    currentFeedType = value;
    reconnect();
  }
});

let messageType;
let signedIn = false;
let selectedVehicle = null;
let activeSecondaryTopic = null;
let activeFeedbackTopic = null;
let client = null;
let connectGeneration = 0;

function topicPrefix() {
  return `/${currentEnvironment}/pt`;
}

function primaryTopic() {
  return `${topicPrefix()}/${currentFeedType}/#`;
}

function otherFeedType() {
  return currentFeedType === FEED_POSITION
    ? FEED_POSITION_PLUS
    : FEED_POSITION;
}

function secondaryTopicFor(dataOwnerCode, vehicleNumber) {
  return `${topicPrefix()}/${otherFeedType()}/${dataOwnerCode}/vehicle_number/${vehicleNumber}`;
}

function feedbackTopicFor(dataOwnerCode, vehicleNumber) {
  return `${topicPrefix()}/prg_feedback/${dataOwnerCode}/vehicle_number/${vehicleNumber}`;
}

async function reconnect() {
  const generation = ++connectGeneration;
  let options;
  if (signedIn) {
    const token = await getIdToken();
    if (generation !== connectGeneration) {
      return;
    }
    options = { username: "jwt", password: token, clean: true };
  } else {
    options = { username: "public", password: PUBLIC_PASSWORD, clean: true };
  }
  if (client != null) {
    client.end();
  }
  activeSecondaryTopic = null;
  activeFeedbackTopic = null;
  client = mqtt.connect(MQTT_URL, options);
  register_callbacks(client);
}

userCredential.subscribe(async (credential) => {
  signedIn = credential != null;
  await reconnect();
});

proto.load("openprio_pt_position_data.proto", function (err, root) {
  if (err) {
    throw err;
  }

  messageType = root.lookupType("LocationMessage");
});

function register_callbacks(newClient) {
  newClient.on("connect", () => {
    const topics = [primaryTopic()];
    if (selectedVehicle != null) {
      const { data_owner_code, vehicle_number } = selectedVehicle;
      activeSecondaryTopic = secondaryTopicFor(data_owner_code, vehicle_number);
      topics.push(activeSecondaryTopic);
      if (signedIn) {
        activeFeedbackTopic = feedbackTopicFor(data_owner_code, vehicle_number);
        topics.push(activeFeedbackTopic);
      }
    }
    newClient.subscribe(topics, (err) => {});
  });

  newClient.on("message", (topic, message) => {
    try {
      if (topic.startsWith(`${topicPrefix()}/prg_feedback/`)) {
        feedback.set(JSON.parse(message.toString()));
        return;
      }

      let result = messageType.decode(new Uint8Array(message));
      if (
        selectedVehicle != null &&
        topic ===
          secondaryTopicFor(
            selectedVehicle.data_owner_code,
            selectedVehicle.vehicle_number,
          )
      ) {
        secondaryStore.set(result);
      } else {
        messageStore.set(result);
      }
    } catch (error) {
      console.log("Couldn't read buffer.");
    }
  });
}

export function subscribe_on_feedback(data_owner_code, vehicle_number) {
  if (!signedIn || client == null) {
    return;
  }

  const topic = feedbackTopicFor(data_owner_code, vehicle_number);
  if (activeFeedbackTopic != null && activeFeedbackTopic !== topic) {
    client.unsubscribe(activeFeedbackTopic);
  }
  client.subscribe(topic, (err) => {});
  activeFeedbackTopic = topic;
}

export function subscribe_on_secondary(data_owner_code, vehicle_number) {
  selectedVehicle = { data_owner_code, vehicle_number };
  if (client == null) {
    return;
  }

  const topic = secondaryTopicFor(data_owner_code, vehicle_number);
  if (activeSecondaryTopic != null && activeSecondaryTopic !== topic) {
    client.unsubscribe(activeSecondaryTopic);
  }
  client.subscribe(topic, (err) => {});
  activeSecondaryTopic = topic;

  subscribe_on_feedback(data_owner_code, vehicle_number);
}

export function clear_secondary() {
  selectedVehicle = null;
  secondaryStore.set(null);
  if (client == null) {
    return;
  }
  if (activeSecondaryTopic != null) {
    client.unsubscribe(activeSecondaryTopic);
    activeSecondaryTopic = null;
  }
  if (activeFeedbackTopic != null) {
    client.unsubscribe(activeFeedbackTopic);
    activeFeedbackTopic = null;
  }
}

export default {
  subscribe: messageStore.subscribe,
  feedback: feedback.subscribe,
  subscribe_on_feedback: subscribe_on_feedback,
};

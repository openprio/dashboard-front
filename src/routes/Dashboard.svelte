<script lang="ts">
  import {
    MapLibre,
    Marker,
    CircleLayer,
    GeoJSON,
    LineLayer,
    FillLayer,
  } from "svelte-maplibre";
  import type { Feature, FeatureCollection, Point } from "geojson";
  import { userCredential } from "../auth.js";
  import Navigation from "../components/Navigation.svelte";
  import subscribe from "../socket.js";
  import Filters from "../components/Filters.svelte";
  import { circle } from "@turf/circle";
  import { onMount } from "svelte";

  /**
   * @type {LocationMessage[]}
   */
  let markers = $state([]);

  /**
   * @type {LocationMessage|null}
   */
  let selectedVehicle = $state(null);

  /**
   * @type {any[]}
   */
  let feedbackHistory = $state([]);

  let locationHistory = $state([]);

  let filter_intersection = $state(null);

  // Create a FeatureCollection
  let locationHistoryGeoJSON: FeatureCollection = $state({
    type: "FeatureCollection",
    features: [],
  });

  let intersectionsGeoJSON: FeatureCollection = $state({
    type: "FeatureCollection",
    features: [],
  });

  let filteredFeedbackHistory = $derived(
    filter_intersection == null
      ? feedbackHistory
      : feedbackHistory.filter(
          (feedbackItem) => feedbackItem.tlc_id === filter_intersection,
        ),
  );
  let filteredLocationHistory = $derived(
    filter_intersection == null
      ? locationHistory
      : locationHistory.filter(
          (locationHistoryItem) =>
            locationHistoryItem.properties.tlc_id === filter_intersection,
        ),
  );

  onMount(() => {
    fetch("/intersections.geojson")
      .then((response) => response.json())
      .then((geojson) => {
        let features = geojson.features.map((feature) => {
          console.log(feature);
          var options = {
            properties: {
              color: numberToColorHex(feature.properties.intersectionID),
            },
          };
          return circle(feature.geometry.coordinates, 0.15, options);
        });
        intersectionsGeoJSON = {
          type: "FeatureCollection",
          features: features,
        };
      });
  });

  onMount(() => {
    subscribe.subscribe(
      /**
       * @param {LocationMessage} currentMessage
       */

      (currentMessage) => {
        if (currentMessage) {
          let vehicle_id =
            currentMessage.vehicleDescriptor.dataOwnerCode +
            ":" +
            currentMessage.vehicleDescriptor.vehicleNumber;

          let index = markers.findIndex(
            (m) =>
              m.vehicleDescriptor.dataOwnerCode +
                ":" +
                m.vehicleDescriptor.vehicleNumber ==
              vehicle_id,
          );
          if (index != -1) {
            markers[index] = currentMessage;
          } else {
            markers.push(currentMessage);
          }

          if (
            selectedVehicle != null &&
            selectedVehicle.vehicleDescriptor.dataOwnerCode +
              ":" +
              selectedVehicle.vehicleDescriptor.vehicleNumber ==
              vehicle_id
          ) {
            selectedVehicle = currentMessage;
            let historyPoint: Feature<Point> = {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: [
                  currentMessage.position.longitude,
                  currentMessage.position.latitude,
                ],
              },
              properties: {
                name: "Sample Point",
              },
            };
            locationHistory.push(historyPoint);
          }
        }
      },
    );
  });

  onMount(() => {
    subscribe.feedback((feedbackMessage) => {
      if (feedbackMessage) {
        feedbackHistory.unshift(feedbackMessage);

        let currentMessage = feedbackMessage.last_openprio_position;
        console.log(numberToColorHex(feedbackMessage.tlc_id));
        let historyPoint: Feature<Point> = {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [
              currentMessage.position.longitude,
              currentMessage.position.latitude,
            ],
          },
          properties: {
            type_of_message: feedbackMessage.type_of_msg,
            "border-color": numberToColorHex(feedbackMessage.tlc_id),
            color: getFeedbackColor(feedbackMessage),
            tlc_id: feedbackMessage.tlc_id,
          },
        };
        locationHistory.push(historyPoint);
        locationHistoryGeoJSON = {
          type: "FeatureCollection",
          features: locationHistory,
        };
      }
    });
  });

  function resetLocationHistory() {
    feedbackHistory = [];
    locationHistory = [];
    locationHistoryGeoJSON = {
      type: "FeatureCollection",
      features: locationHistory,
    };
  }

  function getFeedbackColor(msg) {
    if (msg.type_of_msg == "srm") {
      return srm_to_color(msg.request_type);
    }
    if (msg.pbc_rejection != "NO_ERROR") {
      return "#dc2626";
    }
    return ssm_to_color(msg.prioritization_response_status);
  }

  function ssm_to_color(prioritization_response_status) {
    if (prioritization_response_status == "GRANTED") {
      return "#16a34a";
    }
    if (prioritization_response_status == "REQUESTED") {
      return "#bbf7d0";
    }
    if (prioritization_response_status == "REJECTED") {
      return "#b91c1c";
    }
    return "#dbeafe";
  }

  function srm_to_color(request_type) {
    if (request_type == "priorityRequestNew") {
      return "#4ade80";
    }
    if (request_type == "priorityRequestUpdate") {
      return "#eab308";
    }
    return "#ef4444";
  }

  function toIsoString(date) {
    var tzo = -date.getTimezoneOffset(),
      dif = tzo >= 0 ? "+" : "-",
      pad = function (num) {
        return (num < 10 ? "0" : "") + num;
      };

    return (
      date.getFullYear() +
      "-" +
      pad(date.getMonth() + 1) +
      "-" +
      pad(date.getDate()) +
      "T" +
      pad(date.getHours()) +
      ":" +
      pad(date.getMinutes()) +
      ":" +
      pad(date.getSeconds()) +
      dif +
      pad(Math.floor(Math.abs(tzo) / 60)) +
      ":" +
      pad(Math.abs(tzo) % 60)
    );
  }

  function formatTimeNicelyFirst(time) {
    let timestamp = new Date(time);
    return (
      timestamp.getHours().toString().padStart(2, "0") +
      ":" +
      timestamp.getMinutes().toString().padStart(2, "0") +
      ":"
    );
  }

  function formatTimeNicelySecond(time) {
    let timestamp = new Date(time);
    return (
      timestamp.getSeconds().toString().padStart(2, "0") +
      "." +
      Math.floor(timestamp.getMilliseconds() / 100)
    );
  }

  function formatTimeNicely(time) {
    return formatTimeNicelyFirst(time) + formatTimeNicelySecond(time);
  }

  function doorStatus(doorStatus: number) {
    switch (doorStatus) {
      case 1: {
        return "Closed";
      }
      case 2: {
        return "Open";
      }
      case 3: {
        return "Released";
      }
      default: {
        return "Unknown";
      }
    }
  }

  function numberToColorHex(number) {
    let colors = [
      "#e6194b",
      "#3cb44b",
      "#ffe119",
      "#4363d8",
      "#f58231",
      "#911eb4",
      "#46f0f0",
      "#f032e6",
      "#bcf60c",
      "#fabebe",
      "#008080",
      "#e6beff",
      "#9a6324",
      "#fffac8",
      "#800000",
      "#aaffc3",
      "#808000",
      "#ffd8b1",
      "#000075",
      "#808080",
      "#000000",
    ];
    return colors[number % colors.length];
  }

  function numberToColor(num) {
    return `border-color: ${numberToColorHex(num)};`;
  }

  function vehicleDirection(doorStatus: number) {
    switch (doorStatus) {
      case 1: {
        return "A";
      }
      case 2: {
        return "B";
      }
      default: {
        return "Undefined";
      }
    }
  }
</script>

<div class="flex h-screen flex-col">
  <header class="pb-8">
    <Navigation></Navigation>
  </header>
</div>
<div class="flex flex-col md:flex-row">
  <Filters></Filters>
  <MapLibre
    center={[4.3489627, 52.0248904]}
    zoom={10}
    class="mt-6 h-[94vh] w-full md:mt-0"
    standardControls
    style={"https://api.maptiler.com/maps/52e8038c-e9df-4d0e-a6cc-1269d04c9c19/style.json?key=wMttElGnvszMrzou5eQJ"}
  >
    <GeoJSON id="positions" data={locationHistoryGeoJSON}>
      <CircleLayer
        id="cluster_circles"
        applyToClusters={false}
        paint={{
          // Use step expressions (https://maplibre.org/maplibre-gl-js-docs/style-spec/#expressions-step)
          // with three steps to implement three types of circles:
          //   * Blue, 20px circles when point count is less than 100
          //   * Yellow, 30px circles when point count is between 100 and 750
          //   * Pink, 40px circles when point count is greater than or equal to 750
          "circle-color": ["get", "color"],
          "circle-stroke-color": ["get", "border-color"],
          "circle-stroke-width": ["case", ["has", "type_of_message"], 1, 0],
          "circle-radius": [
            "case",
            ["==", ["get", "type_of_message"], "ssm"],
            8,
            ["==", ["get", "type_of_message"], "srm"],
            4,
            2,
          ],
        }}
      />
    </GeoJSON>

    <GeoJSON id="intersections" data={intersectionsGeoJSON}>
      <FillLayer
        paint={{
          "fill-color": ["get", "color"],
          "fill-opacity": 0.05,
        }}
      />

      <LineLayer
        layout={{ "line-cap": "round", "line-join": "round" }}
        paint={{
          "line-color": ["get", "color"],
          "line-width": 3,
          "line-dasharray": [2, 5],
        }}
        beforeLayerType="symbol"
      />
    </GeoJSON>

    {#each markers as marker (marker.vehicleDescriptor.dataOwnerCode + ":" + marker.vehicleDescriptor.vehicleNumber)}
      <Marker
        lngLat={[marker.position.longitude, marker.position.latitude]}
        class="z-10 grid h-8 w-8 place-items-center"
        on:click={() => {
          selectedVehicle = marker;
          subscribe.subscribe_on_feedback(
            marker.vehicleDescriptor.dataOwnerCode,
            marker.vehicleDescriptor.vehicleNumber,
          );
          resetLocationHistory();
        }}
      >
        <!-- Triangle -->
        {#if selectedVehicle != null && marker.vehicleDescriptor.dataOwnerCode + ":" + marker.vehicleDescriptor.vehicleNumber == selectedVehicle.vehicleDescriptor.dataOwnerCode + ":" + selectedVehicle.vehicleDescriptor.vehicleNumber}
          <div
            class="h-0 w-0
                    border-b-[32px] border-l-[13px] border-r-[13px]
                    border-b-yellow-500 border-l-transparent border-r-transparent"
            style="transform: rotate({marker.position.bearing}deg);"
          >
            <div
              class="relative right-[12px] top-[2px] h-0 w-0
                        border-b-[29px] border-l-[12px]
                        border-r-[12px] border-b-white
                        border-l-transparent border-r-transparent
                    "
            >
              <div class="rotate-90 text-[8px] text-gray-800">
                {marker.vehicleDescriptor.dataOwnerCode}
              </div>
            </div>
          </div>
        {:else}
          <div
            class="h-0 w-0
                      border-b-[32px] border-l-[13px] border-r-[13px]
                      border-b-black border-l-transparent border-r-transparent"
            style="transform: rotate({marker.position.bearing}deg);"
          >
            <div
              class="relative right-[12px] top-[2px] h-0 w-0
                      border-b-[29px] border-l-[12px]
                      border-r-[12px] border-b-white
                      border-l-transparent border-r-transparent
                     "
            >
              <div class="rotate-90 text-[8px] text-gray-800">
                {marker.vehicleDescriptor.dataOwnerCode}
              </div>
            </div>
          </div>
        {/if}
      </Marker>
    {/each}
  </MapLibre>
  {#if selectedVehicle}
    <div
      class="absolute bottom-0 z-30 flex w-full flex-col bg-gray-100 md:static md:w-auto md:flex-row"
    >
      <button
        class="group flex h-6 w-full items-center justify-center bg-gray-400 text-white hover:bg-gray-700 md:h-full md:w-5"
        onclick={() => (selectedVehicle = null)}
      >
        <div class="rotate-90 md:rotate-0">
          <div
            class="h-0 w-0 rotate-90
                      border-b-[10px] border-l-[4px]
                      border-r-[4px] border-b-gray-800 border-l-transparent
                      border-r-transparent group-hover:border-b-white"
          ></div>
        </div>
      </button>
      <div class="flex h-[94vh] w-80 flex-col gap-2 p-4 text-sm shadow">
        <div class="flex flex-col justify-center">
          <h2 class="text-lg font-bold">Voertuiginformatie</h2>
          <div class="h-[2px] w-full bg-blue-500"></div>
        </div>
        <div class="flex flex-col">
          <h1 class="text-lg font-bold">Deurstatus</h1>
          <div class="flex items-center justify-between gap-2">
            {#if selectedVehicle.doorStatus == 2}
              <span class="h-4 w-96 bg-green-500"></span>
            {:else if selectedVehicle.doorStatus == 1}
              <span class="h-4 w-96 bg-red-500"></span>
            {:else if selectedVehicle.doorStatus == 3}
              <span class="h-4 w-96 bg-yellow-500"></span>
            {:else}
              <span class="h-4 w-96 bg-gray-200"></span>
            {/if}
            {doorStatus(selectedVehicle.doorStatus)}
          </div>
        </div>
        <div class="flex flex-col">
          <h1 class="text-lg font-bold">Voertuigbeschrijving</h1>
          <div class="flex flex-col">
            <div class="flex justify-between gap-2">
              <h3>DataOwnerCode</h3>
              <span>{selectedVehicle.vehicleDescriptor.dataOwnerCode}</span>
            </div>
            <div class="flex justify-between gap-2">
              <h3>VehicleNumber</h3>
              <span>{selectedVehicle.vehicleDescriptor.vehicleNumber}</span>
            </div>
            <div class="flex justify-between gap-2">
              <h3>BlockCode</h3>
              <span>{selectedVehicle.vehicleDescriptor.blockCode}</span>
            </div>
            <div class="flex justify-between gap-2">
              <h3>Actieve cabine</h3>
              <span
                >{vehicleDirection(
                  selectedVehicle.vehicleDescriptor.drivingDirection,
                )}</span
              >
            </div>
            <div class="flex justify-between gap-2">
              <h3>Aantal gekoppelde voertuigen</h3>
              <span
                >{selectedVehicle.vehicleDescriptor
                  .numberOfVehiclesCoupled}</span
              >
            </div>
          </div>
        </div>
        <div class="flex flex-col">
          <h1 class="text-lg font-bold">Positie</h1>
          <div class="flex flex-col">
            <div class="flex justify-between gap-2">
              <h3>Latitude</h3>
              <span>{selectedVehicle.position.latitude.toFixed(6)}</span>
            </div>
            <div class="flex justify-between gap-2">
              <h3>Longitude</h3>
              <span>{selectedVehicle.position.longitude.toFixed(6)}</span>
            </div>
            <div class="flex justify-between gap-2">
              <h3>Snelheid</h3>
              <span
                >{(selectedVehicle.position.speed * 3.6).toFixed(0)}km/h</span
              >
            </div>
            <div class="flex justify-between gap-2">
              <h3>Bearing</h3>
              <span>{selectedVehicle.position.bearing.toFixed(1)}deg</span>
            </div>
            <div class="flex justify-between gap-2">
              <h3>Hdop</h3>
              <span>{selectedVehicle.position.hdop.toFixed(2)}</span>
            </div>
            <div class="flex justify-between gap-2">
              <h3>Aantal satellieten</h3>
              <span>{selectedVehicle.position.numberOfReceivedSatellites}</span>
            </div>
            <div class="flex justify-between gap-2">
              <h3>Nauwkeurigheid</h3>
              <span>{selectedVehicle.position.accuracy}</span>
            </div>
            <div class="flex justify-between gap-2">
              <h3>Odometer</h3>
              <span>{selectedVehicle.position.odometer}m</span>
            </div>
          </div>
        </div>
        <div class="flex flex-col">
          <h1 class="text-lg font-bold">Timestamp</h1>
          <span>{toIsoString(new Date(selectedVehicle.timestamp))}</span>
          <div class="flex justify-between gap-2">
            <h3>Latency</h3>
            <span>{new Date().getTime() - selectedVehicle.timestamp}ms</span>
          </div>
        </div>
      </div>
      {#if $userCredential}
        <div
          class="flex h-[94vh] w-96 flex-col gap-2 overflow-y-scroll p-4 text-sm shadow"
        >
          <div class="flex flex-col justify-center">
            <div class="m-1 flex flex-row justify-between">
              <h2 class="text-lg font-bold">Log (SRM + SSM)</h2>
              {#if filter_intersection != null}
                <button
                  class="rounded border border-r-8 p-0.5 text-sm"
                  style={numberToColor(filter_intersection)}
                  onclick={() => {
                    filter_intersection = null;
                  }}
                >
                  {filter_intersection}</button
                >
              {/if}
            </div>
            <div class="h-[2px] w-full bg-blue-500"></div>
          </div>
          {#each filteredFeedbackHistory as historyItem}
            <div class="w-full rounded bg-gray-200 p-4">
              <div class="flex flex-row justify-between">
                <div>
                  <span class="align-top text-xs"
                    >{formatTimeNicelyFirst(historyItem.timestamp)}</span
                  ><span class="align-top text-base"
                    >{formatTimeNicelySecond(historyItem.timestamp)}</span
                  >
                </div>
                <button
                  class="rounded border border-r-8 p-0.5 text-sm"
                  style={numberToColor(historyItem.tlc_id)}
                  onclick={() => {
                    filter_intersection = historyItem.tlc_id;
                  }}>{historyItem.tlc_id}</button
                >
                {#if historyItem.type_of_msg == "srm"}
                  <div class="flex flex-row">
                    <div
                      class="rounded-l border-b border-l border-t border-gray-500 bg-white p-0.5 text-sm"
                    >
                      SRM
                    </div>
                    {#if historyItem.request_type == "priorityRequestNew"}
                      <div class="rounded-r bg-green-400 p-0.5 text-sm">
                        NEW
                      </div>
                    {:else if historyItem.request_type == "priorityRequestUpdate"}
                      <div class="rounded-r bg-yellow-500 p-0.5 text-sm">
                        UPDATE
                      </div>
                    {:else}
                      <div class="rounded-r bg-red-500 p-0.5 text-sm">
                        CANCEL
                      </div>
                    {/if}
                  </div>
                {:else if historyItem.type_of_msg == "ssm"}
                  <div class="flex flex-row">
                    <div
                      class="rounded-l border-b border-l border-t border-gray-500 bg-white p-0.5 text-sm"
                    >
                      SSM
                    </div>
                    {#if historyItem.prioritization_response_status == "GRANTED"}
                      <div class="rounded-r bg-green-600 p-1 text-sm">
                        {historyItem.prioritization_response_status}
                      </div>
                    {:else if historyItem.prioritization_response_status == "REQUESTED"}
                      <div class="rounded-r bg-green-200 p-1 text-sm">
                        {historyItem.prioritization_response_status}
                      </div>
                    {:else if historyItem.prioritization_response_status == "REJECTED"}
                      <div class="rounded-r bg-red-700 p-1 text-sm">
                        {historyItem.prioritization_response_status}
                      </div>
                    {:else if historyItem.pbc_rejection != "NO_ERROR"}
                      <div class="rounded-r bg-red-600 p-1 text-sm">
                        {historyItem.pbc_rejection}
                      </div>
                    {:else}
                      <div class="rounded-r bg-blue-100 p-1 text-sm">
                        {historyItem.prioritization_response_status}
                      </div>
                    {/if}
                  </div>
                {/if}
              </div>
              {#if historyItem.type_of_msg == "srm" || historyItem.pbc_rejection == "NO_ERROR"}
                <div class="flex flex-row justify-between">
                  <span
                    >ETA: {formatTimeNicely(historyItem.eta_stopline)} (&Delta;{(
                      (new Date(historyItem.eta_stopline).getTime() -
                        new Date(historyItem.timestamp).getTime()) /
                      1000.0
                    ).toFixed(1)}s)</span
                  >
                  <span>Latency: {historyItem.latency}ms</span>
                </div>
                <div class="flex flex-row">
                  LaneConnectionID: {historyItem.lane_connection}
                </div>
                {#if historyItem.type_of_msg == "srm"}
                  <div class="flex flex-row justify-between">
                    <span>{historyItem.transit_status_loading}</span>
                    <span>{historyItem.transit_status_door_open}</span>
                    <span>{historyItem.transit_status_at_stopline}</span>
                    <span>{historyItem.transit_schedule}</span>
                  </div>
                {/if}
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>

<script lang="ts">
    import {MapLibre, Marker, CircleLayer, GeoJSON} from 'svelte-maplibre';
    import type {Feature, FeatureCollection, Point} from 'geojson';
    import {userCredential} from "../auth.js";
    import Navigation from "../components/Navigation.svelte";
    import { onMount } from 'svelte';
    import subscribe from '../socket.js';
    import subscribe_on_feedback from '../socket.js';
    import Filters from "../components/Filters.svelte";

    /**
     * @type {LocationMessage[]}
     */
    let markers = [];

    /**
     * @type {LocationMessage|null}
     */
    let selectedVehicle = null;

    /**
     * @type {any[]}
     */
    let feedbackHistory = [];

    let locationHistory = [];

    let filter_intersection = null;

    // $: locationHistoryGeoJSON = {

    //     locationHistory.forEach
    // };


    // Create a FeatureCollection
    let locationHistoryGeoJSON: FeatureCollection = {
        type: 'FeatureCollection',
        features: []
    };

    $: filteredFeedbackHistory = filter_intersection == null ? feedbackHistory : feedbackHistory.filter(feedbackItem => feedbackItem.tlc_id === filter_intersection)


    onMount(() => {
        subscribe.subscribe(/**
         * @param {LocationMessage} currentMessage
         */
       
        (currentMessage) => {
            if (currentMessage) {
                let vehicle_id = currentMessage.vehicleDescriptor.dataOwnerCode + ":" + currentMessage.vehicleDescriptor.vehicleNumber;
            
                let index = markers.findIndex(m => m.vehicleDescriptor.dataOwnerCode + ":" + m.vehicleDescriptor.vehicleNumber == vehicle_id);
                if (index != -1) {
                    markers.splice(index, 1);
                }
              
                markers = [...markers, currentMessage];
                if (selectedVehicle != null && selectedVehicle.vehicleDescriptor.dataOwnerCode + ":" + selectedVehicle.vehicleDescriptor.vehicleNumber  == vehicle_id) {
                    selectedVehicle = currentMessage;
                    let historyPoint: Feature<Point> = {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [currentMessage.position.longitude, currentMessage.position.latitude]
                        },
                        properties: {
                            name: 'Sample Point'
                        }
                    };
                    locationHistory = [...locationHistory, historyPoint];
                    locationHistoryGeoJSON = {
                        type: 'FeatureCollection',
                        features: locationHistory
                    };
                    console.log(locationHistoryGeoJSON);

                }

            }
        })
        subscribe.feedback(
            (feedbackMessage) => {
                if (feedbackMessage) {
                    console.log(feedbackMessage);
                    feedbackHistory = [feedbackMessage, ...feedbackHistory];

                    let currentMessage = feedbackMessage.last_openprio_position;
                    console.log( numberToColorHex(feedbackMessage.tlc_id));
                    let historyPoint: Feature<Point> = {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [currentMessage.position.longitude, currentMessage.position.latitude]
                        },
                        properties: {
                            "type_of_message": feedbackMessage.type_of_msg,
                            "border-color": numberToColorHex(feedbackMessage.tlc_id),
                            "color": "#22c55e" 
                        }
                    };
                    locationHistory = [...locationHistory, historyPoint];
                    locationHistoryGeoJSON = {
                        type: 'FeatureCollection',
                        features: locationHistory
                    };
                    console.log(locationHistoryGeoJSON);



                }
             
            }
        )

    })

    function resetLocationHistory() {
        feedbackHistory = [];
        locationHistory = [];
        locationHistoryGeoJSON = {
            type: 'FeatureCollection',
            features: locationHistory
        };
    }

    function ssm_to_color() {

    }

    function srm_to_color() {

    }

    function toIsoString(date) {
        var tzo = -date.getTimezoneOffset(),
            dif = tzo >= 0 ? '+' : '-',
            pad = function(num) {
                return (num < 10 ? '0' : '') + num;
            };

        return date.getFullYear() +
            '-' + pad(date.getMonth() + 1) +
            '-' + pad(date.getDate()) +
            'T' + pad(date.getHours()) +
            ':' + pad(date.getMinutes()) +
            ':' + pad(date.getSeconds()) +
            dif + pad(Math.floor(Math.abs(tzo) / 60)) +
            ':' + pad(Math.abs(tzo) % 60);
    }

    function formatTimeNicelyFirst(time) {
        let timestamp = new Date(time);
        return timestamp.getHours().toString().padStart(2, '0') + ":" + timestamp.getMinutes().toString().padStart(2, '0') + ":";
    }

    function formatTimeNicelySecond(time) {
        let timestamp = new Date(time);
        return timestamp.getSeconds().toString().padStart(2, '0') + "." + Math.floor(timestamp.getMilliseconds() / 100);
    }

    function formatTimeNicely(time) {
        return formatTimeNicelyFirst(time) + formatTimeNicelySecond(time);
    }
    

    function doorStatus(doorStatus: number) {
        switch(doorStatus) {
            case 1: {
                return "Closed"
            }
            case 2: {
                return "Open"
            }
            case 3: {
                return "Released"
            }
            default: {
                return "Unknown"
            }

        }
    }

    function numberToColorHex(num) {
        num = num * 11 % 255;

        const startColor = [0, 0, 255]; // Blue
        const endColor = [255, 0, 0];   // Red

        const r = startColor[0] + (endColor[0] - startColor[0]) * num / 255;
        const g = startColor[1] + (endColor[1] - startColor[1]) * num / 255;
        const b = startColor[2] + (endColor[2] - startColor[2]) * num / 255;

        return `#${((1 << 24) + (Math.round(r) << 16) + (Math.round(g) << 8) + Math.round(b)).toString(16).slice(1).toUpperCase()}`;
    }

    function numberToColor(num) {
            num = num * 11 % 255;

            const startColor = [0, 0, 255]; // Blue
            const endColor = [255, 0, 0];  // Red

            const r = startColor[0] + (endColor[0] - startColor[0]) * num / 255;
            const g = startColor[1] + (endColor[1] - startColor[1]) * num / 255;
            const b = startColor[2] + (endColor[2] - startColor[2]) * num / 255;

            return `border-color: rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)});`;
    }

    function vehicleDirection(doorStatus: number) {
        switch(doorStatus) {
            case 1: {
                return "A"
            }
            case 2: {
                return "B"
            }
            default: {
                return "Undefined"
            }

        }
    }

</script>
<Navigation></Navigation>
<div class="flex flex-col md:flex-row">
    <Filters></Filters>
    <MapLibre
            center={[4.3489627, 52.0248904]}
            zoom={10}
            class="w-full h-[94vh] mt-6 md:mt-0"
            standardControls
            style={'https://api.maptiler.com/maps/52e8038c-e9df-4d0e-a6cc-1269d04c9c19/style.json?key=wMttElGnvszMrzou5eQJ'}
    >
        <GeoJSON id="earthquakes" data={locationHistoryGeoJSON}>
        <CircleLayer
                id="cluster_circles"
                applyToClusters={false}
                paint={{
                    // Use step expressions (https://maplibre.org/maplibre-gl-js-docs/style-spec/#expressions-step)
                    // with three steps to implement three types of circles:
                    //   * Blue, 20px circles when point count is less than 100
                    //   * Yellow, 30px circles when point count is between 100 and 750
                    //   * Pink, 40px circles when point count is greater than or equal to 750
                    'circle-color': ["get", "color"],
                    'circle-stroke-color': ["get", "border-color"],
                    'circle-stroke-width': [
                        "case", 
                        ["has", "type_of_message"], 1,
                        0
                    ],
                    'circle-radius': [
                        "case", 
                        ["==", ["get", "type_of_message"], "ssm"], 8,
                        ["==", ["get", "type_of_message"], "srm"], 4,
                        2
                    ]
                }}
            />
        </GeoJSON>
        {#each markers as marker (marker.vehicleDescriptor.dataOwnerCode + ":" + marker.vehicleDescriptor.vehicleNumber)}
            <Marker
                lngLat={[marker.position.longitude, marker.position.latitude]}
                class="grid h-8 w-8 place-items-center z-10"
                on:click={() => {
                    selectedVehicle = marker;
                    subscribe.subscribe_on_feedback(marker.vehicleDescriptor.dataOwnerCode, marker.vehicleDescriptor.vehicleNumber);
                    resetLocationHistory();
                }}
            >
                <!-- Triangle -->
                {#if selectedVehicle != null && marker.vehicleDescriptor.dataOwnerCode + ":" + marker.vehicleDescriptor.vehicleNumber == selectedVehicle.vehicleDescriptor.dataOwnerCode + ":" + selectedVehicle.vehicleDescriptor.vehicleNumber}
                <div class="w-0 h-0
                    border-l-[13px] border-l-transparent border-b-yellow-500
                    border-b-[32px] border-r-[13px] border-r-transparent"
                    style="transform: rotate({marker.position.bearing}deg);">

                    <div class="relative top-[2px] right-[12px] w-0 h-0
                        border-l-[12px] border-l-transparent
                        border-b-[29px] border-b-white
                        border-r-[12px] border-r-transparent
                    ">
                        <div class="text-[8px] text-gray-800 rotate-90">
                        {marker.vehicleDescriptor.dataOwnerCode}
                        </div>
                    </div>
                </div>
                {:else}
                <div class="w-0 h-0
                      border-l-[13px] border-l-transparent border-b-black
                      border-b-[32px] border-r-[13px] border-r-transparent"
                    style="transform: rotate({marker.position.bearing}deg);">

                    <div class="relative top-[2px] right-[12px] w-0 h-0
                      border-l-[12px] border-l-transparent
                      border-b-[29px] border-b-white
                      border-r-[12px] border-r-transparent
                     ">
                      <div class="text-[8px] text-gray-800 rotate-90">
                        {marker.vehicleDescriptor.dataOwnerCode}
                      </div>
                    </div>
                </div>
                {/if}
            </Marker>
        {/each}
    </MapLibre>
    {#if selectedVehicle}
        <div class="bg-gray-100 flex flex-col md:flex-row z-30 absolute md:static bottom-0 w-full md:w-auto">
            <button class="group bg-gray-400 hover:bg-gray-700 h-6 w-full md:h-full md:w-5 text-white flex items-center justify-center" on:click={() => selectedVehicle = null}>
                <div class="rotate-90 md:rotate-0">
                    <div class="w-0 h-0 rotate-90
                      border-l-[4px] border-l-transparent
                      border-b-[10px] border-b-gray-800 group-hover:border-b-white
                      border-r-[4px] border-r-transparent">
                    </div>
                </div>
            </button>
            <div class="flex flex-col gap-2 p-4 shadow w-80 text-sm h-[94vh]">
                <div class="flex flex-col justify-center">
                    <h2 class="text-lg font-bold">Voertuiginformatie</h2>
                    <div class="w-full h-[2px] bg-blue-500"></div>
                </div>
                <div class="flex flex-col">
                    <h1 class="text-lg font-bold">Deurstatus</h1>
                    <div class="flex gap-2 justify-between items-center">
                        {#if selectedVehicle.doorStatus == 2}
                        <span class="w-96 bg-green-500 h-4"></span>
                        {:else if selectedVehicle.doorStatus == 1} 
                        <span class="w-96 bg-red-500 h-4"></span>
                        {:else if selectedVehicle.doorStatus == 3} 
                        <span class="w-96 bg-yellow-500 h-4"></span>
                        {:else}
                        <span class="w-96 bg-gray-200 h-4"></span>
                        {/if}
                        {doorStatus(selectedVehicle.doorStatus)}
                    </div>
                </div>
                <div class="flex flex-col">
                    <h1 class="text-lg font-bold">Voertuigbeschrijving</h1>
                    <div class="flex flex-col">
                        <div class="flex gap-2 justify-between">
                            <h3>DataOwnerCode</h3>
                            <span>{selectedVehicle.vehicleDescriptor.dataOwnerCode}</span>
                        </div>
                        <div class="flex gap-2 justify-between">
                            <h3>VehicleNumber</h3>
                            <span>{selectedVehicle.vehicleDescriptor.vehicleNumber}</span>
                        </div>
                        <div class="flex gap-2 justify-between">
                            <h3>BlockCode</h3>
                            <span>{selectedVehicle.vehicleDescriptor.blockCode}</span>
                        </div>
                        <div class="flex gap-2 justify-between">
                            <h3>Actieve cabine</h3>
                            <span>{vehicleDirection(selectedVehicle.vehicleDescriptor.drivingDirection)}</span>
                        </div>
                        <div class="flex gap-2 justify-between">
                            <h3>Aantal gekoppelde voertuigen</h3>
                            <span>{selectedVehicle.vehicleDescriptor.numberOfVehiclesCoupled}</span>
                        </div>
                    </div>
                </div>
                <div class="flex flex-col">
                    <h1 class="text-lg font-bold">Positie</h1>
                    <div class="flex flex-col">
                        <div class="flex gap-2 justify-between">
                            <h3>Latitude</h3>
                            <span>{selectedVehicle.position.latitude.toFixed(6)}</span>
                        </div>
                        <div class="flex gap-2 justify-between">
                            <h3>Longitude</h3>
                            <span>{selectedVehicle.position.longitude.toFixed(6)}</span>
                        </div>
                        <div class="flex gap-2 justify-between">
                            <h3>Snelheid</h3>
                            <span>{(selectedVehicle.position.speed*3.6).toFixed(0)}km/h</span>
                        </div>
                        <div class="flex gap-2 justify-between">
                            <h3>Bearing</h3>
                            <span>{(selectedVehicle.position.bearing).toFixed(1)}deg</span>
                        </div>
                        <div class="flex gap-2 justify-between">
                            <h3>Hdop</h3>
                            <span>{selectedVehicle.position.hdop.toFixed(2)}</span>
                        </div>
                        <div class="flex gap-2 justify-between">
                            <h3>Nauwkeurigheid</h3>
                            <span>{selectedVehicle.position.accuracy}</span>
                        </div>
                        <div class="flex gap-2 justify-between">
                            <h3>Odometer</h3>
                            <span>{selectedVehicle.position.odometer}m</span>
                        </div>
                    </div>
                </div>
                <div class="flex flex-col">
                    <h1 class="text-lg font-bold">Timestamp</h1>
                    <span>{toIsoString(new Date(selectedVehicle.timestamp))}</span>
                    <div class="flex gap-2 justify-between">
                        <h3>Latency</h3>
                        <span>{new Date().getTime() - selectedVehicle.timestamp}ms</span>
                    </div>
                </div>
            </div>
            {#if $userCredential}
            <div class="flex flex-col gap-2 p-4 shadow w-96 text-sm h-[94vh] overflow-y-scroll">
                <div class="flex flex-col justify-center ">
                    <div class="flex flex-row justify-between m-1">
                        <h2 class="text-lg font-bold">Log (SRM + SSM)</h2>
                        {#if filter_intersection != null }
                        <button class="border rounded text-sm p-0.5 border-r-8" style="{numberToColor(filter_intersection)}" on:click={() => {filter_intersection = null}}>
                            {filter_intersection}</button>
                        {/if}
                    </div>
                    <div class="w-full h-[2px] bg-blue-500"></div>
                </div>
                {#each filteredFeedbackHistory as historyItem}
                    <div class="w-full bg-gray-200 rounded p-4">
                        <div class="flex flex-row justify-between">
                            <div>
                        <span class="text-xs align-top">{formatTimeNicelyFirst(historyItem.timestamp)}</span><span class="text-base align-top">{formatTimeNicelySecond(historyItem.timestamp)}</span>
                            </div>
                        <button class="border rounded text-sm p-0.5 border-r-8" style="{numberToColor(historyItem.tlc_id)}" on:click={() => {filter_intersection = historyItem.tlc_id}}>{historyItem.tlc_id}</button>
                        {#if historyItem.type_of_msg == "srm"}
                            <div class="flex flex-row">
                            <div class="rounded-l bg-white p-0.5 text-sm border-gray-500 border-l border-t border-b">SRM</div>
                            {#if historyItem.request_type == "priorityRequestNew" }
                                <div class="bg-green-400 rounded-r p-0.5 text-sm">NEW</div>
                            {:else if historyItem.request_type == "priorityRequestUpdate"}
                                <div class="bg-yellow-500 rounded-r p-0.5 text-sm">UPDATE</div>
                            {:else}
                                <div class="bg-red-500 rounded-r p-0.5 text-sm">CANCEL</div>
                            {/if}
                            </div>
                        {:else if historyItem.type_of_msg == "ssm"}
                            <div class="flex flex-row">
                            <div class="rounded-l bg-white p-0.5 text-sm border-gray-500 border-l border-t border-b">SSM</div>
                            {#if historyItem.prioritization_response_status == "GRANTED" }
                                <div class="bg-green-600 rounded-r p-1 text-sm">{historyItem.prioritization_response_status}</div>
                            {:else if historyItem.prioritization_response_status == "REQUESTED"}
                                <div class="bg-green-200 rounded-r p-1 text-sm">{historyItem.prioritization_response_status}</div>
                            {:else if historyItem.prioritization_response_status == "REJECTED"}
                                <div class="bg-red-700 rounded-r p-1 text-sm">{historyItem.prioritization_response_status}</div>
                            {:else}
                                <div class="bg-blue-100 rounded-r p-1 text-sm">{historyItem.prioritization_response_status}</div>
                            {/if}
                            </div>  
                        {/if}
                        </div>
                        <div class="flex flex-row justify-between">
                            <span>ETA: {formatTimeNicely(historyItem.eta_stopline)}  (&Delta;{((new Date(historyItem.eta_stopline).getTime() - new Date(historyItem.timestamp).getTime()) / 1000.0).toFixed(1)}s)</span>
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
                        
                    </div>
                {/each}        
            </div>
            {/if}
        </div>
    {/if}
</div>
<script>
    import {MapLibre, Marker} from 'svelte-maplibre';
    import Navigation from "../components/Navigation.svelte";
    import { onMount } from 'svelte';
    import socket from '../socket.js';
    import Filters from "../components/Filters.svelte";

    /**
     * @type LocationMessage
     */
    const debugMessage = {
        doorStatus: 1,
        position: {
            longitude: 4.3171954,
            latitude: 52.0821225,
            bearing: 0,
            speed: 0,
            accuracy: 1,
            hdop: 0,
            odometer: 0,
        },
        timestamp: 123,
        vehicleDescriptor: {
            blockCode: 1,
            drivingDirection: 2,
            numberOfVehiclesCoupled: 3,
            dataOwnerCode: 4,
            vehicleNumber: 5,
        },
    };


    /**
     * @type {LocationMessage[]}
     */
    let markers = [debugMessage];

    /**
     * @type {[number, number][]}
     */
    let dots = [];

    /**
     * @type {LocationMessage|null}
     */
    let selectedVehicle = null;

    onMount(() => {
        socket.subscribe(/**
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
                }

            }

            
         

        })
    })

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

</script>
<Navigation></Navigation>
<div class="flex flex-col md:flex-row">
    <Filters></Filters>
    <MapLibre
            center={[4.3489627, 52.0248904]}
            zoom={10}
            class="w-full h-[94vh] mt-6 md:mt-0"
            standardControls
            style={'https://api.maptiler.com/maps/basic-v2/style.json?key=OnrP8312jxPUqCynDmRh'}
    >
        {#each markers as marker (marker.vehicleDescriptor.dataOwnerCode + ":" + marker.vehicleDescriptor.vehicleNumber)}
            <Marker
                lngLat={[marker.position.longitude, marker.position.latitude]}
                class="grid h-8 w-8 place-items-center z-10"
                on:click={() => selectedVehicle = marker}
            >
                <!-- Triangle -->
                <div class="w-0 h-0
                      border-l-[13px] border-l-transparent
                      border-b-[32px] border-b-black
                      border-r-[13px] border-r-transparent"
                        style="transform: rotate({marker.position.bearing}deg);">

                    <div class="relative top-[2px] right-[12px] w-0 h-0
                      border-l-[12px] border-l-transparent
                      border-b-[29px] border-b-white
                      border-r-[12px] border-r-transparent">
                      <div class="text-[8px] text-gray-800 rotate-90">
                        {marker.vehicleDescriptor.dataOwnerCode}
                      </div>
                    </div>
                </div>
            </Marker>
        {/each}
        {#each dots as lngLat}
            <Marker {lngLat} class="rounded bg-yellow-700 w-1 h-1"></Marker>
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
            <div class="flex flex-col gap-2 p-4 shadow w-80 text-sm">
                <div class="flex flex-col justify-center">
                    <h2 class="text-lg font-bold">Voertuiginformatie</h2>
                    <div class="w-full h-[2px] bg-blue-500"></div>
                </div>
                <div class="flex flex-col">
                    <h1 class="text-lg font-bold">Deurstatus</h1>
                    {#if selectedVehicle.doorStatus == 2}
                    <div class="w-96 bg-green-500 h-4"></div>
                    {:else if selectedVehicle.doorStatus == 1} 
                    <div class="w-96 bg-red-500 h-4"></div>
                    {:else if selectedVehicle.doorStatus == 3} 
                    <div class="w-96 bg-yellow-500 h-4"></div>
                    {/if}
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
                            <h3>Direction</h3>
                            <span>{selectedVehicle.vehicleDescriptor.drivingDirection}</span>
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
                            <span>{(selectedVehicle.position.speed*3.6).toFixed(1)}km/h</span>
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
        </div>
    {/if}
</div>
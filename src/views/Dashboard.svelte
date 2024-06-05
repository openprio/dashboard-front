<script>
    import {MapLibre, Marker} from 'svelte-maplibre';
    import Navigation from "../components/Navigation.svelte";
    import { onMount } from 'svelte';
    import socket from '../socket.js';
    import Filters from "../components/Filters.svelte";

    /**
     * @type {LocationMessage[]}
     */
    let messages = [];

    /**
     * @type {LocationMessage[]}
     */
    let markers = [];

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
                messages = [...messages, currentMessage];
            }

            if (currentMessage) {
                let vehicleNumber = currentMessage.vehicleDescriptor.vehicleNumber;

                if (markers.find(m => m.vehicleDescriptor.vehicleNumber === vehicleNumber)) {
                    markers = markers.map(m => {
                        if (m.vehicleDescriptor.vehicleNumber !== vehicleNumber) {
                            return m;
                        }

                        if (vehicleNumber === selectedVehicle.vehicleDescriptor.vehicleNumber) {
                            dots = [...dots, [m.position.longitude, m.position.latitude]];
                        }

                        return currentMessage;
                    })
                } else {
                    markers = [...markers, currentMessage];
                }
            }
        })
    })

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
        {#each markers as marker (marker.vehicleDescriptor.dataOwnerCode)}
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
                      border-l-[5px] border-l-transparent
                      border-b-[12px] border-b-gray-800 group-hover:border-b-white
                      border-r-[5px] border-r-transparent">
                    </div>
                </div>
            </button>
            <div class="flex flex-col gap-2 p-4 shadow text-sm">
                <div class="flex flex-col justify-center">
                    <h2 class="text-lg font-bold">Voertuiginformatie</h2>
                    <div class="w-full h-[2px] bg-blue-500"></div>
                </div>
                <div class="flex flex-col">
                    <h1 class="text-lg font-bold">Deurstatus</h1>
                    <span>{selectedVehicle.doorStatus}</span>
                </div>
                <div class="flex flex-col">
                    <h1 class="text-lg font-bold">Voertuigbeschrijving</h1>
                    <div class="flex flex-col">
                        <div class="flex gap-2 justify-between">
                            <h3>Voertuignummer</h3>
                            <span>{selectedVehicle.vehicleDescriptor.vehicleNumber}</span>
                        </div>
                        <div class="flex gap-2 justify-between">
                            <h3>Block code</h3>
                            <span>{selectedVehicle.vehicleDescriptor.blockCode}</span>
                        </div>
                        <div class="flex gap-2 justify-between">
                            <h3>Rij richting</h3>
                            <span>{selectedVehicle.vehicleDescriptor.drivingDirection}</span>
                        </div>
                        <div class="flex gap-2 justify-between">
                            <h3>Aantal gekoppelde voertuigen</h3>
                            <span>{selectedVehicle.vehicleDescriptor.numberOfVehiclesCoupled}</span>
                        </div>
                        <div class="flex gap-2 justify-between">
                            <h3>Data owner code</h3>
                            <span>{selectedVehicle.vehicleDescriptor.dataOwnerCode}</span>
                        </div>
                    </div>
                </div>
                <div class="flex flex-col">
                    <h1 class="text-lg font-bold">Positie</h1>
                    <div class="flex flex-col">
                        <div class="flex gap-2 justify-between">
                            <h3>Latitude</h3>
                            <span>{selectedVehicle.position.latitude}</span>
                        </div>
                        <div class="flex gap-2 justify-between">
                            <h3>Longitude</h3>
                            <span>{selectedVehicle.position.longitude}</span>
                        </div>
                        <div class="flex gap-2 justify-between">
                            <h3>Snelheid</h3>
                            <span>{selectedVehicle.position.speed}</span>
                        </div>
                        <div class="flex gap-2 justify-between">
                            <h3>Hdop</h3>
                            <span>{selectedVehicle.position.hdop}</span>
                        </div>
                        <div class="flex gap-2 justify-between">
                            <h3>Nauwkeurigheid</h3>
                            <span>{selectedVehicle.position.accuracy}</span>
                        </div>
                        <div class="flex gap-2 justify-between">
                            <h3>Odometer</h3>
                            <span>{selectedVehicle.position.odometer}</span>
                        </div>
                    </div>
                </div>
                <div class="flex flex-col">
                    <h1 class="text-lg font-bold">Timestamp</h1>
                    <span>{selectedVehicle.timestamp}</span>
                </div>
            </div>
        </div>
    {/if}
</div>
<script>
    import {GeoJSON, LineLayer, MapLibre, Popup} from 'svelte-maplibre';
    import Navigation from "../lib/Navigation.svelte";
    import {access_token} from "../auth.js";
    import { onMount } from 'svelte';
    import socket from '../socket.js';

    /**
     * @type {LocationMessage[]}
     */
    let messages = [];
    let showFilters = true;

    onMount(() => {
        socket.subscribe(/**
         * @param {LocationMessage} currentMessage
         */
        (currentMessage) => {
            if (currentMessage) {
                messages = [...messages, currentMessage];
            }
        })
    })

    function toggleShowFilters() {
        showFilters = !showFilters;
    }

    let lineLayer = {
        'type': 'Feature',
        'geometry': {
            'type': 'LineString',
            'coordinates': messages.map(m => [m.position.longitude, m.position.latitude])
        }
    };

</script>
<Navigation></Navigation>
<div class="flex flex-col md:flex-row">
    <div id="filters" class="bg-gray-100 flex flex-col md:flex-row">
        {#if showFilters}
            <div class="flex flex-col p-4 gap-2 md:w-80">
                <div class="flex flex-col">
                    <label for="car-id" class="text-lg text-gray-800 font-medium">Grootwagen nr.</label>
                    <input id="car-id" type="text" class="rounded-sm border border-gray-500 px-2 py-1"/>
                </div>
                <div class="flex flex-col">
                    <label for="data-owner-id" class="text-lg text-gray-800 font-medium">Data owner code</label>
                    <input id="data-owner-id" type="text" class="rounded-sm border border-gray-500 px-2 py-1"/>
                </div>
                <div class="flex flex-col">
                    <label for="line-planning-id" class="text-lg text-gray-800 font-medium">Line planning nr.</label>
                    <input id="line-planning-id" type="text" class="rounded-sm border border-gray-500 px-2 py-1"/>
                </div>
                <div class="flex flex-col">
                    <label for="journey-id" class="text-lg text-gray-800 font-medium">Journey nr.</label>
                    <input id="journey-id" type="text" class="rounded-sm border border-gray-500 px-2 py-1"/>
                </div>
                {#if $access_token}
                    <div class="flex flex-col">
                        <label for="start-date" class="text-lg text-gray-800 font-medium">Startdate</label>
                        <input id="start-date" type="datetime-local" class="rounded-sm border border-gray-500 px-2 py-1"/>
                    </div>
                    <div class="flex flex-col">
                        <label for="end-date" class="text-lg text-gray-800 font-medium">Enddate</label>
                        <input id="end-date" type="datetime-local" class="rounded-sm border border-gray-500 px-2 py-1"/>
                    </div>
                {/if}
                <div class="flex flex-row gap-3 mt-4">
                    <button class="bg-blue-700 rounded px-2 py-1 text-white border border-gray-800 w-1/2">Zoek</button>
                    <button class="bg-red-700 rounded px-2 py-1 text-white border border-gray-800 w-1/2">Reset</button>
                </div>
            </div>
        {/if}
        <button class="bg-gray-400 hover:bg-gray-700 h-7 w-full md:h-full md:w-5 text-white" on:click={toggleShowFilters}>
            {showFilters ? "<" : ">"}
        </button>
    </div>
    <MapLibre
            center={[4.3489627, 52.0248904]}
            zoom={10}
            class="w-full h-[94vh]"
            standardControls
            style="https:\/\/basemaps.cartocdn.com\/gl\/positron-gl-style\/style.json"
    >
        <GeoJSON id="maine" data={lineLayer}>
            <LineLayer
                    layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                    paint={{
                        'line-width': 5,
                        'line-color': '#008800',
                        'line-opacity': 0.8,
                      }}
            >
                <Popup offset={[0, -10]}>
                    <div class="text-lg font-bold">OV</div>
                </Popup>
            </LineLayer>
        </GeoJSON>
    </MapLibre>
</div>
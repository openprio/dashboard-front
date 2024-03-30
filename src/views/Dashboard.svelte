<script>
    import {DefaultMarker, GeoJSON, LineLayer, MapLibre, Marker, Popup} from 'svelte-maplibre';
    import Navigation from "../lib/Navigation.svelte";
    import {access_token} from "../auth.js";
    import { onMount } from 'svelte';
    import socket from '../socket.js';

    /**
     * @type {LocationMessage[]}
     */
    let messages = [];

    /**
     * @type {LineLayer[]}
     */
    let markers = [];
    let locations = [];

    let clickedName = '';
    let showFilters = true;

    onMount(() => {
        socket.subscribe(/**
         * @param {LocationMessage} currentMessage
         */
        (currentMessage) => {
            if (currentMessage) {
                messages = [...messages, currentMessage];
            }

            // markers.push({
            //     'type': 'Feature',
            //     'geometry': {
            //         'type': 'LineString',
            //         'coordinates': messages.map(m => [m.position.longitude, m.position.latitude])
            //     }
            // });

            if (currentMessage) {
                let newPosition = {
                    lngLat: [currentMessage.position.longitude, currentMessage.position.latitude],
                    bearing: Math.round(currentMessage.position.bearing),
                    label: currentMessage.vehicleDescriptor.dataOwnerCode,
                    code: currentMessage.vehicleDescriptor.vehicleNumber,
                };

                if (markers.find(m => m.code === currentMessage.vehicleDescriptor.vehicleNumber)) {
                    markers = markers.map(m => {
                        if (m.code !== currentMessage.vehicleDescriptor.vehicleNumber) {
                            return m;
                        }

                        locations = [...locations, m.lngLat];

                        return newPosition;
                    })
                } else {
                    markers = [...markers, newPosition];
                }
            }
            console.log(locations);
        })
    })


    function toggleShowFilters() {
        showFilters = !showFilters;
    }
</script>
<Navigation></Navigation>
<div class="flex flex-col md:flex-row">
    <div id="filters" class="bg-gray-100 flex flex-col md:flex-row absolute md:static z-10 w-full md:w-auto">
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
        <button class="group bg-gray-400 hover:bg-gray-700 h-7 w-full md:h-full md:w-5 text-white flex items-center justify-center" on:click={toggleShowFilters}>
<!--            <div class="rotate-90 md:rotate-0">{showFilters ? "<" : ">"}</div>-->
            <div class="rotate-90 md:rotate-0">
                <div class="w-0 h-0 {showFilters ? '-rotate-90' : 'rotate-90'}
                      border-l-[6px] border-l-transparent
                      border-b-[14px] border-b-gray-800 group-hover:border-b-white
                      border-r-[6px] border-r-transparent">
                </div>
            </div>
        </button>
    </div>
    <MapLibre
            center={[4.3489627, 52.0248904]}
            zoom={10}
            class="w-full h-[94vh] mt-7 md:mt-0"
            standardControls
            style={'https://api.maptiler.com/maps/basic-v2/style.json?key=OnrP8312jxPUqCynDmRh'}
    >
        {#each markers as { lngLat, bearing, label, code } (code)}
            <Marker
                {lngLat}
                on:click={() => (clickedName = code)}
                class="grid h-8 w-8 place-items-center z-10"
            >
                <!-- Triangle -->
                <div class="w-0 h-0
                      border-l-[13px] border-l-transparent
                      border-b-[32px] border-b-black
                      border-r-[13px] border-r-transparent"
                        style="transform: rotate({bearing}deg);">

                    <div class="relative top-[2px] right-[12px] w-0 h-0
                      border-l-[12px] border-l-transparent
                      border-b-[29px] border-b-white
                      border-r-[12px] border-r-transparent">
                      <div class="text-[8px] text-gray-800 rotate-90">
                        {label}
                      </div>
                    </div>
                </div>

                <Popup openOn="hover" offset={[0, -10]}>
                    <h2 class="text-lg font-bold">Voertuiginformatie</h2>
                    <div>
                        Dataownercode: {label}
                    </div>
                    <div>
                        Grootwagennummer: {code}
                    </div>
                </Popup>
            </Marker>
        {/each}
        {#each locations as lngLat}
            <Marker {lngLat} class="rounded bg-yellow-800 w-2 h-2"></Marker>
        {/each}
    </MapLibre>
</div>
<script>
    import {DefaultMarker, MapLibre, Popup} from 'svelte-maplibre';
    import Navigation from "../lib/Navigation.svelte";
    import {access_token} from "../auth.js";
    import { onMount } from 'svelte';
    import socket from '../socket.js';

    /**
     * @type {LocationMessage[]}
     */
    let messages = [];

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

</script>
<Navigation></Navigation>
<div class="flex flex-row">
    <div id="filters" class="w-80 bg-gray-100">
        <div class="flex flex-col p-4 gap-2">
            <div>
                <label for="car-id" class="text-lg text-gray-800 font-medium">Grootwagen nr.</label>
                <input id="car-id" type="text" class="rounded-sm shadow px-2 py-1"/>
            </div>
            <div>
                <label for="data-owner-id" class="text-lg text-gray-800 font-medium">Data owner code</label>
                <input id="data-owner-id" type="text" class="rounded-sm shadow px-2 py-1"/>
            </div>
            <div>
                <label for="line-planning-id" class="text-lg text-gray-800 font-medium">Line planning nr.</label>
                <input id="line-planning-id" type="text" class="rounded-sm shadow px-2 py-1"/>
            </div>
            <div>
                <label for="journey-id" class="text-lg text-gray-800 font-medium">Journey nr.</label>
                <input id="journey-id" type="text" class="rounded-sm shadow px-2 py-1"/>
            </div>
            {#if $access_token}
                <div>
                    <label for="start-date" class="text-lg text-gray-800 font-medium">Startdate</label>
                    <input id="start-date" type="datetime-local" class="rounded-sm shadow px-2 py-1"/>
                </div>
                <div>
                    <label for="end-date" class="text-lg text-gray-800 font-medium">Enddate</label>
                    <input id="end-date" type="datetime-local" class="rounded-sm shadow px-2 py-1"/>
                </div>
            {/if}
        </div>
    </div>
    <MapLibre
            center={[4.3489627, 52.0248904]}
            zoom={10}
            class="w-full h-[94vh]"
            standardControls
            style="https:\/\/basemaps.cartocdn.com\/gl\/positron-gl-style\/style.json"
    >
        {#each messages as { position, timestamp, vehicleDescriptor }}
            <!-- Unlike the custom marker example, default markers do not have mouse events,
            and popups only support the default openOn="click" behavior -->
            <DefaultMarker lngLat={{lng: position.longitude, lat: position.latitude}}>
                <Popup offset={[0, -10]}>
                    <div class="text-lg font-bold">{vehicleDescriptor.dataOwnerCode}</div>
                </Popup>
            </DefaultMarker>
        {/each}
    </MapLibre>
</div>
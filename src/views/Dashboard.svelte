<script>
    import {MapLibre, Marker, Popup} from 'svelte-maplibre';
    import Navigation from "../lib/Navigation.svelte";
    import { onMount } from 'svelte';
    import socket from '../socket.js';
    import Filters from "../lib/Filters.svelte";

    /**
     * @type {LocationMessage[]}
     */
    let messages = [];

    /**
     * @type {LineLayer[]}
     */
    let markers = [];
    let locations = [];

    onMount(() => {
        socket.subscribe(/**
         * @param {LocationMessage} currentMessage
         */
        (currentMessage) => {
            if (currentMessage) {
                messages = [...messages, currentMessage];
            }

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

</script>
<Navigation></Navigation>
<div class="flex flex-col md:flex-row">
    <Filters></Filters>
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

                <Popup openOn="click" offset={[0, -10]}>
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
            <Marker {lngLat} class="rounded bg-yellow-700 w-2 h-2"></Marker>
        {/each}
    </MapLibre>
</div>
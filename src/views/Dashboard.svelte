<script>
    import {GeoJSON, LineLayer, MapLibre} from 'svelte-maplibre';
    import Navigation from "../lib/Navigation.svelte";
    import {access_token} from "../auth.js";

    let data = {
        'type': 'Feature',
        'geometry': {
            'type': 'Polygon',
            'coordinates': [
                [
                    [-67.13734351262877, 45.137451890638886],
                    [-66.96466, 44.8097],
                    [-68.03252, 44.3252],
                    [-69.06, 43.98],
                    [-70.11617, 43.68405],
                    [-70.64573401557249, 43.090083319667144],
                    [-70.75102474636725, 43.08003225358635],
                    [-70.79761105007827, 43.21973948828747],
                    [-70.98176001655037, 43.36789581966826],
                    [-70.94416541205806, 43.46633942318431],
                    [-71.08482, 45.3052400000002],
                    [-70.6600225491012, 45.46022288673396],
                    [-70.30495378282376, 45.914794623389355],
                    [-70.00014034695016, 46.69317088478567],
                    [-69.23708614772835, 47.44777598732787],
                    [-68.90478084987546, 47.184794623394396],
                    [-68.23430497910454, 47.35462921812177],
                    [-67.79035274928509, 47.066248887716995],
                    [-67.79141211614706, 45.702585354182816],
                    [-67.13734351262877, 45.137451890638886]
                ]
            ]
        }
    };

</script>
<Navigation></Navigation>
<div class="flex flex-row">
    <div id="filters" class="w-80 bg-blue-300">
        <div class="flex flex-col p-4">
            <label>Grootwagennr.</label>
            <input type="text"/>
            <label>Data Owner Code</label>
            <input type="text"/>
            <label>Line planning nr.</label>
            <input type="text"/>
            <label>Journey nr.</label>
            <input type="text"/>
            {#if $access_token}
                <label>Startdate</label>
                <input type="text"/>
                <label>Enddate</label>
                <input type="text"/>
            {/if}
        </div>
    </div>
    <MapLibre
            center={[50,20]}
            zoom={7}
            class="w-full h-[94vh]"
            standardControls
            style="https:\/\/basemaps.cartocdn.com\/gl\/positron-gl-style\/style.json"
    >
        <GeoJSON id="maine" {data}>
            <LineLayer
                    layout={{ 'line-cap': 'round', 'line-join': 'round' }}
                    paint={{
                        'line-width': 5,
                        'line-dasharray': [5, 2],
                        'line-color': '#008800',
                        'line-opacity': 0.8,
                      }}
            />
        </GeoJSON>
    </MapLibre>
</div>
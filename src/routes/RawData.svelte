<script lang="ts">
    import { onMount } from "svelte";
    import Navigation from "../components/Navigation.svelte";
    import { createColumnHelper, createSvelteTable, FlexRender, getCoreRowModel, getSortedRowModel, renderComponent, renderSnippet, type Row, type SortingFn } from '../lib/table';
    import { Link } from "svelte-routing";
    import { getIdToken } from "../auth";
    import { Button, ButtonGroup, CloseButton, Datepicker, Dropdown, DropdownItem, Input, P } from 'flowbite-svelte';
    import { ChevronDownOutline, SearchOutline } from 'flowbite-svelte-icons';
    import { initFlowbite } from 'flowbite';
    import {extract_timestamp_millis} from "../util/time_util";
    import { CircleLayer, MapLibre, GeoJSON } from "svelte-maplibre";
    import type {Feature, FeatureCollection, Point} from 'geojson';


    const urlParams = new URLSearchParams(window.location.search);
    const hasVehicleNumber = urlParams.has('vehicle_number');
    const hasDataownerCode = urlParams.has('dataowner_code');
    const hasTimestamp = urlParams.has('timestamp');

  
  
  
    
    onMount(async () => {
        initFlowbite();
    });
    type RawDataRecord = {
        time:                           string;
        location_timestamp:             string;
        dataowner_code:                 string;
        vehicle_number:                 number;
        msg_type:                       string;
        prioritization_response_status: string;
        longitude:                      number;
        latitude:                       number;
        latency:                        number;
        bearing:                        number;
        speed:                          number;
        odometer:                       number;
        accuracy:                       number;
        hdop:                           number;
        number_of_received_satellites:  number;
        door_opening_status:            number;
        stop_button_status:             null;
        driving_direction:              number;
    }

    const colHelp = createColumnHelper<RawDataRecord>();

    const columnDefs = [
        colHelp.accessor('time', { 
            header: () => (
                renderSnippet(defaultHeaderTitle, 'msg_timestamp')
            ),
            cell: ( cell ) => (
                renderSnippet(defaultCell, extract_timestamp_millis(cell.getValue()))
            ) 
        }),
        colHelp.accessor('location_timestamp', { 
            header: () => (
                renderSnippet(defaultHeaderTitle, 'location timestamp')
            ),
            cell: ( cell ) => (
                renderSnippet(defaultCell,  extract_timestamp_millis(cell.getValue()))
            )
        }),
        colHelp.accessor('latency', { 
            header: () => (
                renderSnippet(defaultHeaderTitle, 'latency [ms]')
            ),
            cell: ( cell ) => (
                renderSnippet(defaultCell,  cell.getValue())
            )
        }),
        colHelp.accessor('msg_type', { 
            header: () => (
                renderSnippet(defaultHeaderTitle, 'msg_type')
            ),
            cell: ( cell ) => (
                renderSnippet(defaultCell,  cell.getValue())
            )
        }),
        
       
    ];

    type BoundingBox = [[number, number], [number, number]];

    function calculateBoundingBox(
    records: RawDataRecord[]
): BoundingBox | null {
    if (records.length === 0) {
        return null; // Return null if there are no records
    }

    const initialBBox = {
        minLongitude: records[0].longitude,
        minLatitude: records[0].latitude,
        maxLongitude: records[0].longitude,
        maxLatitude: records[0].latitude,
    };

    // Calculate the raw bounding box
    const bbox = records.reduce((bbox, record) => {
        // ignore 0.0,0.0 coordinates
        if (record.latitude < 0.1) {
            return {
                minLongitude: bbox.minLongitude,
                minLatitude: bbox.minLatitude,
                maxLongitude: bbox.maxLongitude,
                maxLatitude: bbox.maxLatitude,
            };
        }


        return {
            minLongitude: Math.min(bbox.minLongitude, record.longitude),
            minLatitude: Math.min(bbox.minLatitude, record.latitude),
            maxLongitude: Math.max(bbox.maxLongitude, record.longitude),
            maxLatitude: Math.max(bbox.maxLatitude, record.latitude),
        };
    }, initialBBox);

    // Calculate width and height of the bbox
    const bboxWidth = bbox.maxLongitude - bbox.minLongitude;
    const bboxHeight = bbox.maxLatitude - bbox.minLatitude;

    // Set padding as a percentage of width and height (e.g., 10%)
    const paddingFactor = 0.3;
    const longitudePadding = bboxWidth * paddingFactor;
    const latitudePadding = bboxHeight * paddingFactor;

    // Add padding to the bbox
    const paddedBBox = {
        minLongitude: bbox.minLongitude - longitudePadding,
        minLatitude: bbox.minLatitude - latitudePadding,
        maxLongitude: bbox.maxLongitude + longitudePadding,
        maxLatitude: bbox.maxLatitude + latitudePadding,
    };

    // Convert to desired format
    return [
        [paddedBBox.minLongitude, paddedBBox.maxLatitude],
        [paddedBBox.maxLongitude, paddedBBox.minLatitude],
    ];
}
 
    let rows: RawDataRecord[] = $state([]);
    // Create the table.
    let table = createSvelteTable({
        get data() { 
            return rows; 
        },
        columns: columnDefs,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    let locationHistoryGeoJSON: FeatureCollection = $state({
        type: 'FeatureCollection',
        features: []
    });

    let map: maplibregl.Map = $state(null);

    async function loadData(dataownerCode, vehicleNumber, startTime, endTime) {
        let token = await getIdToken();
        try {
            let response = await fetch(
                `https://dashboard-api.openprio.nl/raw_data?data_owner_code=${dataownerCode}&vehicle_number=${vehicleNumber}&start_time=${startTime}&end_time=${endTime}`,
                {
                    headers: {
                        "Authorization": "Bearer " + token,
                    }
                }
            );
           


            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            let result = await response.json();
            rows = result.map((rawDataRecord: RawDataRecord) => {
                return rawDataRecord;
            });
            let features = result.map((rawDataRecord: RawDataRecord) => {
                let historyPoint: Feature<Point> = {
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [rawDataRecord.longitude, rawDataRecord.latitude]
                    },
                    properties: {
                        "type_of_message": rawDataRecord.msg_type,
                        "border-color": '#000000',
                        "color": '#000000',
                        "tlc_id": 1,
                    }
                };
                return historyPoint;
            });

            locationHistoryGeoJSON = {
                type: 'FeatureCollection',
                features: features
            };
            let bounds = calculateBoundingBox(rows);

            map.fitBounds(bounds);
            




        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    }
   



    let selectedDate = $state(new Date());
    let dataownerCode = $state("HTM");
    if (hasDataownerCode) {
        dataownerCode = urlParams.get("dataowner_code");
    }
    let vehicleNumber = $state("");
    if (hasVehicleNumber) {
        vehicleNumber = urlParams.get("vehicle_number");
    }
    
    let showMap = $state(true);
    let selectedTime = $state(new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false 
    }));

    let highlightTimestamp = $state(null);
    if (hasTimestamp) {
        highlightTimestamp = parseInt(urlParams.get("timestamp"));
        let newTime = new Date(highlightTimestamp);
        selectedDate = newTime;
        selectedTime = newTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false 
        });


    }




    function setDataOwner(newDataownerCode) {
        dataownerCode = newDataownerCode;
        console.log(dataownerCode);
    }



    $effect(() => {
        let test = dataownerCode + selectedDate + vehicleNumber;
        
        let splittedTime = selectedTime.split(":");
        let hours = parseInt(splittedTime[0]);
        let minutes = parseInt(splittedTime[1]);
        let seconds = parseInt(splittedTime[2]);
        let combinedDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(),
            hours, minutes, seconds);
        console.log(combinedDate)

        let startDate= new Date(combinedDate.getTime() - 30 * 1000).toISOString();
        let endDate = new Date(combinedDate.getTime() + 30 * 1000).toISOString();
        

        loadData(dataownerCode, vehicleNumber, startDate, endDate)

    });

    

</script>
  
{#snippet defaultHeaderTitle(content: any)}
    <th class="py-2 pr-8 border-b border-neutral-200 font-medium text-left">{content}</th>
{/snippet}

{#snippet defaultCell(content: any)}
    <td class="text-sm pr-8">{content}</td>
{/snippet}

<div class="flex flex-col h-screen">
    <header class="py-5">
        <Navigation></Navigation>
    </header>
    <main class="flex-1 overflow-y-auto pt-5">
    <div class="m-4 flex flex-row space-x-4">
        <ButtonGroup class="w-fit">
            <Button color="none" class="flex-shrink-0 text-gray-900 bg-gray-100 border border-gray-300 dark:border-gray-700 dark:text-white hover:bg-gray-200 focus:ring-gray-300 dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-800">
            {dataownerCode}<ChevronDownOutline class="w-6 h-6" />
            </Button>
            <Dropdown>
            <DropdownItem onclick={() => setDataOwner("HTM")}>HTM</DropdownItem>
            <DropdownItem onclick={() => setDataOwner("EBS")}>EBS</DropdownItem>
            </Dropdown>
            <Input placeholder="Grootwagennummer" bind:value={vehicleNumber} />
        </ButtonGroup>


        <div class="w-80">
            <Datepicker placeholder="Selecteer datum" bind:value={selectedDate} />
        </div>


        <form class="">
            <div class="flex">
                <button id="dropdown-duration-button" data-dropdown-toggle="dropdown-time-before" class="border-s-0 flex-shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center text-gray-900 bg-gray-100 border border-gray-300 rounded-s-lg hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700 dark:text-white dark:border-gray-600" type="button">
                    -30s <svg class="w-2.5 h-2.5 ms-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/></svg>
                    </button>
                    <div id="dropdown-time-before" class="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-36 dark:bg-gray-700">
                        <ul class="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdown-duration-button">
                            <li>
                                <button type="button" class="inline-flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white" role="menuitem">
                                    -30s
                                </button>
                            </li>
                            <li>
                                <button type="button" class="inline-flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white" role="menuitem">
                                    -1 min
                                </button>
                            </li>
                            <li>
                                <button type="button" class="inline-flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white" role="menuitem">
                                    -2 min
                                </button>
                            </li>
                            <li>
                                <button type="button" class="inline-flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white" role="menuitem">
                                    -5 min
                                </button>
                            </li>
                            <li>
                                <button type="button" class="inline-flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white" role="menuitem">
                                    -30 min
                                </button>
                            </li>
                        </ul>
                    </div>
                <input type="time" id="time" step="2"  class="rounded-none bg-gray-50 border text-gray-900 leading-none focus:ring-blue-500 focus:border-blue-500 block flex-1 w-full text-sm border-gray-300 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" bind:value={selectedTime} required>
                <button id="dropdown-duration-button" data-dropdown-toggle="dropdown-time-after" class="border-s-0 flex-shrink-0 z-10 inline-flex items-center py-2.5 px-4 text-sm font-medium text-center text-gray-900 bg-gray-100 border border-gray-300 rounded-e-lg hover:bg-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 dark:focus:ring-gray-700 dark:text-white dark:border-gray-600" type="button">
                +30s <svg class="w-2.5 h-2.5 ms-2.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 4 4 4-4"/></svg>
                </button>
                <div id="dropdown-time-after" class="z-10 hidden bg-white divide-y divide-gray-100 rounded-lg shadow w-36 dark:bg-gray-700">
                    <ul class="py-2 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdown-duration-button">
                        <li>
                            <button type="button" class="inline-flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white" role="menuitem">
                                +30s
                            </button>
                        </li>
                        <li>
                            <button type="button" class="inline-flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white" role="menuitem">
                                +1 min
                            </button>
                        </li>
                        <li>
                            <button type="button" class="inline-flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white" role="menuitem">
                                +2 min
                            </button>
                        </li>
                        <li>
                            <button type="button" class="inline-flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white" role="menuitem">
                                +5 min
                            </button>
                        </li>
                        <li>
                            <button type="button" class="inline-flex w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white" role="menuitem">
                                +30 min
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </form>

        {#if !showMap}
        <button type="button" class="space-x-2 text-gray-900 bg-white hover:bg-gray-100 border border-gray-200 focus:ring-4 focus:outline-none focus:ring-gray-100 font-medium rounded-lg text-sm px-3 py-2 text-center inline-flex items-center dark:focus:ring-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700 me-2" onclick={() => {showMap = true}}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="20" height="20" class="me-2">
                <defs>
                <style>.cls-1{fill:#231f20}</style>
                </defs>
                <g id="maps">
                <path class="cls-1" d="m29 6.94-8.52-2.83h-.06A1 1 0 0 0 20 4a.89.89 0 0 0-.43.11h-.08l-2.85 1.08a5 5 0 0 0-1-1.59 5 5 0 0 0-7.9.77 4.87 4.87 0 0 0-.47 1L3.94 4.26A1.47 1.47 0 0 0 2 5.66V7a1 1 0 0 0 2 0v-.61l3 1a5 5 0 0 0 .51 1.87l3.57 7.19a1 1 0 0 0 1.8 0l3.57-7.19A5.06 5.06 0 0 0 17 7.41a1.47 1.47 0 0 0 0-.21l2-.76v18.87l-6 2.25V20a1 1 0 0 0-2 0v7.61l-7-2.33V11a1 1 0 0 0-2 0v14.66a1.48 1.48 0 0 0 1 1.4l8.51 2.83h.07A.92.92 0 0 0 12 30a1 1 0 0 0 .44-.11h.07L20 27.06l2.66.89a1 1 0 0 0 .64-1.9l-2.3-.77V6.39l7 2.33v18.89l-.68-.23a1 1 0 0 0-.64 1.9l1.38.46a1.48 1.48 0 0 0 .46.08 1.53 1.53 0 0 0 .87-.28 1.5 1.5 0 0 0 .61-1.2v-20a1.48 1.48 0 0 0-1-1.4zM14.68 8.37 12 13.75 9.32 8.37a3 3 0 0 1 .14-2.95A3 3 0 0 1 14.19 5a3.07 3.07 0 0 1 .8 2.3 3.18 3.18 0 0 1-.31 1.07z"/>
                <path class="cls-1" d="M12 6a1 1 0 1 0 1 1 1 1 0 0 0-1-1z"/>
                </g>
            </svg>
            Toon kaart
        </button>
        {/if}
    </div>




    <div class="static w-full">
        <table class="table-auto m-4">
            <thead class="thead-light">
            <tr>
                {#each table.getHeaderGroups() as headerGroup}
                {#each headerGroup.headers as header}
                    <FlexRender content={header.column.columnDef.header} context={header.getContext()} />
                {/each}
                {/each}
            </tr>
            </thead>
            <tbody>
            {#each table.getRowModel().rows as row}
                <tr >
                {#each row.getVisibleCells() as cell}
                    <FlexRender content={cell.column.columnDef.cell} context={cell.getContext()} />          
                {/each}
                </tr>
            {/each}
            </tbody>
        </table>
        {#if showMap}
        <div class="fixed bottom-0 end-0 w-1/2 me-2 h-[94vh] z-40">
            <CloseButton class="absolute bg-gray-50 z-50 end-0 m-4"  on:click={() => (showMap = false)} />
            <MapLibre
                bind:map={map}
                center={[4.3489627, 52.0248904]}
                zoom={10}
                class="w-full h-[100vh] mt-6 md:mt-0"
                standardControls
                style={'https://api.maptiler.com/maps/52e8038c-e9df-4d0e-a6cc-1269d04c9c19/style.json?key=wMttElGnvszMrzou5eQJ'}
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
            </MapLibre>
        </div>
        {/if}
    </div>
    </main>
</div>

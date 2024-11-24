<script lang="ts">
    import { onMount } from "svelte";
    import Navigation from "../components/Navigation.svelte";
    import { getIdToken } from "../auth";
    import Chart from "../components/Chart.svelte";
    import 'chartjs-adapter-date-fns';
    
 
    let roadRegulators = $state([]);
    let selectedRoadRegulator = $state(null);


    type DailyStats = {
        operation_date:              string;
        journey_total:               number;
        journey_intersection_passes: number;
        count_srm_sent:              number;
        count_ssm_requested:         number;
        count_ssm_processing:        number;
        count_ssm_granted:           number;
        count_openprio_received:     number;
    }

    let rows: DailyStats[] = $state([]);


    async function loadRoadRegulators() {
        let token = await getIdToken();
        try {
            let response = await fetch('https://dashboard-api.openprio.nl/road_regulators',
                {  
                    headers: {
                        "Authorization": "Bearer "  + token,
                    }
                }
            );
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            let data = await response.json();
            roadRegulators = data;
            selectedRoadRegulator = 31075;
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    }

    async function loadDailyStats(roadRegulatorId) {
        let token = await getIdToken();
        try {
            let response = await fetch(`https://dashboard-api.openprio.nl/stats?agg=daily&road_regulator=${roadRegulatorId}&filter_operating_hours=true`,
                {  
                    headers: {
                        "Authorization": "Bearer "  + token,
                    }
                }
            );
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            let result: DailyStats[] = await response.json();
            let openprio = result.map(dataPoint => { return {"x": dataPoint.operation_date, "y": ((dataPoint.count_openprio_received /  dataPoint.journey_intersection_passes) * 100.0).toFixed(1)}});
            let srm = result.map(dataPoint => { return {"x": dataPoint.operation_date, "y": ((dataPoint.count_srm_sent /  dataPoint.journey_intersection_passes) * 100.0).toFixed(1)}});
            let processing = result.map(dataPoint => { return {"x": dataPoint.operation_date, "y": ((dataPoint.count_ssm_processing /  dataPoint.journey_intersection_passes) * 100.0).toFixed(1)}});
            let granted = result.map(dataPoint => { return {"x": dataPoint.operation_date, "y": ((dataPoint.count_ssm_granted/  dataPoint.journey_intersection_passes) * 100.0).toFixed(1)}});


            data.datasets[0].data = openprio;
            data.datasets[1].data = srm;
            data.datasets[2].data = processing;
            data.datasets[3].data = granted;
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    }

    async function loadMonthlyStats(roadRegulatorId) {
        let token = await getIdToken();
        try {
            let response = await fetch(`https://dashboard-api.openprio.nl/stats?agg=monthly&road_regulator=${roadRegulatorId}&filter_operating_hours=true`,
                {  
                    headers: {
                        "Authorization": "Bearer "  + token,
                    }
                }
            );
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            let result = await response.json();
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }

    }


    onMount(async () => {
        await loadRoadRegulators();
    });

    $effect(() => {
        if (selectedRoadRegulator) {
            Promise.all([loadMonthlyStats(selectedRoadRegulator), loadDailyStats(selectedRoadRegulator)]);
        }
     
    });

    let data = $state({
        datasets: [
            {
                label: 'passages OpenPrio ontvangen [%]',
                data: [
                ],
                backgroundColor: ['#B91C1C'],
                cubicInterpolationMode: 'monotone',
                tension: 0.4,
            },
            {
                label: 'passages SRM ontvangen [%]',
                data: [
                ],
                backgroundColor: ['#eab308'],
                cubicInterpolationMode: 'monotone',
                tension: 0.4,
            },
            {
                label: 'passages PROCESSING ontvangen [%]',
                data: [
                ],
                backgroundColor: ['#dbeafe'],
                cubicInterpolationMode: 'monotone',
                tension: 0.4,
            },
            {
                label: 'passages GRANTED ontvangen [%]',
                data: [
                ],
                backgroundColor: ['#16a34a'],
                cubicInterpolationMode: 'monotone',
                tension: 0.4,
            },
        ],
    });

  const options = {
        x: {
            type: 'time',
            time: {
                unit: 'day'
            }
        },
        y: {
            type: 'linear', // Linear scale for the y-axis
        },
        plugins: {
            legend: {
                display: true,
                position: 'right',
            }
        },
        scales: {
            y: {
                ticks: {
                    // Include a dollar sign in the ticks
                    callback: function(value, index, ticks) {
                        return value.toFixed(1) + '%';
                    }
                }
            }
        }
    };

</script>


<Navigation></Navigation>

<div class="flex flex-row">
    <div class="flex-col mx-4 my-2">
        <label for="road_regulator" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Wegbeheerder</label>
        <select id="road_regulator" bind:value={selectedRoadRegulator}
        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500">
            {#each roadRegulators as roadRegulator}
                <option value={roadRegulator.road_regulator_id}>
                    {roadRegulator.road_regulator_name}
                </option>
            {/each}
        </select>
    </div>
</div>

<div class="flex flex-row">
    <div class="w-3/4">
    <Chart type='line' {data} {options} >

    </Chart>
    </div>
    <div class="w-1/4 m-1">
        <h1 class="text-xl">Uitleg statistiek</h1>

        <p class="leading-relaxed mt-4 mb-8 mr-2">
        Voor deze statistiek worden alle kruisingen meegenomen waar ten minste een SSM GRANTED voor is ontvangen. De statistiek wordt bepaald door per kruisingpassage te bepalen of er OpenPrio, SRM, SSM PROCESSING en SSM GRANTED berichten verstuurd zijn.
        </p>

        <h2 class="text-lg">Filter</h2>
        <p class="leading-relaxed mt-4 mb-8 mr-2">
        In deze statistiek zijn alleen ritten meegenomen waarvan ritten starten na het moment alle verkeerslichten in Delft operationeel zijn en eindigen voor het moment dat er VRI's worden uitgeschakelt (ma-vr 07-21, za 09-21, zo 10-21). Voor Delft zijn tevens alle passages van tram 19 uit de statistiek gehaald.
        </p>

    </div>

    

</div>

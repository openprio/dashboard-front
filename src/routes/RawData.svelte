<script lang="ts">
    import { onMount } from "svelte";
    import Navigation from "../components/Navigation.svelte";
    import { createColumnHelper, createSvelteTable, FlexRender, getCoreRowModel, getSortedRowModel, renderComponent, renderSnippet, type Row, type SortingFn } from '../lib/table';
    import { Link } from "svelte-routing";
    import { getIdToken } from "../auth";
    import type { PercentageBarData } from "../components/PercentageBarData";
    import { getPercentageBarData } from "../components/PercentageBarData";
    import PercentageBar from "../components/PercentageBar.svelte";
    

 

    async function loadData(operationDate, selectedDataOwner, linePlanningNumber, selectedDirection) {
        let token = await getIdToken();
        try {
            let response = await fetch(
                `https://dashboard-api.openprio.nl/journey_overview?data_owner_code=${selectedDataOwner}&operation_date=${operationDate}&line_planning_number=${linePlanningNumber}&direction=${selectedDirection}`,
                {
                    headers: {
                        "Authorization": "Bearer " + token,
                    }
                }
            );
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            let data = await response.json();
            rows = data.map((row: JourneyOverview) => {
                row.openprio_received_ratio = getPercentageBarData( row.count_openprio_received / row.count_intersections);
                row.processing_ratio = getPercentageBarData( row.count_ssm_proccessing/ row.count_intersections);
                row.success_ratio = getPercentageBarData( row.count_ssm_granted / row.count_intersections);

                return row;
            })

        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    }


</script>

<div>

</div>
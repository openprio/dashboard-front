<script lang="ts">
    import { onMount } from "svelte";
    import Navigation from "../components/Navigation.svelte";
    import { createColumnHelper, createSvelteTable, FlexRender, getCoreRowModel, renderSnippet } from '../lib/table';
    import { Link } from "svelte-routing";
    import Intersectionperjourney from "./Intersectionperjourney.svelte";
    
    type intersectionJourneysLink = {
        data_owner_code: string,
        line_planning_number: string,
        direction: string,
    }

    type PercentageBar = {
        percentage: string;
        color: string;
        bg_color: string;
    }

    type IntersectionLineStat = {
        data_owner_code: string
        line_planning_number: string
        direction: string
        journey_total: number
        count_srm_new: number
        count_ssm_requested: number
        count_ssm_proccessing: number
        count_ssm_granted: number
        count_openprio_received: number
        average_time_at_intersection: number
        max_time_at_intersection: number
        min_time_at_intersection: number
        median_time_at_intersection: number
        percent85_time_at_intersection: number
        success_ratio:         PercentageBar
        openprio_received_ratio: PercentageBar
        intersectionJourneysLink: intersectionJourneysLink

    };

    let { road_regulator_id, intersection_id, operation_day} = $props();



    // 💡 Create a column helper for the user profile data.
    // It's not necessary, but it helps with typescript stuff.
    const colHelp = createColumnHelper<IntersectionLineStat>();

    // Define the columns using the column helper.
    // This is a basic example. Check other examples for more complexity.
    const columnDefs = [
        colHelp.accessor('data_owner_code', { 
            header: () => (
                renderSnippet(defaultHeaderTitle, 'Data owner')
            ),
            cell: ( cell ) => (
                renderSnippet(defaultCell, cell.getValue())
            ) 
        }),
        colHelp.accessor('intersectionJourneysLink', { 
            header: () => (
                renderSnippet(defaultHeaderTitle, 'Line planning number')
            ),
            cell: ( cell ) => (
                renderSnippet(intersectionJourneysLink, cell.getValue())
            )
        }),
        colHelp.accessor('direction', { 
            header: () => (
                renderSnippet(defaultHeaderTitle, 'Richting')
            ),
            cell: ( cell ) => (
                renderSnippet(defaultCell, cell.getValue())
            )
        }
        ),
        colHelp.accessor('journey_total', { 
            header: () => (
                renderSnippet(defaultHeaderTitle, 'Ritten gepasseerd')
            ),
            cell: ({ cell }) => renderSnippet(defaultCell, cell.getValue())
        }),
        colHelp.accessor('success_ratio', { 
            header: () => (
                renderSnippet(defaultHeaderTitle, 'Succesvolle aanvragen')
            ),
            cell: ({ cell }) => renderSnippet(ratioCell, cell.getValue())
        }),
        colHelp.accessor('openprio_received_ratio', { 
            header: () => (
                renderSnippet(defaultHeaderTitle, 'OpenPrio ontvangen')
            ),
            cell: ({ cell }) => renderSnippet(ratioCell, cell.getValue())
        }),
        colHelp.accessor('average_time_at_intersection', { 
            header: () => (
                renderSnippet(defaultHeaderTitle, 'Tijd op kruising gemiddeld')
            ),
            cell: ({ cell }) => renderSnippet(defaultCell, `${cell.getValue().toFixed(1)}s`)
        }),
        colHelp.accessor('min_time_at_intersection', { 
            header: () => (
                renderSnippet(defaultHeaderTitle, 'min.')
            ),
            cell: ({ cell }) => renderSnippet(defaultCell, `${cell.getValue().toFixed(1)}s`)
        }),
        colHelp.accessor('max_time_at_intersection', { 
            header: () => (
                renderSnippet(defaultHeaderTitle, 'max.')
            ),
            cell: ({ cell }) => renderSnippet(defaultCell, `${cell.getValue().toFixed(1)}s`)
        }),
        colHelp.accessor('median_time_at_intersection', { 
            header: () => (
                renderSnippet(defaultHeaderTitle, 'mediaan')
            ),
            cell: ({ cell }) => renderSnippet(defaultCell, `${cell.getValue().toFixed(1)}s`)
        }),
        colHelp.accessor('percent85_time_at_intersection', { 
            header: () => (
                renderSnippet(defaultHeaderTitle, '85% percentile')
            ),
            cell: ({ cell }) => renderSnippet(defaultCell, `${cell.getValue().toFixed(1)}s`)
        }),
    ];

    let operationDate = $state((new Date()).toJSON().slice(0, 10));
    let roadRegulators = $state([]);
    let selectedRoadRegulator = $state();

    $effect (()=> {
        console.log(operationDate);
        console.log(selectedRoadRegulator);
    });

    let rows: IntersectionLineStat[] = $state([]);
    // Create the table.
    let table = createSvelteTable({
        get data() { 
            return rows; 
        },
        columns: columnDefs,
        getCoreRowModel: getCoreRowModel()
    });

    function getPercentageBarData(ratio: number){
        let color = 'bg-red-600';
        let bg_color = 'bg-red-200';
        if (ratio >= 0.98) {
            color = 'bg-green-800';
            bg_color = 'bg-green-200';
        } else if(ratio >= 0.95) {
            color = 'bg-green-600';
            bg_color = 'bg-green-200';
        } else if (ratio >= 0.90) {
            color = 'bg-yellow-300';
            bg_color = 'bg-yellow-200';
        } else if (ratio >= 0.8) {
            color = 'bg-yellow-400';
            bg_color = 'bg-yellow-200';
        }

        return {
            percentage: `${(ratio * 100.0).toFixed(1)}%`,
            color: color,
            bg_color: bg_color,
        }
    }

    async function loadData(operationDate, roadRegulator, intersectionId) {
        try {
        let response = await fetch(`https://dashboard-api.openprio.nl/intersection_stats_per_line?road_regulator=${roadRegulator}&operation_date=${operationDate}&intersection=${intersectionId}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        let data = await response.json();
        rows = data.map((row: IntersectionLineStat) => {
            row.success_ratio = getPercentageBarData( row.count_ssm_granted / row.journey_total);
            row.openprio_received_ratio = getPercentageBarData( row.count_openprio_received / row.journey_total);
            row.intersectionJourneysLink = {
                data_owner_code: row.data_owner_code,
                line_planning_number: row.line_planning_number,
                direction: row.direction,  
            };


            return row;
        })

        } catch (error) {
            console.log("fout");
            console.error('Failed to fetch data:', error);
        }
    }

    $effect (() => {
        loadData(operation_day, road_regulator_id, intersection_id);
    });
</script>


<Navigation></Navigation>


{#snippet defaultHeaderTitle(content: any)}
    <th class="py-2 pr-8 border-b border-neutral-200 font-medium text-left">{content}</th>
{/snippet}

{#snippet defaultCell(content: any)}
    <td class="text-sm pr-8">{content}</td>
{/snippet}

{#snippet ratioCell(percentage: PercentageBar)}
    <td class="border-t-0 px-6 align-middle border-l-0 border-r-0 text-xs whitespace-nowrap p-4">
        <div class="flex items-center">
        <span class="mr-2">{percentage.percentage}</span>
        <div class="relative w-full">
            <div class="overflow-hidden h-2 text-xs flex rounded {percentage.bg_color}">
            <div style="width: {percentage.percentage}" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center {percentage.color}"></div>
            </div>
        </div>
    </div>
  </td>
{/snippet}


{#snippet intersectionJourneysLink(intersectionJourneyLink: intersectionJourneysLink)}
    <td>
        <Link to={`/intersections/${operation_day}/${road_regulator_id}/${intersection_id}/journeys/${intersectionJourneyLink.data_owner_code}/${intersectionJourneyLink.line_planning_number}/${intersectionJourneyLink.direction}`}
        class="font-medium text-blue-600 dark:text-blue-500 hover:underline">{intersectionJourneyLink.line_planning_number}</Link>
    </td> 
{/snippet}


<div>
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
</div>


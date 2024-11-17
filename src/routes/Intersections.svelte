<script lang="ts">
    import { onMount } from "svelte";
    import Navigation from "../components/Navigation.svelte";
    import { createColumnHelper, createSvelteTable, FlexRender, getCoreRowModel, getSortedRowModel, renderComponent, renderSnippet, type Row, type SortingFn } from '../lib/table';
    import { Link } from "svelte-routing";
    import { getIdToken } from "../auth";
    import type { PercentageBarData } from "../components/PercentageBarData";
    import { getPercentageBarData } from "../components/PercentageBarData";
    import PercentageBar from "../components/PercentageBar.svelte";
    
    type IntersectionLink = {
        road_regulator_id: number,
        intersection_id: number,
        intersection_name: string
    }

    type Intersection = {
        road_regulator_id:     number;
        intersection_id:       number;
        intersection_name:     string;
        tlc_descriptive_name:  string;
        journey_total:            number;
        count_srm_new:         number;
        count_ssm_requested:   number;
        count_ssm_proccessing: number;
        count_ssm_granted:     number;
        count_openprio_received: number;
        intersection_link:     IntersectionLink;
        openprio_received_ratio: PercentageBarData;
        processing_ratio:      PercentageBarData,
        success_ratio:         PercentageBarData;
    };



    // 💡 Create a column helper for the user profile data.
    // It's not necessary, but it helps with typescript stuff.
    const colHelp = createColumnHelper<Intersection>();

    // Define the columns using the column helper.
    // This is a basic example. Check other examples for more complexity.
    const columnDefs = [
        colHelp.accessor('road_regulator_id', { 
            header: () => (
                renderSnippet(defaultHeaderTitle, 'road_regulator_id')
            ),
            cell: ( cell ) => (
                renderSnippet(defaultCell, cell.getValue())
            ) 
        }),
        colHelp.accessor('intersection_id', { 
            header: () => (
                renderSnippet(defaultHeaderTitle, 'intersection_id')
            ),
            cell: ( cell ) => (
                renderSnippet(defaultCell, cell.getValue())
            )
        }),
        colHelp.accessor('intersection_link', { 
            header: () => (
                renderSnippet(defaultHeaderTitle, 'Kruising')
            ),
            cell: ( cell ) => (
                renderSnippet(intersectionLink, cell.getValue())
            )
        }
        ),
        colHelp.accessor('tlc_descriptive_name', { 
            header: () => (
                renderSnippet(defaultHeaderTitle, 'VRI locatie')
            ),
            cell: ({ cell }) => renderSnippet(defaultCell, cell.getValue())
        }),
        colHelp.accessor('journey_total', { 
            header: () => (
                renderSnippet(defaultHeaderTitle, 'Ritten gepasseerd')
            ),
            cell: ({ cell }) => renderSnippet(defaultCell, cell.getValue())
        }),
        colHelp.accessor('openprio_received_ratio', { 
            header: () => (
                renderSnippet(defaultHeaderTitle, 'OpenPrio ontvangen')
            ),
            cell: ({ cell }) => renderComponent(PercentageBar, {content: cell.getValue()}),
        }),
        colHelp.accessor('processing_ratio', { 
            header: () => (
                renderSnippet(defaultHeaderTitle, 'PROCESSING ontvangen')
            ),
            cell: ({ cell }) => renderComponent(PercentageBar, {content: cell.getValue()}),
        }),
        colHelp.accessor('success_ratio', { 
            header: () => (
                renderSnippet(defaultHeaderTitle, 'Aanvraag succesvol')
            ),
            cell: ({ cell }) => renderComponent(PercentageBar, {content: cell.getValue()}),
            sortingFn: (rowA, rowB, columnId) => {
                return rowA.original.success_ratio.ratio - rowB.original.success_ratio.ratio
            },
        })
       
    ];

    let operationDate = $state((new Date()).toJSON().slice(0, 10));
    let roadRegulators = $state([]);
    let selectedRoadRegulator = $state();

    $effect (()=> {
        console.log(operationDate);
        console.log(selectedRoadRegulator);
    });

    let rows: Intersection[] = $state([]);
    // Create the table.
    let table = createSvelteTable({
        get data() { 
            return rows; 
        },
        columns: columnDefs,
        initialState: {
            sorting: [
                {
                    id: 'success_ratio',
                    desc: true, // sort by name in descending order by default
                },
            ],
        },
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

 

    async function loadData(operationDate, selectedRoadRegulator) {
        let token = await getIdToken();
        try {
            let response = await fetch(
                `https://dashboard-api.openprio.nl/intersection_stats?road_regulator=${selectedRoadRegulator}&operation_date=${operationDate}`,
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
            rows = data.map((row: Intersection) => {
                row.intersection_link = {
                    road_regulator_id: row.road_regulator_id,
                    intersection_id: row.intersection_id,
                    intersection_name: row.intersection_name,
                };
                row.openprio_received_ratio = getPercentageBarData( row.count_openprio_received / row.journey_total);
                row.processing_ratio = getPercentageBarData( row.count_ssm_proccessing/ row.journey_total);
                row.success_ratio = getPercentageBarData( row.count_ssm_granted / row.journey_total);

                return row;
            })

        } catch (error) {
            console.log("fout");
            console.error('Failed to fetch data:', error);
        }
    }

    $effect (() => {
        loadData(operationDate, selectedRoadRegulator);
    });

    onMount(async () => {
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
            console.log("fout");
            console.error('Failed to fetch data:', error);
        }
    });
</script>

{#snippet defaultHeaderTitle(content: any)}
    <th class="py-2 pr-8 border-b border-neutral-200 font-medium text-left">{content}</th>
{/snippet}

{#snippet defaultCell(content: any)}
    <td class="text-sm pr-8">{content}</td>
{/snippet}



{#snippet intersectionLink(intersectionLink: IntersectionLink)}
    <td>
        <Link to={`/intersections/${operationDate}/${intersectionLink.road_regulator_id}/${intersectionLink.intersection_id}`}
        class="font-medium text-blue-600 dark:text-blue-500 hover:underline">{intersectionLink.intersection_name}</Link>
    </td> 
{/snippet}

<Navigation></Navigation>

<div class="flex flex-row">
    <div class="flex-col mx-4 my-2">
        <label for="operation_day" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Operation day</label>
        <input id="operation_day" type="date" value={operationDate} oninput={e => operationDate = e.target.value|| operationDate} />
    </div>

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


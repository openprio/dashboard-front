<script lang="ts">
  import { onMount } from "svelte";
  import Navigation from "../components/Navigation.svelte";
  import {
    createColumnHelper,
    createSvelteTable,
    FlexRender,
    getCoreRowModel,
    getSortedRowModel,
    renderComponent,
    renderSnippet,
    type Row,
    type SortingFn,
  } from "../lib/table";
  import { Link } from "svelte-routing";
  import { getIdToken } from "../auth";
  import type { PercentageBarData } from "../components/PercentageBarData";
  import { getPercentageBarData } from "../components/PercentageBarData";
  import PercentageBar from "../components/PercentageBar.svelte";
  import { extract_timestamp } from "../util/time_util";

  let { dated_journey_id } = $props();

  type IntersectionPass = {
    tlc_id: string;
    road_regulator_id: number;
    intersection_id: number;
    dated_journey_id: number;
    point_on_route: PointOnRoute;
    route_distance_traveled: number;
    closest_distance_to_intersection: number;
    first_openprio_message: string;
    last_openprio_message: string;
    first_srm_new: any;
    first_srm_updated: any;
    first_srm_cancellation: any;
    first_ssm_requested: any;
    first_ssm_processing: any;
    first_ssm_granted: any;
    first_ssm_rejected: any;
    other_ssm_events_sent: boolean;
    first_door_open: string;
    last_door_open: string;
    intersection_name: string;
    intersection_descriptive_name: string;
    location: Location;
    use_cases: string[];
    tlc_name: string;
    tlc_descriptive_name: string;
    alias: string;
  };

  type PointOnRoute = {
    type: string;
    coordinates: number[];
  };

  type Location = {
    type: string;
    crs: Crs;
    coordinates: number[];
  };

  type Crs = {
    type: string;
    properties: Properties;
  };

  type Properties = {
    name: string;
  };

  // 💡 Create a column helper for the user profile data.
  // It's not necessary, but it helps with typescript stuff.
  const colHelp = createColumnHelper<IntersectionPass>();

  // Define the columns using the column helper.
  // This is a basic example. Check other examples for more complexity.
  const columnDefs = [
    colHelp.accessor("road_regulator_id", {
      header: () => renderSnippet(defaultHeaderTitle, "road_regulator_id"),
      cell: (cell) => renderSnippet(defaultCell, cell.getValue()),
    }),
    colHelp.accessor("intersection_id", {
      header: () => renderSnippet(defaultHeaderTitle, "intersection_id"),
      cell: (cell) => renderSnippet(defaultCell, cell.getValue()),
    }),
    colHelp.accessor("intersection_name", {
      header: () => renderSnippet(defaultHeaderTitle, "Kruising"),
      cell: (cell) => renderSnippet(defaultCell, `${cell.getValue()}`),
    }),
    colHelp.accessor("tlc_descriptive_name", {
      header: () => renderSnippet(defaultHeaderTitle, "VRI locatie"),
      cell: (cell) => renderSnippet(defaultCell, `${cell.getValue()}`),
    }),
    colHelp.accessor("route_distance_traveled", {
      header: () => renderSnippet(defaultHeaderTitle, "Afstand vanaf begin"),
      cell: (cell) => renderSnippet(defaultCell, `${cell.getValue()}m`),
    }),
    colHelp.accessor("first_openprio_message", {
      header: () => renderSnippet(defaultHeaderTitle, "Eerste OpenPrio <150m"),
      cell: (cell) =>
        renderSnippet(errorIfEmptyCell, extract_timestamp(cell.getValue())),
    }),
    colHelp.accessor("first_srm_new", {
      header: () => renderSnippet(defaultHeaderTitle, "Eerste SRM new"),
      cell: (cell) =>
        renderSnippet(errorIfEmptyCell, extract_timestamp(cell.getValue())),
    }),
    colHelp.accessor("first_ssm_requested", {
      header: () => renderSnippet(defaultHeaderTitle, "SSM requested"),
      cell: (cell) =>
        renderSnippet(errorIfEmptyCell, extract_timestamp(cell.getValue())),
    }),
    colHelp.accessor("first_ssm_processing", {
      header: () => renderSnippet(defaultHeaderTitle, "SSM processing"),
      cell: (cell) =>
        renderSnippet(errorIfEmptyCell, extract_timestamp(cell.getValue())),
    }),
    colHelp.accessor("first_ssm_granted", {
      header: () => renderSnippet(defaultHeaderTitle, "SSM granted"),
      cell: (cell) =>
        renderSnippet(errorIfEmptyCell, extract_timestamp(cell.getValue())),
    }),
    colHelp.accessor("first_srm_cancellation", {
      header: () => renderSnippet(defaultHeaderTitle, "SRM cancellation"),
      cell: (cell) =>
        renderSnippet(errorIfEmptyCell, extract_timestamp(cell.getValue())),
    }),
    colHelp.accessor("last_openprio_message", {
      header: () => renderSnippet(defaultHeaderTitle, "Laatste OpenPrio"),
      cell: (cell) =>
        renderSnippet(errorIfEmptyCell, extract_timestamp(cell.getValue())),
    }),
  ];

  let rows: IntersectionPass[] = $state([]);
  let table = createSvelteTable({
    get data() {
      return rows;
    },
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
  });

  async function loadData(datedJourneyID) {
    let token = await getIdToken();
    try {
      let response = await fetch(
        `https://dashboard-api.openprio.nl/journey?dated_journey_id=${datedJourneyID}`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      let data = await response.json();
      rows = data.map((row: IntersectionPass) => {
        // row.openprio_received_ratio = getPercentageBarData( row.count_openprio_received / row.count_intersections);
        // row.processing_ratio = getPercentageBarData( row.count_ssm_proccessing/ row.count_intersections);
        // row.success_ratio = getPercentageBarData( row.count_ssm_granted / row.count_intersections);

        return row;
      });
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }

  $effect(() => {
    loadData(dated_journey_id);
  });
</script>

{#snippet defaultHeaderTitle(content: any)}
  <th class="border-b border-neutral-200 py-2 pr-8 text-left font-medium"
    >{content}</th
  >
{/snippet}

{#snippet defaultCell(content: any)}
  <td class="pr-8 text-sm">{content}</td>
{/snippet}

{#snippet errorIfEmptyCell(content: any)}
  <td
    class="pb-4 pr-8 pt-4 text-sm {content == '' || content == null
      ? 'bg-red-400'
      : ''} ">{content}</td
  >
{/snippet}

<Navigation></Navigation>

<div>
  <table class="m-4 table-auto">
    <thead class="thead-light">
      <tr>
        {#each table.getHeaderGroups() as headerGroup}
          {#each headerGroup.headers as header}
            <FlexRender
              content={header.column.columnDef.header}
              context={header.getContext()}
            />
          {/each}
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each table.getRowModel().rows as row}
        <tr>
          {#each row.getVisibleCells() as cell}
            <FlexRender
              content={cell.column.columnDef.cell}
              context={cell.getContext()}
            />
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

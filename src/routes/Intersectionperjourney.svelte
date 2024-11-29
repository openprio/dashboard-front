<script lang="ts">
  import { onMount } from "svelte";
  import Navigation from "../components/Navigation.svelte";
  import {
    createColumnHelper,
    createSvelteTable,
    FlexRender,
    getCoreRowModel,
    renderSnippet,
  } from "../lib/table";
  import { getIdToken } from "../auth";
  import { extract_timestamp } from "../util/time_util";
  import { Link } from "svelte-routing";

  type DatedJourneyLink = {
    dated_journey_id: number;
    journey_number: string;
  };

  type IntersectionPass = {
    journey: DatedJourneyLink;
    dated_journey_id: number;
    data_owner_code: string;
    journey_number: string;
    line_planning_number: string;
    line_public_code: string;
    operation_date: string;
    journey_id: string;
    route_id: string;
    line_id: string;
    direction: string;
    vehicle_number: number;
    block_code: number;
    init_time: string;
    target_departure_time_first_stop: string;
    target_arrival_final_stop: string;
    road_regulator_id: number;
    intersection_id: number;
    route_distance_traveled: number;
    closest_distance_to_intersection: number;
    first_openprio_message: string;
    last_openprio_message: string;
    first_srm_new: string;
    first_srm_updated: string;
    first_srm_cancellation: string;
    first_ssm_requested: string;
    first_ssm_processing: string;
    first_ssm_granted: string;
    first_ssm_rejected: string;
    other_ssm_events_sent: boolean;
    first_door_open: string;
    last_door_open: string;
  };

  let {
    road_regulator_id,
    intersection_id,
    operation_day,
    data_owner_code,
    line_planning_number,
    direction,
  } = $props();

  // 💡 Create a column helper for the user profile data.
  // It's not necessary, but it helps with typescript stuff.
  const colHelp = createColumnHelper<IntersectionPass>();

  // Define the columns using the column helper.
  // This is a basic example. Check other examples for more complexity.
  const columnDefs = [
    colHelp.accessor("journey", {
      header: () => renderSnippet(defaultHeaderTitle, "JourneyNumber"),
      cell: (cell) => renderSnippet(journeyLink, cell.getValue()),
    }),
    colHelp.accessor("route_id", {
      header: () => renderSnippet(defaultHeaderTitle, "RouteID"),
      cell: (cell) => renderSnippet(defaultCell, cell.getValue()),
    }),
    colHelp.accessor("vehicle_number", {
      header: () => renderSnippet(defaultHeaderTitle, "Grootwagennummer"),
      cell: (cell) => renderSnippet(defaultCell, cell.getValue()),
    }),
    colHelp.accessor("block_code", {
      header: () => renderSnippet(defaultHeaderTitle, "Omloop"),
      cell: (cell) => renderSnippet(defaultCell, cell.getValue()),
    }),
    colHelp.accessor("init_time", {
      header: () => renderSnippet(defaultHeaderTitle, "Initialisatie"),
      cell: (cell) =>
        renderSnippet(errorIfEmptyCell, extract_timestamp(cell.getValue())),
    }),
    colHelp.accessor("target_departure_time_first_stop", {
      header: () => renderSnippet(defaultHeaderTitle, "Geplande start"),
      cell: (cell) =>
        renderSnippet(defaultCell, extract_timestamp(cell.getValue())),
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

  let operationDate = $state(new Date().toJSON().slice(0, 10));
  let roadRegulators = $state([]);
  let selectedRoadRegulator = $state();

  let rows: IntersectionPass[] = $state([]);
  // Create the table.
  let table = createSvelteTable({
    get data() {
      return rows;
    },
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
  });

  async function loadData(operationDate, roadRegulator, intersectionId) {
    let token = await getIdToken();
    try {
      let response = await fetch(
        `https://dashboard-api.openprio.nl/intersection_stats_per_journey?road_regulator=${roadRegulator}&operation_date=${operationDate}&intersection=${intersectionId}&line_planning_number=${line_planning_number}&direction=${direction}`,
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
        // row.success_ratio = getPercentageBarData( row.count_ssm_granted / row.journey_total);
        // row.openprio_received_ratio = getPercentageBarData( row.count_openprio_received / row.journey_total);
        row.journey = {
          dated_journey_id: row.dated_journey_id,
          journey_number: row.journey_number,
        };

        return row;
      });
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }

  $effect(() => {
    loadData(operation_day, road_regulator_id, intersection_id);
  });
</script>

{#snippet defaultHeaderTitle(content: any)}
  <th class="border-b border-neutral-200 py-2 pr-8 text-left font-medium"
    >{content}</th
  >
{/snippet}

{#snippet defaultCell(content: any)}
  <td class="pb-4 pr-8 pt-4 text-sm">{content}</td>
{/snippet}

{#snippet errorIfEmptyCell(content: any)}
  <td
    class="pb-4 pr-8 pt-4 text-sm {content == '' || content == null
      ? 'bg-red-400'
      : ''} ">{content}</td
  >
{/snippet}

{#snippet journeyLink(datedJourneyLink: DatedJourneyLink)}
  <td>
    <Link
      to={`/journeys/${datedJourneyLink.dated_journey_id}`}
      class="font-medium text-blue-600 hover:underline dark:text-blue-500"
      >{datedJourneyLink.journey_number}</Link
    >
  </td>
{/snippet}

<div class="flex h-screen flex-col">
  <header class="pb-8">
    <Navigation></Navigation>
  </header>
  <main class="flex-1 overflow-y-auto pt-4">
    <div>
      <table class="mx-4 table-auto">
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
  </main>
</div>

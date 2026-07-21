<script lang="ts">
  import Navigation from "../components/Navigation.svelte";
  import {
    createColumnHelper,
    createSvelteTable,
    FlexRender,
    getCoreRowModel,
    renderSnippet,
  } from "../lib/table";
  import { Link } from "svelte-routing";
  import { getIdToken } from "../auth";
  import { extract_timestamp } from "../util/time_util";
  import { getRawDataLink, type RawDataLink } from "../components/RawDataLink";

  let { data_owner_code, vehicle_number, operation_date } = $props();

  type PointOnRoute = {
    type: string;
    coordinates: number[];
  };

  type VehicleIntersectionPass = {
    dated_journey_id: number;
    road_regulator_id: number;
    intersection_id: number;
    point_on_route: PointOnRoute;
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
    intersection_name: string;
    tlc_descriptive_name: string;
    line_planning_number: string;
    journey_number: string;
    direction: string;
    target_departure_time_first_stop: string;
    target_arrival_final_stop: string;
    time_at_intersection: number;
    first_openprio_message_raw_data_link: RawDataLink;
    last_openprio_message_raw_data_link: RawDataLink;
  };

  const colHelp = createColumnHelper<VehicleIntersectionPass>();

  const columnDefs = [
    colHelp.accessor("dated_journey_id", {
      header: () => renderSnippet(defaultHeaderTitle, "Journey"),
      cell: (cell) => renderSnippet(journeyLink, cell.getValue()),
    }),
    colHelp.accessor("intersection_name", {
      header: () => renderSnippet(defaultHeaderTitle, "Kruising"),
      cell: (cell) => renderSnippet(defaultCell, `${cell.getValue()}`),
    }),
    colHelp.accessor("tlc_descriptive_name", {
      header: () => renderSnippet(defaultHeaderTitle, "VRI locatie"),
      cell: (cell) => renderSnippet(defaultCell, `${cell.getValue()}`),
    }),
    colHelp.accessor("line_planning_number", {
      header: () => renderSnippet(defaultHeaderTitle, "Lijn"),
      cell: (cell) => renderSnippet(defaultCell, cell.getValue()),
    }),
    colHelp.accessor("journey_number", {
      header: () => renderSnippet(defaultHeaderTitle, "Journey nummer"),
      cell: (cell) => renderSnippet(defaultCell, cell.getValue()),
    }),
    colHelp.accessor("direction", {
      header: () => renderSnippet(defaultHeaderTitle, "Richting"),
      cell: (cell) => renderSnippet(defaultCell, cell.getValue()),
    }),
    colHelp.accessor("route_distance_traveled", {
      header: () => renderSnippet(defaultHeaderTitle, "Afstand vanaf begin"),
      cell: (cell) => renderSnippet(defaultCell, `${cell.getValue()}m`),
    }),
    colHelp.accessor("first_openprio_message_raw_data_link", {
      header: () => renderSnippet(defaultHeaderTitle, "Eerste OpenPrio <150m"),
      cell: (cell) => renderSnippet(rawDataLinkCell, cell.getValue()),
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
    colHelp.accessor("last_openprio_message_raw_data_link", {
      header: () => renderSnippet(defaultHeaderTitle, "Laatste OpenPrio"),
      cell: (cell) => renderSnippet(rawDataLinkCell, cell.getValue()),
    }),
    colHelp.accessor("time_at_intersection", {
      header: () => renderSnippet(defaultHeaderTitle, "Tijd op kruising"),
      cell: (cell) => renderSnippet(defaultCell, `${cell.getValue()}s`),
    }),
  ];

  let rows: VehicleIntersectionPass[] = $state([]);
  let table = createSvelteTable({
    get data() {
      return rows;
    },
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
  });

  async function loadData(data_owner_code, vehicle_number, operation_date) {
    let token = await getIdToken();
    try {
      let response = await fetch(
        `https://dashboard-api.openprio.nl/vehicle_intersection_passes?data_owner_code=${data_owner_code}&vehicle_number=${vehicle_number}&operation_date=${operation_date}`,
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
      rows = data.map((row: VehicleIntersectionPass) => {
        row.first_openprio_message_raw_data_link = getRawDataLink(
          data_owner_code,
          vehicle_number.toString(),
          row.first_openprio_message,
        );
        row.last_openprio_message_raw_data_link = getRawDataLink(
          data_owner_code,
          vehicle_number.toString(),
          row.last_openprio_message,
        );
        return row;
      });
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }

  $effect(() => {
    loadData(data_owner_code, vehicle_number, operation_date);
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

{#snippet journeyLink(dated_journey_id: number)}
  <td>
    <Link
      to={`/journeys/${dated_journey_id}`}
      class="font-medium text-blue-600 hover:underline dark:text-blue-500"
      >{dated_journey_id}</Link
    >
  </td>
{/snippet}

{#snippet rawDataLinkCell(content: RawDataLink)}
  {#if content}
    <td class="pr-8 text-sm">
      <Link
        to={content.content}
        class="font-medium text-blue-600 hover:underline dark:text-blue-500"
        >{content.linkText}</Link
      >
    </td>
  {:else}
    <td class="bg-red-400 pb-4 pr-8 pt-4 text-sm"> </td>
  {/if}
{/snippet}

<div class="flex h-screen flex-col">
  <header class="pb-8">
    <Navigation></Navigation>
  </header>
  <main class="flex-1 overflow-y-auto pt-4">
    <div class="mx-4 mb-4">
      <h1 class="text-xl font-bold">
        Voertuig {vehicle_number} - {data_owner_code} - {operation_date}
      </h1>
    </div>
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
  </main>
</div>

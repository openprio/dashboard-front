<script lang="ts">
  import { onMount } from "svelte";
  import Navigation from "../components/Navigation.svelte";
  import {
    createColumnHelper,
    createSvelteTable,
    FlexRender,
    getCoreRowModel,
    renderComponent,
    renderSnippet,
  } from "../lib/table";
  import { Link } from "svelte-routing";
  import Intersectionperjourney from "./Intersectionperjourney.svelte";
  import { getIdToken } from "../auth";
  import {
    getPercentageBarData,
    type PercentageBarData,
  } from "../components/PercentageBarData";
  import PercentageBar from "../components/PercentageBar.svelte";

  type intersectionJourneysLink = {
    data_owner_code: string;
    line_planning_number: string;
    direction: string;
  };

  type IntersectionLineStat = {
    data_owner_code: string;
    line_planning_number: string;
    direction: string;
    journey_total: number;
    count_srm_new: number;
    count_ssm_requested: number;
    count_ssm_proccessing: number;
    count_ssm_granted: number;
    count_openprio_received: number;
    average_time_at_intersection: number;
    max_time_at_intersection: number;
    min_time_at_intersection: number;
    median_time_at_intersection: number;
    percent85_time_at_intersection: number;
    openprio_received_ratio: PercentageBarData;
    requested_ratio: PercentageBarData;
    processing_ratio: PercentageBarData;
    success_ratio: PercentageBarData;
    intersectionJourneysLink: intersectionJourneysLink;
  };

  let { road_regulator_id, intersection_id, operation_day } = $props();

  // 💡 Create a column helper for the user profile data.
  // It's not necessary, but it helps with typescript stuff.
  const colHelp = createColumnHelper<IntersectionLineStat>();

  // Define the columns using the column helper.
  // This is a basic example. Check other examples for more complexity.
  const columnDefs = [
    colHelp.accessor("data_owner_code", {
      header: () => renderSnippet(defaultHeaderTitle, "Data owner"),
      cell: (cell) => renderSnippet(defaultCell, cell.getValue()),
    }),
    colHelp.accessor("intersectionJourneysLink", {
      header: () => renderSnippet(defaultHeaderTitle, "Line planning number"),
      cell: (cell) => renderSnippet(intersectionJourneysLink, cell.getValue()),
    }),
    colHelp.accessor("direction", {
      header: () => renderSnippet(defaultHeaderTitle, "Richting"),
      cell: (cell) => renderSnippet(defaultCell, cell.getValue()),
    }),
    colHelp.accessor("journey_total", {
      header: () => renderSnippet(defaultHeaderTitle, "Ritten gepasseerd"),
      cell: ({ cell }) => renderSnippet(defaultCell, cell.getValue()),
    }),
    colHelp.accessor("openprio_received_ratio", {
      header: () => renderSnippet(defaultHeaderTitle, "OpenPrio ontvangen"),
      cell: ({ cell }) =>
        renderComponent(PercentageBar, { content: cell.getValue() }),
    }),
    colHelp.accessor("requested_ratio", {
      header: () => renderSnippet(defaultHeaderTitle, "REQUESTED ontvangen"),
      cell: ({ cell }) =>
        renderComponent(PercentageBar, { content: cell.getValue() }),
    }),
    colHelp.accessor("processing_ratio", {
      header: () => renderSnippet(defaultHeaderTitle, "PROCESSING ontvangen"),
      cell: ({ cell }) =>
        renderComponent(PercentageBar, { content: cell.getValue() }),
    }),
    colHelp.accessor("success_ratio", {
      header: () => renderSnippet(defaultHeaderTitle, "Succesvolle aanvragen"),
      cell: ({ cell }) =>
        renderComponent(PercentageBar, { content: cell.getValue() }),
    }),
    colHelp.accessor("average_time_at_intersection", {
      header: () =>
        renderSnippet(defaultHeaderTitle, "Tijd op kruising gemiddeld"),
      cell: ({ cell }) =>
        renderSnippet(defaultCell, `${cell.getValue().toFixed(1)}s`),
    }),
    colHelp.accessor("min_time_at_intersection", {
      header: () => renderSnippet(defaultHeaderTitle, "min."),
      cell: ({ cell }) =>
        renderSnippet(defaultCell, `${cell.getValue().toFixed(1)}s`),
    }),
    colHelp.accessor("max_time_at_intersection", {
      header: () => renderSnippet(defaultHeaderTitle, "max."),
      cell: ({ cell }) =>
        renderSnippet(defaultCell, `${cell.getValue().toFixed(1)}s`),
    }),
    colHelp.accessor("median_time_at_intersection", {
      header: () => renderSnippet(defaultHeaderTitle, "mediaan"),
      cell: ({ cell }) =>
        renderSnippet(defaultCell, `${cell.getValue().toFixed(1)}s`),
    }),
    colHelp.accessor("percent85_time_at_intersection", {
      header: () => renderSnippet(defaultHeaderTitle, "85% percentile"),
      cell: ({ cell }) =>
        renderSnippet(defaultCell, `${cell.getValue().toFixed(1)}s`),
    }),
  ];

  let operationDate = $state(new Date().toJSON().slice(0, 10));
  let roadRegulators = $state([]);
  let selectedRoadRegulator = $state();

  let rows: IntersectionLineStat[] = $state([]);
  // Create the table.
  let table = createSvelteTable({
    get data() {
      return rows;
    },
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
  });

  async function loadData(operationDate, roadRegulator, intersectionId) {
    try {
      let token = await getIdToken();
      let response = await fetch(
        `https://dashboard-api.openprio.nl/intersection_stats_per_line?road_regulator=${roadRegulator}&operation_date=${operationDate}&intersection=${intersectionId}`,
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
      rows = data.map((row: IntersectionLineStat) => {
        row.openprio_received_ratio = getPercentageBarData(
          row.count_openprio_received / row.journey_total,
        );
        row.requested_ratio = getPercentageBarData(
          row.count_ssm_proccessing / row.journey_total,
        );
        row.processing_ratio = getPercentageBarData(
          row.count_ssm_proccessing / row.journey_total,
        );

        row.success_ratio = getPercentageBarData(
          row.count_ssm_granted / row.journey_total,
        );
        row.intersectionJourneysLink = {
          data_owner_code: row.data_owner_code,
          line_planning_number: row.line_planning_number,
          direction: row.direction,
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

<Navigation></Navigation>

{#snippet defaultHeaderTitle(content: any)}
  <th class="border-b border-neutral-200 py-2 pr-8 text-left font-medium"
    >{content}</th
  >
{/snippet}

{#snippet defaultCell(content: any)}
  <td class="pr-8 text-sm">{content}</td>
{/snippet}

{#snippet intersectionJourneysLink(
  intersectionJourneyLink: intersectionJourneysLink,
)}
  <td>
    <Link
      to={`/intersections/${operation_day}/${road_regulator_id}/${intersection_id}/journeys/${intersectionJourneyLink.data_owner_code}/${intersectionJourneyLink.line_planning_number}/${intersectionJourneyLink.direction}`}
      class="font-medium text-blue-600 hover:underline dark:text-blue-500"
      >{intersectionJourneyLink.line_planning_number}</Link
    >
  </td>
{/snippet}

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

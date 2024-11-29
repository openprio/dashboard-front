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
  import OperatingHoursToggle from "../components/OperatingHoursToggle.svelte";

  import filterOperatingSub from "../components/OperatingHoursStore";

  let filterOperatingHours = $state(false);

  filterOperatingSub.sub((value) => {
    filterOperatingHours = value.valueOf();
  });

  type IntersectionLink = {
    road_regulator_id: number;
    intersection_id: number;
    intersection_name: string;
  };

  type Intersection = {
    road_regulator_id: number;
    intersection_id: number;
    intersection_name: string;
    tlc_descriptive_name: string;
    journey_total: number;
    count_srm_sent: number;
    count_ssm_requested: number;
    count_ssm_proccessing: number;
    count_ssm_granted: number;
    count_openprio_received: number;
    intersection_link: IntersectionLink;
    openprio_received_ratio: PercentageBarData;
    srm_sent_ratio: PercentageBarData;
    processing_ratio: PercentageBarData;
    success_ratio: PercentageBarData;
  };

  // 💡 Create a column helper for the user profile data.
  // It's not necessary, but it helps with typescript stuff.
  const colHelp = createColumnHelper<Intersection>();

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
    colHelp.accessor("intersection_link", {
      header: () => renderSnippet(defaultHeaderTitle, "Kruising"),
      cell: (cell) => renderSnippet(intersectionLink, cell.getValue()),
    }),
    colHelp.accessor("tlc_descriptive_name", {
      header: () => renderSnippet(defaultHeaderTitle, "VRI locatie"),
      cell: ({ cell }) => renderSnippet(defaultCell, cell.getValue()),
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
    colHelp.accessor("srm_sent_ratio", {
      header: () => renderSnippet(defaultHeaderTitle, "SRM ontvangen"),
      cell: ({ cell }) =>
        renderComponent(PercentageBar, { content: cell.getValue() }),
    }),
    colHelp.accessor("processing_ratio", {
      header: () => renderSnippet(defaultHeaderTitle, "PROCESSING ontvangen"),
      cell: ({ cell }) =>
        renderComponent(PercentageBar, { content: cell.getValue() }),
    }),
    colHelp.accessor("success_ratio", {
      header: () => renderSnippet(defaultHeaderTitle, "GRANTED ontvangen"),
      cell: ({ cell }) =>
        renderComponent(PercentageBar, { content: cell.getValue() }),
      sortingFn: (rowA, rowB, columnId) => {
        return (
          rowA.original.success_ratio.ratio - rowB.original.success_ratio.ratio
        );
      },
    }),
  ];

  let operationDate = $state(new Date().toJSON().slice(0, 10));

  let roadRegulators = $state([]);
  // Default on Delft
  let selectedRoadRegulator = $state(31075);

  function loadQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const hasRoadRegulator = urlParams.has("road_regulator");
    const hasOperationDate = urlParams.has("operation_date");

    if (hasOperationDate) {
      operationDate = new Date(Date.parse(urlParams.get("operation_date")))
        .toJSON()
        .slice(0, 10);
    }

    if (hasRoadRegulator) {
      selectedRoadRegulator = parseInt(urlParams.get("road_regulator"));
    }
  }
  loadQueryParams();

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
          id: "success_ratio",
          desc: true, // sort by name in descending order by default
        },
      ],
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  async function loadData(
    operationDate,
    selectedRoadRegulator,
    filterOperatingHours,
  ) {
    let token = await getIdToken();
    try {
      let response = await fetch(
        `https://dashboard-api.openprio.nl/intersection_stats?road_regulator=${selectedRoadRegulator}&operation_date=${operationDate}&filter_operating_hours=${filterOperatingHours}`,
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
      rows = data.map((row: Intersection) => {
        row.intersection_link = {
          road_regulator_id: row.road_regulator_id,
          intersection_id: row.intersection_id,
          intersection_name: row.intersection_name,
        };
        row.openprio_received_ratio = getPercentageBarData(
          row.count_openprio_received / row.journey_total,
        );
        row.srm_sent_ratio = getPercentageBarData(
          row.count_srm_sent / row.journey_total,
        );
        row.processing_ratio = getPercentageBarData(
          row.count_ssm_proccessing / row.journey_total,
        );
        row.success_ratio = getPercentageBarData(
          row.count_ssm_granted / row.journey_total,
        );

        return row;
      });
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }

  function updateQueryParams(operationDate, selectedRoadRegulator) {
    const currentUrl = new URL(window.location.href);
    const updatedUrl = new URL(currentUrl);

    // Update the query parameters
    updatedUrl.searchParams.set("road_regulator", selectedRoadRegulator);
    updatedUrl.searchParams.set("operation_date", operationDate);

    if (currentUrl.href !== updatedUrl.href) {
      history.pushState(null, "", updatedUrl);
    }
  }

  let timeoutId;
  $effect(() => {
    loadData(operationDate, selectedRoadRegulator, filterOperatingHours);

    // delay updating URL with 500ms
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      updateQueryParams(operationDate, selectedRoadRegulator);
    }, 500);
  });

  window.addEventListener("popstate", () => {
    loadQueryParams();
  });

  onMount(async () => {
    let token = await getIdToken();
    try {
      let response = await fetch(
        "https://dashboard-api.openprio.nl/road_regulators",
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
      roadRegulators = data;
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  });
</script>

{#snippet defaultHeaderTitle(content: any)}
  {#if content == "OpenPrio ontvangen"}
    <th class="border-b border-neutral-200 py-2 pr-8 text-left font-medium">
      <div class="flex items-center justify-center space-x-2">
        <div class="h-[2px] flex-1 bg-red-800"></div>
        <div class="h-4 w-4 shrink-0 rounded-full bg-red-800"></div>
        <div class="h-[2px] flex-1 bg-red-800"></div>
        {content}
      </div></th
    >
  {:else if content == "SRM ontvangen"}
    <th class="border-b border-neutral-200 py-2 pr-8 text-left font-medium">
      <div class="flex items-center justify-center space-x-2">
        <div class="h-[2px] flex-1 bg-yellow-500"></div>
        <div class="h-4 w-4 shrink-0 rounded-full bg-yellow-500"></div>
        <div class="h-[2px] flex-1 bg-yellow-500"></div>
        {content}
      </div></th
    >
  {:else if content == "PROCESSING ontvangen"}
    <th class="border-b border-neutral-200 py-2 pr-8 text-left font-medium">
      <div class="flex items-center justify-center space-x-2">
        <div class="h-[2px] flex-1 bg-blue-100"></div>
        <div class="h-4 w-4 shrink-0 rounded-full bg-blue-100"></div>
        <div class="h-[2px] flex-1 bg-blue-100"></div>
        {content}
      </div></th
    >
  {:else if content == "GRANTED ontvangen"}
    <th class="border-b border-neutral-200 py-2 pr-8 text-left font-medium">
      <div class="flex items-center justify-center space-x-2">
        <div class="h-[2px] flex-1 bg-green-600"></div>
        <div class="h-4 w-4 shrink-0 rounded-full bg-green-600"></div>
        <div class="h-[2px] flex-1 bg-green-600"></div>
        {content}
      </div></th
    >
  {:else}
    <th class="border-b border-neutral-200 py-2 pr-8 text-left font-medium"
      >{content}</th
    >
  {/if}
{/snippet}

{#snippet defaultCell(content: any)}
  <td class="pr-8 text-sm">{content}</td>
{/snippet}

{#snippet intersectionLink(intersectionLink: IntersectionLink)}
  <td>
    <Link
      to={`/intersections/${operationDate}/${intersectionLink.road_regulator_id}/${intersectionLink.intersection_id}`}
      class="font-medium text-blue-600 hover:underline dark:text-blue-500"
      >{intersectionLink.intersection_name}</Link
    >
  </td>
{/snippet}

<div class="flex h-screen flex-col">
  <header class="pb-8">
    <Navigation></Navigation>
  </header>
  <main class="flex-1 overflow-y-auto pt-4">
    <div class="flex flex-row">
      <div class="mx-4 my-2 flex-col">
        <label
          for="operation_day"
          class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
          >Operation day</label
        >
        <input
          id="operation_day"
          type="date"
          value={operationDate}
          oninput={(e) => (operationDate = e.target.value || operationDate)}
        />
      </div>

      <div class="mx-4 my-2 flex-col">
        <label
          for="road_regulator"
          class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
          >Wegbeheerder</label
        >
        <select
          id="road_regulator"
          bind:value={selectedRoadRegulator}
          class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
        >
          {#each roadRegulators as roadRegulator}
            <option value={roadRegulator.road_regulator_id}>
              {roadRegulator.road_regulator_name}
            </option>
          {/each}
        </select>
      </div>
      <div class="mx-4 my-2 flex-col">
        <OperatingHoursToggle></OperatingHoursToggle>
      </div>
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

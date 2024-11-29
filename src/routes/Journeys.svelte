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
  import { extract_timestamp } from "../util/time_util";
  import { getRawDataLink, type RawDataLink } from "../components/RawDataLink";

  let filterOperatingHours = $state(false);

  filterOperatingSub.sub((value) => {
    filterOperatingHours = value.valueOf();
  });

  let filter = $state(false);

  filterOperatingSub.sub((value) => {
    filter = value.valueOf();
  });

  type JourneyOverview = {
    dated_journey_id: number;
    data_owner_code: string;
    line_planning_number: string;
    direction: string;
    vehicle_number: string;
    block_code: string;
    target_departure_time_first_stop: string;
    target_arrival_final_stop: string;
    init_time: string;
    init_time_raw_data_link: RawDataLink;
    count_intersections: number;
    count_srm_sent: number;
    count_ssm_requested: number;
    count_ssm_proccessing: number;
    count_ssm_granted: number;
    count_openprio_received: number;
    openprio_received_ratio: PercentageBarData;
    srm_sent_ratio: PercentageBarData;
    processing_ratio: PercentageBarData;
    success_ratio: PercentageBarData;
  };

  // 💡 Create a column helper for the user profile data.
  // It's not necessary, but it helps with typescript stuff.
  const colHelp = createColumnHelper<JourneyOverview>();

  // Define the columns using the column helper.
  // This is a basic example. Check other examples for more complexity.
  const columnDefs = [
    colHelp.accessor("dated_journey_id", {
      header: () => renderSnippet(defaultHeaderTitle, "dated_journey_id"),
      cell: (cell) => renderSnippet(journeyLink, cell.getValue()),
    }),
    colHelp.accessor("vehicle_number", {
      header: () => renderSnippet(defaultHeaderTitle, "Grootwagennummer"),
      cell: (cell) => renderSnippet(defaultCell, cell.getValue()),
    }),
    colHelp.accessor("target_departure_time_first_stop", {
      header: () => renderSnippet(defaultHeaderTitle, "Gepland start"),
      cell: (cell) =>
        renderSnippet(defaultCell, extract_timestamp(cell.getValue())),
    }),
    colHelp.accessor("init_time_raw_data_link", {
      header: () => renderSnippet(defaultHeaderTitle, "Initialisatie rit"),
      cell: (cell) => renderSnippet(rawDataLinkCell, cell.getValue()),
    }),

    colHelp.accessor("target_arrival_final_stop", {
      header: () => renderSnippet(defaultHeaderTitle, "Gepland einde"),
      cell: (cell) =>
        renderSnippet(defaultCell, extract_timestamp(cell.getValue())),
    }),
    colHelp.accessor("direction", {
      header: () => renderSnippet(defaultHeaderTitle, "Richting"),
      cell: ({ cell }) => renderSnippet(defaultCell, cell.getValue()),
    }),
    colHelp.accessor("vehicle_number", {
      header: () => renderSnippet(defaultHeaderTitle, "Grootwagennummer"),
      cell: (cell) => renderSnippet(defaultCell, cell.getValue()),
    }),
    colHelp.accessor("block_code", {
      header: () => renderSnippet(defaultHeaderTitle, "Omloop"),
      cell: (cell) => renderSnippet(defaultCell, cell.getValue()),
    }),
    colHelp.accessor("count_intersections", {
      header: () => renderSnippet(defaultHeaderTitle, "Aantal kruisingen"),
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
  let dataOwners = $state([
    {
      dataOwnerCode: "HTM",
    },
    {
      dataOwnerCode: "EBS",
    },
  ]);
  let selectedDataOwner = $state("HTM");

  let directionOptions = $state([
    {
      text: "Beide",
      value: "",
    },
    {
      text: "Inbound",
      value: "inbound",
    },
    {
      text: "Outbound",
      value: "outbound",
    },
  ]);
  let selectedDirection = $state("");

  let linePlanningNumber = $state("");

  function loadQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const hasDataownerCode = urlParams.has("dataowner_code");
    const hasOperationDate = urlParams.has("operation_date");
    const hasDirection = urlParams.has("direction");
    const hasLinePlanningNumber = urlParams.has("line_planning_number");

    if (hasOperationDate) {
      operationDate = new Date(Date.parse(urlParams.get("operation_date")))
        .toJSON()
        .slice(0, 10);
    }

    if (hasDataownerCode) {
      selectedDataOwner = urlParams.get("dataowner_code");
    }

    if (hasDirection) {
      selectedDirection = urlParams.get("direction");
    }

    if (hasLinePlanningNumber) {
      linePlanningNumber = urlParams.get("line_planning_number");
    }
    console.log(linePlanningNumber);
  }

  loadQueryParams();
  window.addEventListener("popstate", () => {
    console.log(event.target);
    console.log("HIER");
    loadQueryParams();
    //window.history.back();
  });

  function updateQueryParams(
    operationDate,
    selectedDataOwner,
    selectedDirection,
    linePlanningNumber,
  ) {
    const currentUrl = new URL(window.location.href);
    const updatedUrl = new URL(currentUrl);

    // Update the query parameters
    updatedUrl.searchParams.set("dataowner_code", selectedDataOwner);
    updatedUrl.searchParams.set("operation_date", operationDate);
    if (selectedDirection != "") {
      updatedUrl.searchParams.set("direction", selectedDirection);
    } else {
      updatedUrl.searchParams.delete("direction");
    }
    updatedUrl.searchParams.set("line_planning_number", linePlanningNumber);

    if (currentUrl.href !== updatedUrl.href) {
      history.pushState(null, "", updatedUrl);
    }
  }

  let rows: JourneyOverview[] = $state([]);
  // Create the table.
  let table = createSvelteTable({
    get data() {
      return rows;
    },
    columns: columnDefs,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  async function loadData(
    operationDate,
    selectedDataOwner,
    linePlanningNumber,
    selectedDirection,
    filterOperatingHours,
  ) {
    let token = await getIdToken();
    try {
      let response = await fetch(
        `https://dashboard-api.openprio.nl/journey_overview?data_owner_code=${selectedDataOwner}&operation_date=${operationDate}&line_planning_number=${linePlanningNumber}&direction=${selectedDirection}&filter_operating_hours=${filterOperatingHours}`,
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
      rows = data.map((row: JourneyOverview) => {
        row.openprio_received_ratio = getPercentageBarData(
          row.count_openprio_received / row.count_intersections,
        );
        row.processing_ratio = getPercentageBarData(
          row.count_ssm_proccessing / row.count_intersections,
        );
        row.success_ratio = getPercentageBarData(
          row.count_ssm_granted / row.count_intersections,
        );
        row.srm_sent_ratio = getPercentageBarData(
          row.count_srm_sent / row.count_intersections,
        );
        row.init_time_raw_data_link = getRawDataLink(
          row.data_owner_code,
          row.vehicle_number,
          row.init_time,
        );

        return row;
      });
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }

  let timeoutId;
  $effect(() => {
    if (!linePlanningNumber || linePlanningNumber == "") {
      return;
    }

    loadData(
      operationDate,
      selectedDataOwner,
      linePlanningNumber,
      selectedDirection,
      filterOperatingHours,
    );

    // delay updating URL with 500ms
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      updateQueryParams(
        operationDate,
        selectedDataOwner,
        selectedDirection,
        linePlanningNumber,
      );
    }, 500);
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

{#snippet rawDataLinkCell(content: RawDataLink)}
  <td class="pr-8 text-sm">
    {#if content}
      <Link
        to={content.content}
        class="font-medium text-blue-600 hover:underline dark:text-blue-500"
        >{content.linkText}
      </Link>
    {/if}
  </td>
{/snippet}

{#snippet journeyLink(journeyID: number)}
  <td>
    <Link
      to={`/journeys/${journeyID}`}
      class="font-medium text-blue-600 hover:underline dark:text-blue-500"
      >{journeyID}</Link
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
          for="data_owner"
          class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
          >DataOwner</label
        >
        <select
          id="data_owner"
          bind:value={selectedDataOwner}
          class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
        >
          {#each dataOwners as dataOwner}
            <option value={dataOwner.dataOwnerCode}>
              {dataOwner.dataOwnerCode}
            </option>
          {/each}
        </select>
      </div>

      <div class="mx-4 my-2 flex-col">
        <label
          for="line_planning_number"
          class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
          >LinePlanningNumber</label
        >
        <input
          type="text"
          id="line_planning_number"
          bind:value={linePlanningNumber}
          class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
          placeholder="M300"
          required
        />
      </div>

      <div class="mx-4 my-2 flex-col">
        <label
          for="direction"
          class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
          >Richting</label
        >
        <select
          id="direction"
          bind:value={selectedDirection}
          class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
        >
          {#each directionOptions as directionOption}
            <option value={directionOption.value}>
              {directionOption.text}
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

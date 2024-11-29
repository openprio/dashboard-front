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
    count_intersections: number;
    count_srm_new: number;
    count_ssm_requested: number;
    count_ssm_proccessing: number;
    count_ssm_granted: number;
    count_openprio_received: number;
    openprio_received_ratio: PercentageBarData;
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
    colHelp.accessor("data_owner_code", {
      header: () => renderSnippet(defaultHeaderTitle, "DataOwnerCode"),
      cell: (cell) => renderSnippet(defaultCell, cell.getValue()),
    }),
    colHelp.accessor("line_planning_number", {
      header: () => renderSnippet(defaultHeaderTitle, "LinePlanningNumber"),
      cell: (cell) => renderSnippet(defaultCell, cell.getValue()),
    }),
    colHelp.accessor("direction", {
      header: () => renderSnippet(defaultHeaderTitle, "Richting"),
      cell: ({ cell }) => renderSnippet(defaultCell, cell.getValue()),
    }),
    colHelp.accessor("vehicle_number", {
      header: () => renderSnippet(defaultHeaderTitle, "Grootwagennummer"),
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
    colHelp.accessor("processing_ratio", {
      header: () => renderSnippet(defaultHeaderTitle, "PROCESSING ontvangen"),
      cell: ({ cell }) =>
        renderComponent(PercentageBar, { content: cell.getValue() }),
    }),
    colHelp.accessor("success_ratio", {
      header: () => renderSnippet(defaultHeaderTitle, "Aanvraag succesvol"),
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
  let selectedDataOwner = $state();

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
  let selectedDirection = $state();

  let linePlanningNumber = $state();

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

        return row;
      });
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }

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

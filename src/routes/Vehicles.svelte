<script lang="ts">
  import Navigation from "../components/Navigation.svelte";
  import {
    createColumnHelper,
    createSvelteTable,
    FlexRender,
    getCoreRowModel,
    getSortedRowModel,
    renderComponent,
    renderSnippet,
  } from "../lib/table";
  import { Link } from "svelte-routing";
  import {
    canManageVehicleCredentials,
    currentUser,
    getIdToken,
    reportPreferences,
  } from "../auth";
  import type { PercentageBarData } from "../components/PercentageBarData";
  import { getPercentageBarData } from "../components/PercentageBarData";
  import PercentageBar from "../components/PercentageBar.svelte";
  import OperatingHoursToggle from "../components/OperatingHoursToggle.svelte";
  import filterOperatingSub from "../components/OperatingHoursStore";
  import VehicleCredentials, {
    type VehicleCredential,
  } from "../components/VehicleCredentials.svelte";
  import { listVehicleCredentials } from "../api.js";
  import { DATA_OWNER_CODES, DEFAULT_DATA_OWNER_CODE } from "../constants.js";

  let filterOperatingHours = $state(false);

  filterOperatingSub.sub((value) => {
    filterOperatingHours = value.valueOf();
  });

  type VehicleLink = {
    data_owner_code: string;
    vehicle_number: number;
    operation_date: string;
  };

  type VehicleStat = {
    operator: string;
    vehicle_number: number;
    journey_total: number;
    intersection_passes: number;
    srm_sent: number;
    ssm_requested: number;
    ssm_processing: number;
    ssm_granted: number;
    openprio_received: number;
    openprio_received_ratio: number;
    vehicle_link: VehicleLink;
    srm_sent_ratio: PercentageBarData;
    ssm_requested_ratio: PercentageBarData;
    ssm_processing_ratio: PercentageBarData;
    ssm_granted_ratio: PercentageBarData;
    openprio_received_percentage: PercentageBarData;
  };

  const colHelp = createColumnHelper<VehicleStat>();

  const columnDefs = [
    colHelp.accessor("vehicle_link", {
      header: () => renderSnippet(defaultHeaderTitle, "Grootwagennummer"),
      cell: (cell) => renderSnippet(vehicleLink, cell.getValue()),
    }),
    colHelp.accessor("journey_total", {
      header: () => renderSnippet(defaultHeaderTitle, "Ritten"),
      cell: (cell) => renderSnippet(defaultCell, cell.getValue()),
    }),
    colHelp.accessor("intersection_passes", {
      header: () => renderSnippet(defaultHeaderTitle, "Kruispuntpassages"),
      cell: (cell) => renderSnippet(defaultCell, cell.getValue()),
    }),
    colHelp.accessor("openprio_received_percentage", {
      header: () => renderSnippet(defaultHeaderTitle, "OpenPrio ontvangen"),
      cell: ({ cell }) =>
        renderComponent(PercentageBar, { content: cell.getValue() }),
      sortingFn: (rowA, rowB, columnId) => {
        return (
          rowA.original.openprio_received_percentage.ratio -
          rowB.original.openprio_received_percentage.ratio
        );
      },
    }),
    colHelp.accessor("srm_sent_ratio", {
      header: () => renderSnippet(defaultHeaderTitle, "SRM ontvangen"),
      cell: ({ cell }) =>
        renderComponent(PercentageBar, { content: cell.getValue() }),
    }),
    colHelp.accessor("ssm_requested_ratio", {
      header: () => renderSnippet(defaultHeaderTitle, "SSM requested"),
      cell: ({ cell }) =>
        renderComponent(PercentageBar, { content: cell.getValue() }),
    }),
    colHelp.accessor("ssm_processing_ratio", {
      header: () => renderSnippet(defaultHeaderTitle, "SSM processing"),
      cell: ({ cell }) =>
        renderComponent(PercentageBar, { content: cell.getValue() }),
    }),
    colHelp.accessor("ssm_granted_ratio", {
      header: () => renderSnippet(defaultHeaderTitle, "SSM granted"),
      cell: ({ cell }) =>
        renderComponent(PercentageBar, { content: cell.getValue() }),
      sortingFn: (rowA, rowB, columnId) => {
        return (
          rowA.original.ssm_granted_ratio.ratio -
          rowB.original.ssm_granted_ratio.ratio
        );
      },
    }),
  ];

  let operationDate = $state(new Date().toJSON().slice(0, 10));
  let dataOwners = $state(DATA_OWNER_CODES.map((code) => ({ dataOwnerCode: code })));
  let selectedDataOwner = $state(DEFAULT_DATA_OWNER_CODE);
  let activeTab = $state<"vehicles" | "credentials">("vehicles");

  let canManageCredentials = $derived(
    canManageVehicleCredentials(
      $currentUser,
      $reportPreferences,
      selectedDataOwner,
    ),
  );

  // Vehicle credentials for the selected data owner. Loaded here (not in the
  // tab component) so the tab label can always show the total count.
  let vehicleCredentials = $state<VehicleCredential[]>([]);
  let credentialsLoading = $state(true);
  let credentialsError = $state("");

  async function loadCredentials(doc: string) {
    credentialsLoading = true;
    credentialsError = "";
    try {
      vehicleCredentials = await listVehicleCredentials(doc);
    } catch (e) {
      credentialsError = e.message || "Credentials kunnen niet worden geladen.";
    } finally {
      credentialsLoading = false;
    }
  }

  $effect(() => {
    loadCredentials(selectedDataOwner);
  });

  function loadQueryParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const hasDataownerCode = urlParams.has("dataowner_code");
    const hasOperationDate = urlParams.has("operation_date");

    if (hasOperationDate) {
      operationDate = new Date(Date.parse(urlParams.get("operation_date")))
        .toJSON()
        .slice(0, 10);
    }

    if (hasDataownerCode) {
      selectedDataOwner = urlParams.get("dataowner_code");
    }

    activeTab =
      urlParams.get("tab") === "credentials" ? "credentials" : "vehicles";
  }

  loadQueryParams();
  window.addEventListener("popstate", () => {
    loadQueryParams();
  });

  function updateQueryParams(operationDate, selectedDataOwner, activeTab) {
    const currentUrl = new URL(window.location.href);
    const updatedUrl = new URL(currentUrl);

    updatedUrl.searchParams.set("dataowner_code", selectedDataOwner);
    updatedUrl.searchParams.set("operation_date", operationDate);
    if (activeTab === "credentials") {
      updatedUrl.searchParams.set("tab", "credentials");
    } else {
      updatedUrl.searchParams.delete("tab");
    }

    if (currentUrl.href !== updatedUrl.href) {
      history.pushState(null, "", updatedUrl);
    }
  }

  let rows: VehicleStat[] = $state([]);
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
    filterOperatingHours,
  ) {
    let token = await getIdToken();
    try {
      let response = await fetch(
        `https://dashboard-api.openprio.nl/vehicle_stats?data_owner_code=${selectedDataOwner}&operation_date=${operationDate}&filter_operating_hours=${filterOperatingHours}`,
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
      rows = data.map((row: VehicleStat) => {
        row.vehicle_link = {
          data_owner_code: row.operator,
          vehicle_number: row.vehicle_number,
          operation_date: operationDate,
        };
        row.openprio_received_percentage = getPercentageBarData(
          row.openprio_received_ratio,
        );
        row.srm_sent_ratio = getPercentageBarData(
          row.srm_sent / row.intersection_passes,
        );
        row.ssm_requested_ratio = getPercentageBarData(
          row.ssm_requested / row.intersection_passes,
        );
        row.ssm_processing_ratio = getPercentageBarData(
          row.ssm_processing / row.intersection_passes,
        );
        row.ssm_granted_ratio = getPercentageBarData(
          row.ssm_granted / row.intersection_passes,
        );

        return row;
      });
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }

  let timeoutId;
  $effect(() => {
    loadData(operationDate, selectedDataOwner, filterOperatingHours);
  });

  $effect(() => {
    const date = operationDate;
    const doc = selectedDataOwner;
    const tab = activeTab;
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      updateQueryParams(date, doc, tab);
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
  {:else if content == "SSM requested"}
    <th class="border-b border-neutral-200 py-2 pr-8 text-left font-medium">
      <div class="flex items-center justify-center space-x-2">
        <div class="h-[2px] flex-1 bg-orange-400"></div>
        <div class="h-4 w-4 shrink-0 rounded-full bg-orange-400"></div>
        <div class="h-[2px] flex-1 bg-orange-400"></div>
        {content}
      </div></th
    >
  {:else if content == "SSM processing"}
    <th class="border-b border-neutral-200 py-2 pr-8 text-left font-medium">
      <div class="flex items-center justify-center space-x-2">
        <div class="h-[2px] flex-1 bg-blue-100"></div>
        <div class="h-4 w-4 shrink-0 rounded-full bg-blue-100"></div>
        <div class="h-[2px] flex-1 bg-blue-100"></div>
        {content}
      </div></th
    >
  {:else if content == "SSM granted"}
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

{#snippet vehicleLink(vehicleLink: VehicleLink)}
  <td>
    <Link
      to={`/vehicles/${vehicleLink.data_owner_code}/${vehicleLink.vehicle_number}/${vehicleLink.operation_date}`}
      class="font-medium text-blue-600 hover:underline dark:text-blue-500"
      >{vehicleLink.vehicle_number}</Link
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
          for="data_owner"
          class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
          >DataOwner</label
        >
        <select
          id="data_owner"
          bind:value={selectedDataOwner}
          class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-800"
        >
          {#each dataOwners as dataOwner}
            <option value={dataOwner.dataOwnerCode}>
              {dataOwner.dataOwnerCode}
            </option>
          {/each}
        </select>
      </div>
    </div>

    <!-- Tab bar -->
    <div class="mx-4 border-b border-gray-200 dark:border-gray-700">
      <ul class="-mb-px flex flex-wrap text-center text-sm font-medium">
        <li class="me-2">
          <button
            class="inline-block rounded-t-lg border-b-2 p-4 {activeTab ===
            'vehicles'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent hover:border-gray-300 hover:text-gray-600 dark:hover:text-gray-300'}"
            onclick={() => (activeTab = "vehicles")}
          >
            Voertuigen
          </button>
        </li>
        <li class="me-2">
          <button
            class="inline-block rounded-t-lg border-b-2 p-4 {activeTab ===
            'credentials'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent hover:border-gray-300 hover:text-gray-600 dark:hover:text-gray-300'}"
            onclick={() => (activeTab = "credentials")}
          >
            Voertuigcredentials
            {#if !credentialsLoading}
              <span
                class="ml-1 rounded-full px-2 py-0.5 text-xs {activeTab ===
                'credentials'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-600'}"
              >
                {vehicleCredentials.length}
              </span>
            {/if}
          </button>
        </li>
      </ul>
    </div>

    {#if activeTab === "vehicles"}
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
    {:else}
      <VehicleCredentials
        dataOwner={selectedDataOwner}
        canManage={canManageCredentials}
        bind:credentials={vehicleCredentials}
        loading={credentialsLoading}
        loadError={credentialsError}
        onreload={() => loadCredentials(selectedDataOwner)}
      />
    {/if}
  </main>
</div>

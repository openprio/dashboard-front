<script module lang="ts">
  export type VehicleCredential = {
    data_owner_code: string;
    vehicle_number: string;
    created_at: string;
    used_at: string | null;
    last_location_time: string | null;
  };
</script>

<script lang="ts">
  import {
    Alert,
    Button,
    Modal,
    Spinner,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
  } from "flowbite-svelte";
  import {
    ArrowDownOutline,
    ArrowUpOutline,
    PlusOutline,
    RefreshOutline,
    TrashBinOutline,
  } from "flowbite-svelte-icons";
  import { deleteVehicleCredential, resetVehicleCredential } from "../api.js";
  import GenerateCredentialsModal from "./GenerateCredentialsModal.svelte";

  let {
    dataOwner,
    canManage,
    credentials = $bindable(),
    loading,
    loadError,
    onreload,
  }: {
    dataOwner: string;
    canManage: boolean;
    credentials: VehicleCredential[];
    loading: boolean;
    loadError: string;
    onreload: () => void;
  } = $props();

  let error = $state("");
  let success = $state("");

  type SortColumn =
    | "vehicle_number"
    | "status"
    | "created_at"
    | "used_at"
    | "last_location_time";

  // Default: oldest "laatste locatie" first, vehicles without a location last.
  let sortColumn = $state<SortColumn>("last_location_time");
  let sortDirection = $state<"asc" | "desc">("asc");

  function toggleSort(column: SortColumn) {
    if (sortColumn === column) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortColumn = column;
      sortDirection = "asc";
    }
  }

  // Compares two nullable RFC 3339 timestamps; empty values always sort last,
  // regardless of the sort direction.
  function compareNullableDates(
    a: string | null,
    b: string | null,
    dir: number,
  ): number {
    if (a == null && b == null) return 0;
    if (a == null) return 1;
    if (b == null) return -1;
    return dir * (new Date(a).getTime() - new Date(b).getTime());
  }

  let sortedCredentials = $derived.by(() => {
    const dir = sortDirection === "asc" ? 1 : -1;
    return [...credentials].sort((a, b) => {
      switch (sortColumn) {
        case "vehicle_number":
          return (
            dir *
            (Number(a.vehicle_number) - Number(b.vehicle_number) ||
              a.vehicle_number.localeCompare(b.vehicle_number))
          );
        case "status":
          return dir * (Number(a.used_at == null) - Number(b.used_at == null));
        case "created_at":
          return compareNullableDates(a.created_at, b.created_at, dir);
        case "used_at":
          return compareNullableDates(a.used_at, b.used_at, dir);
        case "last_location_time":
          return compareNullableDates(
            a.last_location_time,
            b.last_location_time,
            dir,
          );
      }
    });
  });

  // Reset modal state
  let credentialToReset = $state<VehicleCredential | null>(null);
  let resetModalOpen = $state(false);
  let resetting = $state(false);

  // Delete modal state
  let credentialToDelete = $state<VehicleCredential | null>(null);
  let deleteModalOpen = $state(false);
  let deleting = $state(false);

  // Generate modal state
  let generateModalOpen = $state(false);

  function openReset(credential: VehicleCredential) {
    credentialToReset = credential;
    resetModalOpen = true;
  }

  async function handleReset() {
    if (!credentialToReset) return;
    const credential = credentialToReset;
    resetting = true;
    error = "";
    success = "";
    try {
      await resetVehicleCredential(
        credential.data_owner_code,
        credential.vehicle_number,
      );
      // Update the row in place; no need to reload the whole list.
      credentials = credentials.map((c) =>
        c.vehicle_number === credential.vehicle_number
          ? { ...c, used_at: null }
          : c,
      );
      success = `Token voor voertuig ${credential.vehicle_number} is gereset en kan opnieuw worden gebruikt.`;
      credentialToReset = null;
      resetModalOpen = false;
    } catch (e) {
      error = e.message || "Token resetten is mislukt.";
    } finally {
      resetting = false;
    }
  }

  function openDelete(credential: VehicleCredential) {
    credentialToDelete = credential;
    deleteModalOpen = true;
  }

  async function handleDelete() {
    if (!credentialToDelete) return;
    const credential = credentialToDelete;
    deleting = true;
    error = "";
    success = "";
    try {
      await deleteVehicleCredential(
        credential.data_owner_code,
        credential.vehicle_number,
      );
      // Remove the row locally; no need to reload the whole list.
      credentials = credentials.filter(
        (c) => c.vehicle_number !== credential.vehicle_number,
      );
      success = `Credentials voor voertuig ${credential.vehicle_number} zijn verwijderd.`;
      credentialToDelete = null;
      deleteModalOpen = false;
    } catch (e) {
      error = e.message || "Credentials verwijderen is mislukt.";
    } finally {
      deleting = false;
    }
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString("nl-NL");
    } catch {
      return iso;
    }
  }
</script>

{#snippet sortableHeader(column: SortColumn, label: string)}
  <TableHeadCell>
    <button
      class="flex items-center gap-1 hover:text-blue-600"
      onclick={() => toggleSort(column)}
    >
      {label}
      {#if sortColumn === column}
        {#if sortDirection === "asc"}
          <ArrowUpOutline class="h-3 w-3" />
        {:else}
          <ArrowDownOutline class="h-3 w-3" />
        {/if}
      {/if}
    </button>
  </TableHeadCell>
{/snippet}

<div class="flex flex-col gap-4 p-4">
  {#if success}
    <Alert color="green" dismissable>{success}</Alert>
  {/if}
  {#if loadError}
    <Alert color="red" dismissable>{loadError}</Alert>
  {/if}
  {#if error}
    <Alert color="red" dismissable>{error}</Alert>
  {/if}

  <div class="flex items-center justify-between">
    <p class="text-sm text-gray-500">
      Status van de credentials voor <strong>{dataOwner}</strong>.
    </p>
    {#if canManage}
      <Button color="blue" size="sm" onclick={() => (generateModalOpen = true)}>
        <PlusOutline class="mr-2 h-4 w-4" />
        Credentials genereren
      </Button>
    {/if}
  </div>

  {#if loading}
    <div class="flex justify-center p-10">
      <Spinner />
    </div>
  {:else}
    <div class="overflow-x-auto rounded border border-gray-200 shadow-sm">
      <Table>
        <TableHead>
          {@render sortableHeader("vehicle_number", "Voertuignummer")}
          {@render sortableHeader("status", "Status")}
          {@render sortableHeader("created_at", "Aangemaakt op")}
          {@render sortableHeader("used_at", "Geregistreerd op")}
          {@render sortableHeader("last_location_time", "Laatste locatie")}
          {#if canManage}
            <TableHeadCell class="text-right">Acties</TableHeadCell>
          {/if}
        </TableHead>
        <TableBody>
          {#if sortedCredentials.length === 0}
            <TableBodyRow>
              <TableBodyCell
                colspan={canManage ? 6 : 5}
                class="text-center text-gray-500"
              >
                Geen credentials gevonden voor {dataOwner}.
              </TableBodyCell>
            </TableBodyRow>
          {:else}
            {#each sortedCredentials as credential (credential.vehicle_number)}
              <TableBodyRow>
                <TableBodyCell>{credential.vehicle_number}</TableBodyCell>
                <TableBodyCell>
                  {#if credential.used_at}
                    <span
                      class="inline-flex rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
                    >
                      Actief
                    </span>
                  {:else}
                    <span
                      class="inline-flex rounded bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800"
                    >
                      Wachtend op registratie
                    </span>
                  {/if}
                </TableBodyCell>
                <TableBodyCell
                  >{formatDate(credential.created_at)}</TableBodyCell
                >
                <TableBodyCell>
                  {#if credential.used_at}
                    {formatDate(credential.used_at)}
                  {:else}
                    <span class="text-gray-400">—</span>
                  {/if}
                </TableBodyCell>
                <TableBodyCell>
                  {#if credential.last_location_time}
                    {formatDate(credential.last_location_time)}
                  {:else}
                    <span class="text-gray-400">Nooit</span>
                  {/if}
                </TableBodyCell>
                {#if canManage}
                  <TableBodyCell class="text-right">
                    <div class="flex justify-end gap-2">
                      {#if credential.used_at}
                        <Button
                          color="alternative"
                          size="xs"
                          title="Token resetten"
                          onclick={() => openReset(credential)}
                        >
                          <RefreshOutline class="h-4 w-4" />
                        </Button>
                      {/if}
                      <Button
                        color="red"
                        size="xs"
                        title="Credentials verwijderen"
                        onclick={() => openDelete(credential)}
                      >
                        <TrashBinOutline class="h-4 w-4" />
                      </Button>
                    </div>
                  </TableBodyCell>
                {/if}
              </TableBodyRow>
            {/each}
          {/if}
        </TableBody>
      </Table>
    </div>
  {/if}
</div>

<!-- Reset confirmation modal -->
<Modal bind:open={resetModalOpen} size="xs" autoclose={false}>
  <div class="text-center">
    <h3 class="mb-5 text-lg font-normal text-gray-500">
      Weet je zeker dat je het token voor voertuig
      <strong>{credentialToReset?.vehicle_number}</strong> wilt resetten? Het token
      kan daarna één keer opnieuw worden gebruikt.
    </h3>
    <div class="flex justify-center gap-3">
      <Button color="blue" onclick={handleReset} disabled={resetting}>
        Ja, reset
      </Button>
      <Button color="alternative" onclick={() => (resetModalOpen = false)}>
        Annuleren
      </Button>
    </div>
  </div>
</Modal>

<!-- Delete confirmation modal -->
<Modal bind:open={deleteModalOpen} size="xs" autoclose={false}>
  <div class="text-center">
    <h3 class="mb-5 text-lg font-normal text-gray-500">
      Weet je zeker dat je de credentials voor voertuig
      <strong>{credentialToDelete?.vehicle_number}</strong> wilt verwijderen?
    </h3>
    <div class="flex justify-center gap-3">
      <Button color="red" onclick={handleDelete} disabled={deleting}>
        Ja, verwijder
      </Button>
      <Button color="alternative" onclick={() => (deleteModalOpen = false)}>
        Annuleren
      </Button>
    </div>
  </div>
</Modal>

<GenerateCredentialsModal
  {dataOwner}
  bind:open={generateModalOpen}
  ongenerated={onreload}
/>

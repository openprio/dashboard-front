<script lang="ts">
  import { currentUser } from "../auth.js";
  import {
    listUsers,
    createUser,
    deleteUser,
    setDataOwnerSettings,
  } from "../api.js";
  import { DATA_OWNER_CODES } from "../constants.js";
  import LoadingSpinner from "../components/LoadingSpinner.svelte";
  import {
    Button,
    Input,
    Label,
    Select,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Modal,
    Alert,
  } from "flowbite-svelte";
  import {
    TrashBinOutline,
    PlusOutline,
    UserSettingsOutline,
  } from "flowbite-svelte-icons";
  import Navigation from "../components/Navigation.svelte";

  type DataOwnerSetting = {
    data_owner_code: string;
    can_manage_vehicle_credentials: boolean;
    daily_openprio_detection_report: boolean;
  };

  type DashboardUser = {
    id: string;
    email: string;
    firebase_uid: string;
    role: string;
    created_at: string;
    created_by: string;
    last_used_at: string | null;
    data_owner_settings?: DataOwnerSetting[];
  };

  let users = $state<DashboardUser[]>([]);
  let loading = $state(true);
  let error = $state("");
  let success = $state("");

  // Create user form state
  let newEmail = $state("");
  let newRole = $state("user");
  let creating = $state(false);

  // Delete modal state
  let userToDelete = $state<DashboardUser | null>(null);
  let deleteModalOpen = $state(false);
  let deleting = $state(false);

  // Data-owner rights modal state
  let rightsUser = $state<DashboardUser | null>(null);
  let rightsModalOpen = $state(false);
  let rightsCredentials = $state<Record<string, boolean>>({});
  let rightsReports = $state<Record<string, boolean>>({});
  let rightsSaving = $state(false);

  function settingsFor(
    user: DashboardUser,
    dataOwnerCode: string,
  ): { canManage: boolean; dailyReport: boolean } {
    const setting = user.data_owner_settings?.find(
      (s) => s.data_owner_code === dataOwnerCode,
    );
    return {
      canManage: setting?.can_manage_vehicle_credentials ?? false,
      dailyReport: setting?.daily_openprio_detection_report ?? false,
    };
  }

  function openRights(user: DashboardUser) {
    rightsUser = user;
    rightsCredentials = Object.fromEntries(
      DATA_OWNER_CODES.map((code) => [
        code,
        settingsFor(user, code).canManage,
      ]),
    );
    rightsReports = Object.fromEntries(
      DATA_OWNER_CODES.map((code) => [
        code,
        settingsFor(user, code).dailyReport,
      ]),
    );
    rightsModalOpen = true;
  }

  async function handleSaveRights() {
    if (!rightsUser) return;
    rightsSaving = true;
    error = "";
    success = "";
    const user = rightsUser;
    const changed = DATA_OWNER_CODES.filter((code) => {
      const initial = settingsFor(user, code);
      return (
        rightsCredentials[code] !== initial.canManage ||
        rightsReports[code] !== initial.dailyReport
      );
    });
    try {
      await Promise.all(
        changed.map((code) =>
          setDataOwnerSettings(user.email, code, {
            can_manage_vehicle_credentials: rightsCredentials[code],
            daily_openprio_detection_report: rightsReports[code],
          }),
        ),
      );
      // Reflect the saved state locally.
      const newSettings = DATA_OWNER_CODES.filter(
        (code) =>
          rightsCredentials[code] ||
          rightsReports[code] ||
          user.data_owner_settings?.some((s) => s.data_owner_code === code),
      ).map((code) => ({
        data_owner_code: code,
        can_manage_vehicle_credentials: rightsCredentials[code],
        daily_openprio_detection_report: rightsReports[code],
      }));
      users = users.map((u) =>
        u.email === user.email ? { ...u, data_owner_settings: newSettings } : u,
      );
      success = `Rechten voor ${user.email} zijn opgeslagen.`;
      rightsUser = null;
      rightsModalOpen = false;
    } catch (e) {
      error = e.message || "Rechten opslaan is mislukt.";
    } finally {
      rightsSaving = false;
    }
  }

  async function loadUsers() {
    loading = true;
    error = "";
    try {
      users = await listUsers();
    } catch (e) {
      error = e.message || "Gebruikers kunnen niet worden geladen.";
    } finally {
      loading = false;
    }
  }

  async function handleCreate() {
    creating = true;
    error = "";
    success = "";
    try {
      const newUser = await createUser(newEmail, newRole);
      users = [...users, newUser];
      success = `Gebruiker ${newEmail} is aangemaakt.`;
      newEmail = "";
      newRole = "user";
    } catch (e) {
      error = e.message || "Gebruiker aanmaken is mislukt.";
    } finally {
      creating = false;
    }
  }

  function openDelete(user: DashboardUser) {
    userToDelete = user;
    deleteModalOpen = true;
  }

  async function handleDelete() {
    if (!userToDelete) return;
    deleting = true;
    error = "";
    success = "";
    try {
      await deleteUser(userToDelete.email);
      users = users.filter((u) => u.email !== userToDelete.email);
      success = `Gebruiker ${userToDelete.email} is verwijderd.`;
      userToDelete = null;
      deleteModalOpen = false;
    } catch (e) {
      error = e.message || "Gebruiker verwijderen is mislukt.";
    } finally {
      deleting = false;
    }
  }

  // Load users on mount
  $effect(() => {
    loadUsers();
  });

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleString("nl-NL");
    } catch {
      return iso;
    }
  }
</script>

<Navigation></Navigation>

{#if !$currentUser?.admin}
  <div class="flex flex-col items-center justify-center gap-4 p-10">
    <h1 class="text-2xl font-bold text-red-700">403 — Geen toegang</h1>
    <p>Je hebt geen rechten om deze pagina te bekijken.</p>
  </div>
{:else}
  <div class="flex flex-col gap-6 p-6 pt-16">
    <h1 class="text-2xl font-bold">Gebruikersbeheer</h1>

    {#if success}
      <Alert color="green" dismissable>
        {success}
      </Alert>
    {/if}
    {#if error}
      <Alert color="red" dismissable>
        {error}
      </Alert>
    {/if}

    <!-- Create user form -->
    <div class="flex flex-col gap-3 rounded border border-gray-200 p-4 shadow-sm">
      <h2 class="text-lg font-semibold">Nieuwe gebruiker aanmaken</h2>
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div class="flex flex-col gap-1">
          <Label for="new-email">E-mailadres</Label>
          <Input
            id="new-email"
            type="email"
            placeholder="nieuw@example.com"
            bind:value={newEmail}
          />
        </div>
        <div class="flex flex-col gap-1">
          <Label for="new-role">Rol</Label>
          <Select id="new-role" bind:value={newRole}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </Select>
        </div>
        <Button color="blue" on:click={handleCreate} disabled={creating || !newEmail}>
          <PlusOutline class="mr-2 h-4 w-4" />
          Aanmaken
        </Button>
      </div>
    </div>

    <!-- Users table -->
    {#if loading}
      <LoadingSpinner />
    {:else}
      <div class="overflow-x-auto rounded border border-gray-200 shadow-sm">
        <Table>
          <TableHead>
            <TableHeadCell>E-mail</TableHeadCell>
            <TableHeadCell>Rol</TableHeadCell>
            <TableHeadCell>Credential-rechten</TableHeadCell>
            <TableHeadCell>E-mailrapport</TableHeadCell>
            <TableHeadCell>Aangemaakt op</TableHeadCell>
            <TableHeadCell>Aangemaakt door</TableHeadCell>
            <TableHeadCell>Laatst gebruikt op</TableHeadCell>
            <TableHeadCell class="text-right">Acties</TableHeadCell>
          </TableHead>
          <TableBody>
            {#if users.length === 0}
              <TableBodyRow>
                <TableBodyCell colspan={8} class="text-center text-gray-500">
                  Geen gebruikers gevonden.
                </TableBodyCell>
              </TableBodyRow>
            {:else}
              {#each users as user (user.id)}
                <TableBodyRow>
                  <TableBodyCell>{user.email}</TableBodyCell>
                  <TableBodyCell>
                    <span
                      class="inline-flex rounded px-2 py-0.5 text-xs font-medium {user.role === 'admin'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'}"
                    >
                      {user.role}
                    </span>
                  </TableBodyCell>
                  <TableBodyCell>
                    {#if user.role === "admin"}
                      <span class="text-gray-400">Alle (admin)</span>
                    {:else}
                      {@const docs = (user.data_owner_settings ?? [])
                        .filter((s) => s.can_manage_vehicle_credentials)
                        .map((s) => s.data_owner_code)}
                      {#if docs.length > 0}
                        {docs.join(", ")}
                      {:else}
                        <span class="text-gray-400">Geen</span>
                      {/if}
                    {/if}
                  </TableBodyCell>
                  <TableBodyCell>
                    {@const reportDocs = (user.data_owner_settings ?? [])
                      .filter((s) => s.daily_openprio_detection_report)
                      .map((s) => s.data_owner_code)}
                    {#if reportDocs.length > 0}
                      {reportDocs.join(", ")}
                    {:else}
                      <span class="text-gray-400">Geen</span>
                    {/if}
                  </TableBodyCell>
                  <TableBodyCell>{formatDate(user.created_at)}</TableBodyCell>
                  <TableBodyCell>{user.created_by}</TableBodyCell>
                  <TableBodyCell>
                    {#if user.last_used_at}
                      {formatDate(user.last_used_at)}
                    {:else}
                      <span class="text-gray-400">Nooit</span>
                    {/if}
                  </TableBodyCell>
                  <TableBodyCell class="text-right">
                    <div class="flex justify-end gap-2">
                      <Button
                        color="alternative"
                        size="xs"
                        title="Dataowner-instellingen beheren"
                        on:click={() => openRights(user)}
                      >
                        <UserSettingsOutline class="h-4 w-4" />
                      </Button>
                      <Button
                        color="red"
                        size="xs"
                        title="Gebruiker verwijderen"
                        on:click={() => openDelete(user)}
                      >
                        <TrashBinOutline class="h-4 w-4" />
                      </Button>
                    </div>
                  </TableBodyCell>
                </TableBodyRow>
              {/each}
            {/if}
          </TableBody>
        </Table>
      </div>
    {/if}
  </div>
{/if}

<!-- Delete confirmation modal -->
<Modal bind:open={deleteModalOpen} size="xs" autoclose={false}>
  <div class="text-center">
    <h3 class="mb-5 text-lg font-normal text-gray-500">
      Weet je zeker dat je <strong>{userToDelete?.email}</strong> wilt verwijderen?
    </h3>
    <div class="flex justify-center gap-3">
      <Button color="red" on:click={handleDelete} disabled={deleting}>
        Ja, verwijder
      </Button>
      <Button color="alternative" on:click={() => (deleteModalOpen = false)}>
        Annuleren
      </Button>
    </div>
  </div>
</Modal>

<!-- Data-owner rights modal -->
<Modal
  bind:open={rightsModalOpen}
  title="Dataowner-instellingen — {rightsUser?.email ?? ''}"
  size="sm"
  autoclose={false}
>
  <div class="flex flex-col gap-4">
    <p class="text-sm text-gray-500">
      Selecteer per dataowner of deze gebruiker voertuigcredentials mag beheren
      (genereren, resetten en verwijderen) en/of dagelijks het
      OpenPrio-detectierapport per e-mail ontvangt.
    </p>
    {#if rightsUser?.role === "admin"}
      <Alert color="blue">
        Beheerders hebben automatisch credential-rechten voor alle dataowners.
      </Alert>
    {/if}
    <table class="w-full text-sm text-gray-900">
      <thead>
        <tr class="border-b border-gray-200 text-left text-gray-500">
          <th class="py-1 font-medium">Dataowner</th>
          <th class="py-1 text-center font-medium">Credentials</th>
          <th class="py-1 text-center font-medium">E-mailrapport</th>
        </tr>
      </thead>
      <tbody>
        {#each DATA_OWNER_CODES as code}
          <tr class="border-b border-gray-100 last:border-0">
            <td class="py-1.5">{code}</td>
            <td class="py-1.5 text-center">
              {#if rightsUser?.role === "admin"}
                <input
                  type="checkbox"
                  checked
                  disabled
                  class="h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600"
                />
              {:else}
                <input
                  type="checkbox"
                  bind:checked={rightsCredentials[code]}
                  class="h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-blue-500"
                />
              {/if}
            </td>
            <td class="py-1.5 text-center">
              <input
                type="checkbox"
                bind:checked={rightsReports[code]}
                class="h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-blue-500"
              />
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
    <div class="flex justify-end gap-3">
      <Button color="blue" on:click={handleSaveRights} disabled={rightsSaving}>
        {rightsSaving ? "Opslaan..." : "Opslaan"}
      </Button>
      <Button color="alternative" on:click={() => (rightsModalOpen = false)}>
        Annuleren
      </Button>
    </div>
  </div>
</Modal>

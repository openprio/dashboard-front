<script lang="ts">
  import { currentUser } from "../auth.js";
  import { listUsers, createUser, deleteUser } from "../api.js";
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
  import { TrashBinOutline, PlusOutline } from "flowbite-svelte-icons";
  import Navigation from "../components/Navigation.svelte";

  type DashboardUser = {
    id: string;
    email: string;
    firebase_uid: string;
    role: string;
    created_at: string;
    created_by: string;
    last_used_at: string | null;
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
            <TableHeadCell>Aangemaakt op</TableHeadCell>
            <TableHeadCell>Aangemaakt door</TableHeadCell>
            <TableHeadCell>Laatst gebruikt op</TableHeadCell>
            <TableHeadCell class="text-right">Acties</TableHeadCell>
          </TableHead>
          <TableBody>
            {#if users.length === 0}
              <TableBodyRow>
                <TableBodyCell colspan={6} class="text-center text-gray-500">
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
                    <Button
                      color="red"
                      size="xs"
                      on:click={() => openDelete(user)}
                    >
                      <TrashBinOutline class="h-4 w-4" />
                    </Button>
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

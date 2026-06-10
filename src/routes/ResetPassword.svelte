<script lang="ts">
  import { preventDefault } from "svelte/legacy";
  import { resetPassword } from "../api.js";
  import LoadingSpinner from "../components/LoadingSpinner.svelte";
  import { navigate } from "svelte-routing";

  let token = $state("");
  let newPassword = $state("");
  let confirmPassword = $state("");
  let loading = $state(false);
  let done = $state(false);
  let error = $state("");

  // Read token from URL query string
  $effect(() => {
    const params = new URLSearchParams(window.location.search);
    token = params.get("token") || "";
  });

  async function submit() {
    error = "";
    if (newPassword.length < 12) {
      error = "Wachtwoord moet minimaal 12 tekens bevatten.";
      return;
    }
    if (newPassword !== confirmPassword) {
      error = "Wachtwoorden komen niet overeen.";
      return;
    }
    loading = true;
    try {
      await resetPassword(token, newPassword);
      done = true;
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (e) {
      error = e.message || "Er is iets misgegaan.";
    } finally {
      loading = false;
    }
  }
</script>

{#if loading}
  <LoadingSpinner />
{:else}
  <div class="flex flex-col gap-5">
    <div
      class="flex h-40 flex-col items-center justify-end gap-5 border-b border-gray-800 bg-red-700 pb-5"
    >
      <span class="text-8xl text-white">OpenPrio</span>
      <div class="h-[5px] w-96 bg-blue-500"></div>
    </div>

    <div class="flex flex-col items-center gap-5">
      <h1 class="text-xl font-semibold">Wachtwoord resetten</h1>

      {#if done}
        <p class="max-w-md text-center text-green-700">
          Je wachtwoord is succesvol gereset. Je wordt doorgestuurd naar de inlogpagina.
        </p>
      {:else}
        <form onsubmit={preventDefault(submit)} class="flex flex-col items-center gap-3">
          <div class="flex flex-col gap-1">
            <input
              id="new-password"
              placeholder="Nieuw wachtwoord"
              type="password"
              bind:value={newPassword}
              class="rounded-sm border border-gray-500 bg-white px-2 py-1"
              required
            />
          </div>
          <div class="flex flex-col gap-1">
            <input
              id="confirm-password"
              placeholder="Bevestig wachtwoord"
              type="password"
              bind:value={confirmPassword}
              class="rounded-sm border border-gray-500 bg-white px-2 py-1"
              required
            />
          </div>
          {#if error}
            <span class="text-red-500">{error}</span>
          {/if}
          <button
            class="w-48 rounded border border-gray-800 bg-blue-700 px-2 py-1 text-white"
            >Reset wachtwoord</button
          >
        </form>
      {/if}
    </div>
  </div>
{/if}

<script lang="ts">
  import { preventDefault } from "svelte/legacy";
  import { forgotPassword } from "../api.js";
  import LoadingSpinner from "../components/LoadingSpinner.svelte";

  let email = $state("");
  let loading = $state(false);
  let done = $state(false);
  let error = $state("");

  async function submit() {
    loading = true;
    error = "";
    try {
      await forgotPassword(email);
      done = true;
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
      <h1 class="text-xl font-semibold">Wachtwoord vergeten</h1>

      {#if done}
        <p class="max-w-md text-center text-green-700">
          Als er een account bestaat voor dit e-mailadres, is er een reset-link verstuurd.
        </p>
      {:else}
        <form onsubmit={preventDefault(submit)} class="flex flex-col items-center gap-3">
          <div class="flex flex-col gap-1">
            <input
              id="email"
              placeholder="E-mailadres"
              type="email"
              bind:value={email}
              class="rounded-sm border border-gray-500 bg-white px-2 py-1"
              required
            />
          </div>
          {#if error}
            <span class="text-red-500">{error}</span>
          {/if}
          <button
            class="w-48 rounded border border-gray-800 bg-blue-700 px-2 py-1 text-white"
            >Verstuur reset-link</button
          >
        </form>
      {/if}
    </div>
  </div>
{/if}

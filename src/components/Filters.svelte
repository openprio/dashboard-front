<script>
  import { userCredential } from "../auth.js";
  import { writable } from "svelte/store";

  let show_filters = writable(JSON.parse(localStorage.show_filters ?? "true"));

  show_filters.subscribe((bool) => {
    localStorage.setItem("show_filters", JSON.stringify(bool));
  });

  function toggleShowFilters() {
    $show_filters = !$show_filters;
  }
</script>

<div
  id="filters"
  class="absolute z-20 flex w-full flex-col bg-gray-100 shadow md:static md:w-auto md:flex-row"
>
  {#if $show_filters}
    <div class="flex flex-col gap-2 p-4 md:w-80">
      <div class="flex flex-col">
        <label for="data-owner-id" class="text-sm font-bold text-gray-800"
          >DataOwnerCode</label
        >
        <input
          id="data-owner-id"
          type="text"
          class="rounded-sm border border-gray-500 px-2 py-0.5"
        />
      </div>
      <div class="flex flex-col">
        <label for="car-id" class="text-sm font-bold text-gray-800"
          >VehicleNumber</label
        >
        <input
          id="car-id"
          type="text"
          class="rounded-sm border border-gray-500 px-2 py-0.5"
        />
      </div>
      {#if $userCredential}
        <div class="flex flex-col">
          <label for="start-date" class="text-sm font-bold text-gray-800"
            >Startdatum</label
          >
          <input
            id="start-date"
            type="datetime-local"
            class="rounded-sm border border-gray-500 px-2 py-0.5"
          />
        </div>
        <div class="flex flex-col">
          <label for="end-date" class="text-sm font-bold text-gray-800"
            >Einddatum</label
          >
          <input
            id="end-date"
            type="datetime-local"
            class="rounded-sm border border-gray-500 px-2 py-0.5"
          />
        </div>
      {/if}
      <div class="mt-4 flex flex-row gap-3">
        <button
          class="w-1/2 rounded border border-gray-800 bg-blue-700 px-2 py-0.5 text-white"
          >Zoek</button
        >
        <button
          class="w-1/2 rounded border border-gray-800 bg-red-700 px-2 py-0.5 text-white"
          >Reset</button
        >
      </div>
    </div>
  {/if}
  <button
    class="group flex h-6 w-full items-center justify-center bg-gray-400 text-white hover:bg-gray-700 md:h-full md:w-4"
    onclick={toggleShowFilters}
  >
    <div class="rotate-90 md:rotate-0">
      <div
        class="h-0 w-0 {$show_filters ? '-rotate-90' : 'rotate-90'}
                      border-b-[10px] border-l-[4px]
                      border-r-[4px] border-b-gray-800 border-l-transparent
                      border-r-transparent group-hover:border-b-white"
      ></div>
    </div>
  </button>
</div>

<script>
  import { environment, feedType } from "../socket.js";
  import { show_filters } from "../stores/ui.js";
</script>

<div
  id="filters"
  class="absolute z-20 flex w-full flex-col bg-gray-100 shadow md:static md:w-auto md:flex-row"
>
  {#if $show_filters}
    <div class="flex flex-col gap-2 p-4 md:w-80">
      <div class="flex flex-col">
        <span class="text-sm font-bold text-gray-800">Omgeving</span>
        <div
          class="mt-1 flex overflow-hidden rounded border border-gray-500 text-sm"
        >
          <button
            class="w-1/2 px-2 py-0.5 {$environment === 'prod'
              ? 'bg-blue-700 text-white'
              : 'bg-white text-gray-800 hover:bg-gray-200'}"
            onclick={() => environment.set("prod")}>Prod</button
          >
          <button
            class="w-1/2 px-2 py-0.5 {$environment === 'test'
              ? 'bg-blue-700 text-white'
              : 'bg-white text-gray-800 hover:bg-gray-200'}"
            onclick={() => environment.set("test")}>Test</button
          >
        </div>
      </div>
      <div class="flex flex-col">
        <span class="text-sm font-bold text-gray-800">Feed</span>
        <div
          class="mt-1 flex overflow-hidden rounded border border-gray-500 text-sm"
        >
          <button
            class="w-1/2 px-2 py-0.5 {$feedType === 'position'
              ? 'bg-blue-700 text-white'
              : 'bg-white text-gray-800 hover:bg-gray-200'}"
            onclick={() => feedType.set("position")}>Position</button
          >
          <button
            class="w-1/2 px-2 py-0.5 {$feedType === 'position-plus'
              ? 'bg-blue-700 text-white'
              : 'bg-white text-gray-800 hover:bg-gray-200'}"
            onclick={() => feedType.set("position-plus")}>Position-plus</button
          >
        </div>
      </div>
    </div>
  {/if}
</div>

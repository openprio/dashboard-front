<script lang="ts">
  import type { PercentageBarData } from "./PercentageBarData";
  export let content: PercentageBarData;
</script>

<td
  class="whitespace-nowrap border-l-0 border-r-0 border-t-0 pb-4 pr-8 pt-4 align-middle text-xs"
>
  <div class="flex items-center">
    <span class="mr-2">{content.percentage}</span>
    <div class="relative w-full">
      <div class="flex h-2 overflow-hidden rounded text-xs {content.bg_color}">
        <div
          style="width: {content.percentage}"
          class="flex flex-col justify-center whitespace-nowrap text-center text-white shadow-none {content.color}"
        ></div>
      </div>
    </div>
  </div>
</td>

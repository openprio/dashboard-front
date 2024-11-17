

<script lang="ts">
    import type {PercentageBarData} from './PercentageBarData';
    export let content: PercentageBarData;

</script>

<td class="border-t-0  align-middle border-l-0 border-r-0 text-xs whitespace-nowrap pr-8 pb-4 pt-4">
    <div class="flex items-center">
    <span class="mr-2">{content.percentage}</span>
    <div class="relative w-full">
        <div class="overflow-hidden h-2 text-xs flex rounded {content.bg_color}">
        <div style="width: {content.percentage}" class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center {content.color}"></div>
        </div>
    </div>
    </div>
</td>

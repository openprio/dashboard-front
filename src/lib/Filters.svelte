<script>
    import {access_token} from "../auth.js";
    import { writable } from 'svelte/store';

    let show_filters = writable(JSON.parse(localStorage.show_filters ?? "true"));

    show_filters.subscribe((bool) => {
        localStorage.setItem('show_filters', JSON.stringify(bool));
    });

    function toggleShowFilters() {
        $show_filters = !$show_filters;
    }
</script>
<div id="filters" class="bg-gray-100 flex flex-col md:flex-row absolute md:static z-20 w-full md:w-auto">
    {#if $show_filters}
        <div class="flex flex-col p-4 gap-2 md:w-80">
            <div class="flex flex-col">
                <label for="car-id" class="text-lg text-gray-800 font-medium">Grootwagen nr.</label>
                <input id="car-id" type="text" class="rounded-sm border border-gray-500 px-2 py-1"/>
            </div>
            <div class="flex flex-col">
                <label for="data-owner-id" class="text-lg text-gray-800 font-medium">Data owner code</label>
                <input id="data-owner-id" type="text" class="rounded-sm border border-gray-500 px-2 py-1"/>
            </div>
            <div class="flex flex-col">
                <label for="line-planning-id" class="text-lg text-gray-800 font-medium">Line planning nr.</label>
                <input id="line-planning-id" type="text" class="rounded-sm border border-gray-500 px-2 py-1"/>
            </div>
            <div class="flex flex-col">
                <label for="journey-id" class="text-lg text-gray-800 font-medium">Journey nr.</label>
                <input id="journey-id" type="text" class="rounded-sm border border-gray-500 px-2 py-1"/>
            </div>
            {#if $access_token}
                <div class="flex flex-col">
                    <label for="start-date" class="text-lg text-gray-800 font-medium">Startdate</label>
                    <input id="start-date" type="datetime-local" class="rounded-sm border border-gray-500 px-2 py-1"/>
                </div>
                <div class="flex flex-col">
                    <label for="end-date" class="text-lg text-gray-800 font-medium">Enddate</label>
                    <input id="end-date" type="datetime-local" class="rounded-sm border border-gray-500 px-2 py-1"/>
                </div>
            {/if}
            <div class="flex flex-row gap-3 mt-4">
                <button class="bg-blue-700 rounded px-2 py-1 text-white border border-gray-800 w-1/2">Zoek</button>
                <button class="bg-red-700 rounded px-2 py-1 text-white border border-gray-800 w-1/2">Reset</button>
            </div>
        </div>
    {/if}
    <button class="group bg-gray-400 hover:bg-gray-700 h-7 w-full md:h-full md:w-5 text-white flex items-center justify-center" on:click={toggleShowFilters}>
        <div class="rotate-90 md:rotate-0">
            <div class="w-0 h-0 {$show_filters ? '-rotate-90' : 'rotate-90'}
                      border-l-[6px] border-l-transparent
                      border-b-[14px] border-b-gray-800 group-hover:border-b-white
                      border-r-[6px] border-r-transparent">
            </div>
        </div>
    </button>
</div>
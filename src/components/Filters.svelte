<script>
    import {userCredential} from "../auth.js";
    import { writable } from 'svelte/store';

    let show_filters = writable(JSON.parse(localStorage.show_filters ?? "true"));

    show_filters.subscribe((bool) => {
        localStorage.setItem('show_filters', JSON.stringify(bool));
    });

    function toggleShowFilters() {
        $show_filters = !$show_filters;
    }
</script>
<div id="filters" class="bg-gray-100 flex flex-col md:flex-row absolute md:static z-20 w-full md:w-auto shadow">
    {#if $show_filters}
        <div class="flex flex-col p-4 gap-2 md:w-80">
            <div class="flex flex-col">
                <label for="data-owner-id" class="text-sm font-bold text-gray-800">DataOwnerCode</label>
                <input id="data-owner-id" type="text" class="rounded-sm border border-gray-500 px-2 py-0.5"/>
            </div>
            <div class="flex flex-col">
                <label for="car-id" class="text-sm font-bold text-gray-800">VehicleNumber</label>
                <input id="car-id" type="text" class="rounded-sm border border-gray-500 px-2 py-0.5"/>
            </div>
            {#if $userCredential}
                <div class="flex flex-col">
                    <label for="start-date" class="text-sm font-bold text-gray-800">Startdatum</label>
                    <input id="start-date" type="datetime-local" class="rounded-sm border border-gray-500 px-2 py-0.5"/>
                </div>
                <div class="flex flex-col">
                    <label for="end-date" class="text-sm font-bold text-gray-800">Einddatum</label>
                    <input id="end-date" type="datetime-local" class="rounded-sm border border-gray-500 px-2 py-0.5"/>
                </div>
            {/if}
            <div class="flex flex-row gap-3 mt-4">
                <button class="bg-blue-700 rounded px-2 py-0.5 text-white border border-gray-800 w-1/2">Zoek</button>
                <button class="bg-red-700 rounded px-2 py-0.5 text-white border border-gray-800 w-1/2">Reset</button>
            </div>
        </div>
    {/if}
    <button class="group bg-gray-400 hover:bg-gray-700 h-6 w-full md:h-full md:w-4 text-white flex items-center justify-center" onclick={toggleShowFilters}>
        <div class="rotate-90 md:rotate-0">
            <div class="w-0 h-0 {$show_filters ? '-rotate-90' : 'rotate-90'}
                      border-l-[4px] border-l-transparent
                      border-b-[10px] border-b-gray-800 group-hover:border-b-white
                      border-r-[4px] border-r-transparent">
            </div>
        </div>
    </button>
</div>
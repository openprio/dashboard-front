<script>
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    function login() {
        dispatch('authorize');
    }
</script>
<div class="flex flex-col items-center justify-center w-full h-screen">
    <h1 class="text-3xl">OpenPrio</h1>
    <div class="flex flex-col gap-2">
        <label for="username"></label>
        <input id="username" type="text"/>
        <label for="password"></label>
        <input id="password" type="password"/>
        <button on:click={login}>Login</button>
    </div>
</div>
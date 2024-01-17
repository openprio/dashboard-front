<script>
    import { createEventDispatcher } from 'svelte';
    import {getAuth, signInWithEmailAndPassword} from 'firebase/auth';

    const dispatch = createEventDispatcher();

    const auth = getAuth(window.firebaseApp)

    let username = "";
    let password = "";
    let showErrors = false;

    async function login() {
        try {
            const userCredentials = await signInWithEmailAndPassword(auth, username, password);

            console.log(userCredentials.user);

            if (userCredentials.user) {
                dispatch('authorize');
            }
        } catch (e) {
            console.log(e);
            showErrors = true;
            return;
        }
    }
</script>
<div class="flex flex-col items-center justify-center w-full h-screen">
    <h1 class="text-3xl">OpenPrio</h1>
    <div class="flex flex-col gap-2">
        <label for="username"></label>
        <input id="username" type="text" bind:value={username}/>
        <label for="password"></label>
        <input id="password" type="password" bind:value={password}/>
        {#if showErrors}
            <span>Failed Login</span>
        {/if}
        <button on:click={login}>Login</button>
    </div>
</div>
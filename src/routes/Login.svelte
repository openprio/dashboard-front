<script lang="ts">
    import { preventDefault } from 'svelte/legacy';

    import {firebaseAuth} from '../firebase.js';
    import { createEventDispatcher } from 'svelte';
    
    import {getAuth, signInWithEmailAndPassword} from 'firebase/auth';
    import Dashboard from "./Dashboard.svelte";
    import LoadingSpinner from "../components/LoadingSpinner.svelte";
    import { navigate } from "svelte-routing";

    const dispatch = createEventDispatcher();


    let username = $state("");
    let password = $state("");
    let showErrors = $state(false);
    let signingIn = $state(false)

    async function login() {
        signingIn = true;

        try {
            const userCredentials = await signInWithEmailAndPassword(firebaseAuth, username, password);

            if (userCredentials.user) {
                // userCredentials.user.getIdToken
                // access_token.set(userCredentials.user.accessToken);
                navigate("/", { replace: true });

                signingIn = false;
                dispatch('authorize');
            }
        } catch (e) {
            signingIn = false;
            showErrors = true;
            return;
        }
    }
</script>
{#if signingIn}
    <LoadingSpinner/>
{:else}
    <div class="flex flex-col gap-5">
        <div class="flex flex-col items-center justify-end bg-red-700 border-b border-gray-800 h-40 pb-5 gap-5">
            <span class="text-8xl text-white">OpenPrio</span>
            <div class="w-96 h-[5px] bg-blue-500"></div>
        </div>
        <form onsubmit={preventDefault(login)} class="flex flex-col gap-5 items-center">
            <div class="flex flex-col gap-1">
                <input id="username" placeholder="Username or email.." type="text" bind:value={username} class="bg-white rounded-sm px-2 py-1 border border-gray-500"/>
            </div>
            <div class="flex flex-col gap-1">
                <input id="password" placeholder="Password" type="password" bind:value={password} class="bg-white rounded-sm px-2 py-1 border border-gray-500"/>
            </div>
            {#if showErrors}
                <span class="text-red-500">Failed Login</span>
            {/if}
            <button class="bg-blue-700 rounded px-2 py-1 text-white border border-gray-800 w-48 py-1">Login</button>
        </form>
    </div>
{/if}
<!--    <svg xmlns="http://www.w3.org/2000/svg" width="400" height="450">-->
<!--        <g transform="matrix(1.65 0 0 1.977 -1209 -61)">-->
<!--            <g fill-rule="evenodd">-->
<!--                <path fill="#AAA" d="M1009 214H778c-11 0-24-17-24-28 0-19 1-38 1-56 3-21 11-40 19-59 2-4 5-8 10-8h83c8 3 16 6 19 15 24 59 72 87 126 97v36c0 1-2 3-3 3z"/>-->
<!--                <path fill="#FFF" d="M770 114h105c3 0 4-6 2-9-3-10-8-30-13-30h-81c-5 0-10 20-15 30-1 4 0 9 2 9z"/>-->
<!--            </g>-->
<!--            <path fill="#FFF" d="M787 164c0 6-4 10-9 10s-10-4-10-10c0-5 5-9 10-9s9 4 9 9zm80 0c0 6-4 10-9 10s-10-4-10-10c0-5 5-9 10-9s9 4 9 9z"/>-->
<!--            <path fill="#FFF" fill-rule="evenodd" d="M913 136v35l-16-8c-1-14-2-29-2-44 6 5 13 13 18 17zm24 19 1 27-16-7v-31c7 6 10 7 15 11zm8 5v24c5 2 10 3 15 4v-22l-15-6zm21 9v21c4 1 8 2 12 2v-20l-12-3zm18 5v19c3 1 7 1 10 1v-18l-10-2zm15 3v18l8 1v-18l-8-1z"/>-->
<!--            <path fill="#AAA" d="M754 229h20v-10h30v10h44v-10h164v10c-46 1-93 3-118 14H754v-14z"/>-->
<!--        </g>-->
<!--    </svg>-->

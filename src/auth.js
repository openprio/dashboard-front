import { writable } from 'svelte/store';
import Dashboard from "./views/Dashboard.svelte";

export const access_token = writable(localStorage.access_token);
export const display_name = writable(localStorage.display_name);
export const current_page = writable(Dashboard);

access_token.subscribe((token) => {
    if (token === null || token === undefined) {
        localStorage.removeItem('access_token');
    } else {
        localStorage.setItem('access_token', token);
    }
});

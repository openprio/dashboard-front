import { writable } from 'svelte/store';
import Dashboard from "./views/Dashboard.svelte";

export const current_page = writable(Dashboard);

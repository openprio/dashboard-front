import { writable } from 'svelte/store';

export const access_token = writable(localStorage.access_token);

access_token.subscribe((token) => {
    if (token === null || token === undefined) {
        localStorage.removeItem('access_token');
    } else {
        localStorage.setItem('access_token', token);
    }
});

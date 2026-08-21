import { writable } from "svelte/store";

export const show_filters = writable(
  JSON.parse(localStorage.getItem("show_filters") ?? '"true"'),
);

show_filters.subscribe((value) => {
  localStorage.setItem("show_filters", JSON.stringify(value));
});

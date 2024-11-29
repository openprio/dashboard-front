import type { set } from "date-fns";
import { writable, type Writable } from "svelte/store";

let filterOperatingHours: Writable<boolean> = writable(
    JSON.parse(localStorage.filter_operating_hours ?? "true"),
);
console.log(filterOperatingHours);

filterOperatingHours.subscribe((bool) => {
    console.log(bool);
    localStorage.setItem("filter_operating_hours", JSON.stringify(bool));
});


export default { 
    sub: filterOperatingHours.subscribe,
    set: filterOperatingHours.set,
};

<script>
  import {current_page} from "./auth.js";
</script>

<main class="flex flex-col">
  <svelte:component this={$current_page} />
</main>
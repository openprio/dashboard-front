<script>
import {current_page} from "./router.js";
</script>

<main class="flex flex-col">
  <svelte:component this={$current_page} />
</main>
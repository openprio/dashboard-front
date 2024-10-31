<script>
  import {current_page} from "./router.js";

  const SvelteComponent = $derived($current_page);
</script>

<main class="flex flex-col">
  <SvelteComponent />
</main>
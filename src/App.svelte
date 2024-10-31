<script lang="ts">
  import { Router, Link, Route } from "svelte-routing";
  import Dashboard from "./routes/Dashboard.svelte";
  import Login from "./routes/Login.svelte";


  export let url = "";
</script>


<Router {url}>
  <div>
    <Route path="/login" component={Login} />
    <Route path="/"><Dashboard /></Route>
  </div>
</Router>
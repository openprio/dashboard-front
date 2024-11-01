<script lang="ts">
  import { Router, Link, Route } from "svelte-routing";
  import Dashboard from "./routes/Dashboard.svelte";
  import Login from "./routes/Login.svelte";
  import Intersections from "./routes/Intersections.svelte";
  import Journeys from "./routes/Journeys.svelte";



  export let url = "";
</script>


<Router {url}>
  <div>
    <Route path="/intersections" component={Intersections} />
    <Route path="/journeys" component={Journeys} />
    <Route path="/login" component={Login} />
    <Route path="/"><Dashboard /></Route>
  </div>
</Router>
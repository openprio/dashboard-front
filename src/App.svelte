<script lang="ts">
  import { Router, Link, Route } from "svelte-routing";
  import Dashboard from "./routes/Dashboard.svelte";
  import Login from "./routes/Login.svelte";
  import Intersections from "./routes/Intersections.svelte";
  import IntersectionPerLine from "./routes/Intersectionperline.svelte";
  import IntersectionPerJourney from "./routes/Intersectionperjourney.svelte";
  import Journeys from "./routes/Journeys.svelte";
  import JourneyDetails from "./routes/JourneyDetails.svelte";
  import Stats from "./routes/Stats.svelte";
    import RawData from "./routes/RawData.svelte";



  export let url = "";
</script>


<Router {url}>
  <div>
    <Route path="/intersections/:operation_day/:road_regulator_id/:intersection_id" let:params>
      <IntersectionPerLine operation_day="{params.operation_day}" road_regulator_id="{params.road_regulator_id}" intersection_id="{params.intersection_id}"/>
    </Route>

    <Route path="/intersections/:operation_day/:road_regulator_id/:intersection_id/journeys/:data_owner_code/:line_planning_number/:direction" let:params>
      <IntersectionPerJourney operation_day="{params.operation_day}" road_regulator_id="{params.road_regulator_id}" intersection_id="{params.intersection_id}"
        data_owner_code={params.data_owner_code} line_planning_number={params.line_planning_number} direction={params.direction}
      />
    </Route>

    <Route path="/intersections" component={Intersections} />
    <Route path="/journeys/:dated_journey_id" let:params>
      <JourneyDetails dated_journey_id={params.dated_journey_id}></JourneyDetails>  
    </Route>

    <Route path="/journeys" component={Journeys} />
    <Route path="/stats" component={Stats} />
    <Route path="/raw_data" component={RawData} />
    <Route path="/journeys" component={Journeys} />
    <Route path="/login" component={Login} />
    <Route path="/"><Dashboard /></Route>
  </div>
</Router>
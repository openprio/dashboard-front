<script lang="ts">
    import { onMount } from 'svelte';
    import { Chart} from 'chart.js/auto'
    import {type ChartTypeRegistry, type ChartConfiguration, TimeScale, LinearScale } from 'chart.js';

    Chart.register(TimeScale, LinearScale);

    // Define Props with TypeScript
    let {type, data, options} = $props(); // Chart type

    let chartObject = null;

    function chart(node, data) {
		function setupChart(data) {
			chartObject = new Chart(node, {
        type: type,
        data: data,
        options: options,
      });
		}
		setupChart(data)
		return {
			update(data) {
                console.log("test");
				chartObject.destroy();
                console.log("OK");
                console.log(data);
				setupChart(data);
			},
			destroy() {
				chartObject.destroy();
			}
		}
	}

  </script>
  
  <canvas use:chart={$state.snapshot(data)}></canvas>
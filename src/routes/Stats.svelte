<script lang="ts">
  import { onMount } from "svelte";
  import Navigation from "../components/Navigation.svelte";
  import { getIdToken } from "../auth";
  import Chart from "../components/Chart.svelte";
  import "chartjs-adapter-date-fns";
  import { format, parseISO } from "date-fns";
  import { _adapters, Tooltip } from "chart.js";
  import { nl } from "date-fns/locale";
  import OperatingHoursToggle from "../components/OperatingHoursToggle.svelte";
  import filterOperatingSub from "../components/OperatingHoursStore";

  let filterOperatingHours = $state(false);

  filterOperatingSub.sub((value) => {
    filterOperatingHours = value.valueOf();
  });

  let roadRegulators = $state([]);
  let selectedRoadRegulator = $state(null);

  type OpenPrioDailyStats = {
    operation_date: string;
    journey_total: number;
    journey_intersection_passes: number;
    count_srm_sent: number;
    count_ssm_requested: number;
    count_ssm_processing: number;
    count_ssm_granted: number;
    count_openprio_received: number;
  };

  type OpenPrioMonthlyStats = {
    month: string;
    journey_total: number;
    journey_intersection_passes: number;
    count_srm_sent: number;
    count_ssm_requested: number;
    count_ssm_processing: number;
    count_ssm_granted: number;
    count_openprio_received: number;
  };

  async function loadRoadRegulators() {
    let token = await getIdToken();
    try {
      let response = await fetch(
        "https://dashboard-api.openprio.nl/road_regulators",
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      let data = await response.json();
      roadRegulators = data;
      selectedRoadRegulator = 31075;
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }

  async function loadDailyStats(roadRegulatorId, filterOperatingHours) {
    let token = await getIdToken();
    try {
      let response = await fetch(
        `https://dashboard-api.openprio.nl/stats?agg=daily&road_regulator=${roadRegulatorId}&filter_operating_hours=${filterOperatingHours}`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      let result: OpenPrioDailyStats[] = await response.json();
      let openprio = result.map((dataPoint) => {
        return {
          x: dataPoint.operation_date,
          y: (
            (dataPoint.count_openprio_received /
              dataPoint.journey_intersection_passes) *
            100.0
          ).toFixed(1),
        };
      });
      let srm = result.map((dataPoint) => {
        return {
          x: dataPoint.operation_date,
          y: (
            (dataPoint.count_srm_sent / dataPoint.journey_intersection_passes) *
            100.0
          ).toFixed(1),
        };
      });
      let processing = result.map((dataPoint) => {
        return {
          x: dataPoint.operation_date,
          y: (
            (dataPoint.count_ssm_processing /
              dataPoint.journey_intersection_passes) *
            100.0
          ).toFixed(1),
        };
      });
      let granted = result.map((dataPoint) => {
        return {
          x: dataPoint.operation_date,
          y: (
            (dataPoint.count_ssm_granted /
              dataPoint.journey_intersection_passes) *
            100.0
          ).toFixed(1),
        };
      });

      data.datasets[0].data = openprio;
      data.datasets[1].data = srm;
      data.datasets[2].data = processing;
      data.datasets[3].data = granted;
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }

  async function loadMonthlyStats(roadRegulatorId, filterOperatingHours) {
    let token = await getIdToken();
    try {
      let response = await fetch(
        `https://dashboard-api.openprio.nl/stats?agg=monthly&road_regulator=${roadRegulatorId}&filter_operating_hours=${filterOperatingHours}`,
        {
          headers: {
            Authorization: "Bearer " + token,
          },
        },
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      let result: OpenPrioMonthlyStats[] = await response.json();
      let openprio = result.map((dataPoint) => {
        return {
          x: dataPoint.month,
          y: (
            (dataPoint.count_openprio_received /
              dataPoint.journey_intersection_passes) *
            100.0
          ).toFixed(1),
        };
      });
      let srm = result.map((dataPoint) => {
        return {
          x: dataPoint.month,
          y: (
            (dataPoint.count_srm_sent / dataPoint.journey_intersection_passes) *
            100.0
          ).toFixed(1),
        };
      });
      let processing = result.map((dataPoint) => {
        return {
          x: dataPoint.month,
          y: (
            (dataPoint.count_ssm_processing /
              dataPoint.journey_intersection_passes) *
            100.0
          ).toFixed(1),
        };
      });
      let granted = result.map((dataPoint) => {
        return {
          x: dataPoint.month,
          y: (
            (dataPoint.count_ssm_granted /
              dataPoint.journey_intersection_passes) *
            100.0
          ).toFixed(1),
        };
      });

      data_month_graph.datasets[0].data = openprio;
      data_month_graph.datasets[1].data = srm;
      data_month_graph.datasets[2].data = processing;
      data_month_graph.datasets[3].data = granted;
      console.log(data_month_graph);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  }

  onMount(async () => {
    await loadRoadRegulators();
  });

  $effect(() => {
    if (selectedRoadRegulator) {
      Promise.all([
        loadMonthlyStats(selectedRoadRegulator, filterOperatingHours),
        loadDailyStats(selectedRoadRegulator, filterOperatingHours),
      ]);
    }
  });

  let data = $state({
    datasets: [
      {
        label: "OpenPrio ontvangen [%]",
        data: [],
        backgroundColor: ["#B91C1C"],
        cubicInterpolationMode: "monotone",
        tension: 0.4,
      },
      {
        label: "SRM ontvangen [%]",
        data: [],
        backgroundColor: ["#eab308"],
        cubicInterpolationMode: "monotone",
        tension: 0.4,
      },
      {
        label: "PROCESSING ontvangen [%]",
        data: [],
        backgroundColor: ["#dbeafe"],
        cubicInterpolationMode: "monotone",
        tension: 0.4,
      },
      {
        label: "GRANTED ontvangen [%]",
        data: [],
        backgroundColor: ["#16a34a"],
        cubicInterpolationMode: "monotone",
        tension: 0.4,
      },
    ],
  });

  const options = {
    y: {
      type: "linear", // Linear scale for the y-axis
    },
    plugins: {
      legend: {
        display: true,
        position: "right",
      },
      title: {
        display: true,
        text: "Kruispunt passage statistieken per dag",
      },
    },
    scales: {
      y: {
        ticks: {
          // Include a dollar sign in the ticks
          callback: function (value, index, ticks) {
            return value.toFixed(1) + "%";
          },
        },
      },
      x: {
        type: "time",
        time: {
          unit: "day",
          displayFormats: {
            day: "MMM d", // Customize axis display
          },
          tooltipFormat: "EEEE dd-MM-yyyy",
        },
        adapters: {
          date: {
            locale: nl,
          },
        },
      },
    },
  };

  let data_month_graph = $state({
    datasets: [
      {
        label: "OpenPrio ontvangen [%]",
        data: [],
        backgroundColor: ["#B91C1C"],
        cubicInterpolationMode: "monotone",
        tension: 0.4,
      },
      {
        label: "SRM ontvangen [%]",
        data: [],
        backgroundColor: ["#eab308"],
        cubicInterpolationMode: "monotone",
        tension: 0.4,
      },
      {
        label: "PROCESSING ontvangen [%]",
        data: [],
        backgroundColor: ["#dbeafe"],
        cubicInterpolationMode: "monotone",
        tension: 0.4,
      },
      {
        label: "GRANTED ontvangen [%]",
        data: [],
        backgroundColor: ["#16a34a"],
        cubicInterpolationMode: "monotone",
        tension: 0.4,
      },
    ],
  });

  const options_month_graph = {
    plugins: {
      legend: {
        display: true,
        position: "right",
      },
      title: {
        display: true,
        text: "Kruispunt passage statistieken per maand",
      },
    },
    scales: {
      y: {
        type: "linear", // Linear scale for the y-axis
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          // Include a dollar sign in the ticks
          callback: function (value, index, ticks) {
            return value.toFixed(1) + "%";
          },
        },
      },
      x: {
        type: "time",
        time: {
          unit: "month",
          tooltipFormat: "MMMM Y",
        },
        suggestedMin: new Date(
          new Date().getFullYear() - 1,
          new Date().getMonth(),
          1,
        ).toISOString(),
        adapters: {
          date: {
            locale: nl,
          },
        },
      },
    },
  };
</script>

<div class="flex h-screen flex-col">
  <header class="pb-8">
    <Navigation></Navigation>
  </header>
  <main class="flex-1 overflow-y-auto pt-4">
    <div class="flex flex-row">
      <div class="mx-4 my-2 flex-col">
        <label
          for="road_regulator"
          class="mb-2 block text-sm font-medium text-gray-900 dark:text-white"
          >Wegbeheerder</label
        >
        <select
          id="road_regulator"
          bind:value={selectedRoadRegulator}
          class="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
        >
          {#each roadRegulators as roadRegulator}
            <option value={roadRegulator.road_regulator_id}>
              {roadRegulator.road_regulator_name}
            </option>
          {/each}
        </select>
      </div>
      <div class="mx-4 my-2 flex-col">
        <OperatingHoursToggle></OperatingHoursToggle>
      </div>
    </div>

    <div class="m-4 flex flex-row">
      <div class="grow">
        <Chart type="line" {data} {options}></Chart>
      </div>
      <div class="m-2 w-80">
        <h1 class="text-xl">Uitleg statistiek</h1>

        <p class="mb-4 mt-4 leading-relaxed">
          Voor deze statistiek worden alle kruisingen meegenomen waarvoor
          gedurende een dag ten minste 1 SSM GRANTED is ontvangen. In de
          statistiek wordt per kruispuntpassage weergegeven of er OpenPrio, SRM,
          SSM PROCESSING en SSM GRANTED berichten gezien zijn.
        </p>

        <p class="mb-8 mt-4 leading-relaxed">
          De data in deze statistiek is volledig correct vanaf 18 november 2024,
          data voor 18 november kan indicatief worden gebruikt.
        </p>

        <h2 class="text-lg">Filter</h2>
        <p class="mb-8 mt-4 leading-relaxed">
          In deze statistiek worden alleen ritten opgenomen die starten na het
          moment dat alle verkeerslichten in Delft operationeel zijn en ritten
          die eindigen voor het moment dat de eerste VRI’s worden uitgezet
          (ma-vr 07-21, za 09-21, zo 10-21). Voor Delft zijn alle passages van
          tram 19 uit de statistiek gehaald.
        </p>
      </div>
    </div>

    <div class="m-4 flex flex-row">
      <div class="w-2/3">
        <Chart type="line" data={data_month_graph} options={options_month_graph}
        ></Chart>
      </div>
    </div>
  </main>
</div>

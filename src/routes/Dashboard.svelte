<script lang="ts">
  import {
    MapLibre,
    Marker,
    CircleLayer,
    SymbolLayer,
    GeoJSON,
    LineLayer,
    Popup,
    Control,
    ControlGroup,
    ControlButton,
  } from "svelte-maplibre";
  import type { Feature, FeatureCollection, Point } from "geojson";
  import { userCredential } from "../auth.js";
  import Navigation from "../components/Navigation.svelte";
  import subscribe, {
    environment,
    feedType,
    secondaryPosition,
    subscribe_on_secondary,
    clear_secondary,
  } from "../socket.js";
  import { show_filters } from "../stores/ui.js";
  import Filters from "../components/Filters.svelte";
  import { onMount } from "svelte";
  import { DATA_OWNER_CODES, DATA_OWNER_COLORS } from "../constants.js";
  import { getVehicleRoute } from "../api.js";
  import { nearestPointOnLine } from "@turf/nearest-point-on-line";
  import { lineSliceAlong } from "@turf/line-slice-along";
  import { length } from "@turf/length";

  const STALE_VEHICLE_MS = 60_000;
  const FLUSH_INTERVAL_MS = 100;
  const MAX_LOCATION_HISTORY = 1000;
  const MAX_FEEDBACK_HISTORY = 200;
  const LABEL_MIN_ZOOM = 14;
  // Vehicles are clustered while zoomed out (zoom <= CLUSTER_MAX_ZOOM) and
  // shown individually once zoomed in (zoom > CLUSTER_MAX_ZOOM).
  const CLUSTER_MAX_ZOOM = 9;
  const CLUSTER_RADIUS = 390;

  const VEHICLE_ICON_PREFIX = "vehicle-icon-";
  const DEFAULT_VEHICLE_ICON = "vehicle-icon-default";
  const ICON_CELL = 72;
  const DISC_RADIUS = 11;
  const BEAM_LENGTH = 21;
  const BEAM_HALF_ANGLE = 0.62;

  const CLUSTER_ICON_IDS = [
    "cluster-tier-1",
    "cluster-tier-2",
    "cluster-tier-3",
    "cluster-tier-4",
  ];
  const CLUSTER_COLORS = ["#60a5fa", "#3b82f6", "#2563eb", "#1e40af"];
  const CLUSTER_ICON_CELL = 80;
  const CLUSTER_DISC_RADIUS = 22;

  /**
   * Full location messages keyed by `dataOwnerCode:vehicleNumber`, so updates
   * are O(1) instead of a linear scan over every vehicle.
   * @type {Map<string, { message: LocationMessage, lastSeen: number }>}
   */
  const vehiclesById = new Map();

  let vehiclesFlushDirty = false;

  let vehiclesGeoJSON: FeatureCollection = $state({
    type: "FeatureCollection",
    features: [],
  });

  let map = $state(null);

  /**
   * @type {LocationMessage|null}
   */
  let selectedVehicle = $state(null);

  function hexAlpha(hex, alpha) {
    const value = hex.replace("#", "");
    const r = parseInt(value.slice(0, 2), 16);
    const g = parseInt(value.slice(2, 4), 16);
    const b = parseInt(value.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  /**
   * "Il faro": a colored disc with the line number inside, plus a soft
   * directional beam pointing forward so the bearing is readable while the
   * marker itself stays a clean circle (inspired by map.busone.app).
   */
  function drawVehicleCanvas(fill, selected) {
    const ratio = 2;
    const canvas = document.createElement("canvas");
    canvas.width = ICON_CELL * ratio;
    canvas.height = ICON_CELL * ratio;
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.translate(ICON_CELL / 2, ICON_CELL / 2);

    const reach = DISC_RADIUS + BEAM_LENGTH;
    const beam = ctx.createRadialGradient(0, 0, DISC_RADIUS * 0.8, 0, 0, reach);
    beam.addColorStop(0, hexAlpha(fill, 0.55));
    beam.addColorStop(0.55, hexAlpha(fill, 0.28));
    beam.addColorStop(1, hexAlpha(fill, 0));
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(
      0,
      0,
      reach,
      -Math.PI / 2 - BEAM_HALF_ANGLE,
      -Math.PI / 2 + BEAM_HALF_ANGLE,
    );
    ctx.closePath();
    ctx.fillStyle = beam;
    ctx.fill();

    ctx.shadowColor = "rgba(0,0,0,0.32)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, DISC_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.shadowColor = "transparent";

    ctx.lineWidth = selected ? 3.5 : 2;
    ctx.strokeStyle = selected ? "#111827" : "rgba(255,255,255,0.95)";
    ctx.beginPath();
    ctx.arc(0, 0, DISC_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    if (selected) {
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "rgba(255,255,255,0.95)";
      ctx.beginPath();
      ctx.arc(0, 0, DISC_RADIUS + 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    return canvas;
  }

  function drawVehicleIcon(fill, selected) {
    const canvas = drawVehicleCanvas(fill, selected);
    return canvas
      .getContext("2d")
      .getImageData(0, 0, canvas.width, canvas.height);
  }

  const secondaryMarkerIcon = drawVehicleCanvas("#2563eb", false).toDataURL();

  function vehicleImages() {
    const specs = [];
    for (const code of DATA_OWNER_CODES) {
      const color = DATA_OWNER_COLORS[code] ?? "#374151";
      specs.push({
        id: `${VEHICLE_ICON_PREFIX}${code}`,
        data: drawVehicleIcon(color, false),
        options: { pixelRatio: 2 },
      });
      specs.push({
        id: `${VEHICLE_ICON_PREFIX}${code}-selected`,
        data: drawVehicleIcon(color, true),
        options: { pixelRatio: 2 },
      });
    }
    specs.push({
      id: DEFAULT_VEHICLE_ICON,
      data: drawVehicleIcon("#374151", false),
      options: { pixelRatio: 2 },
    });
    specs.push({
      id: `${DEFAULT_VEHICLE_ICON}-selected`,
      data: drawVehicleIcon("#374151", true),
      options: { pixelRatio: 2 },
    });
    return specs;
  }

  /**
   * Cluster symbol: a solid disc with a soft halo baked in. Rendered as a
   * symbol (not a circle layer) so MapLibre's placement engine drops any
   * cluster that would overlap another one.
   */
  function drawClusterIcon(fill) {
    const ratio = 2;
    const canvas = document.createElement("canvas");
    canvas.width = CLUSTER_ICON_CELL * ratio;
    canvas.height = CLUSTER_ICON_CELL * ratio;
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.translate(CLUSTER_ICON_CELL / 2, CLUSTER_ICON_CELL / 2);

    ctx.beginPath();
    ctx.arc(0, 0, CLUSTER_DISC_RADIUS + 7, 0, Math.PI * 2);
    ctx.fillStyle = hexAlpha(fill, 0.18);
    ctx.fill();

    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetY = 1.5;
    ctx.beginPath();
    ctx.arc(0, 0, CLUSTER_DISC_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.shadowColor = "transparent";

    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.beginPath();
    ctx.arc(0, 0, CLUSTER_DISC_RADIUS, 0, Math.PI * 2);
    ctx.stroke();

    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }

  function clusterIconSpecs() {
    return CLUSTER_ICON_IDS.map((id, index) => ({
      id,
      data: drawClusterIcon(CLUSTER_COLORS[index]),
      options: { pixelRatio: 2 },
    }));
  }

  const mapIconSpecs = [...vehicleImages(), ...clusterIconSpecs()];

  function vehicleIdOf(message) {
    return (
      message.vehicleDescriptor.dataOwnerCode +
      ":" +
      message.vehicleDescriptor.vehicleNumber
    );
  }

  function vehicleIconFor(dataOwnerCode, selected) {
    const base =
      DATA_OWNER_COLORS[dataOwnerCode] != null
        ? `${VEHICLE_ICON_PREFIX}${dataOwnerCode}`
        : DEFAULT_VEHICLE_ICON;
    return selected ? `${base}-selected` : base;
  }

  function vehicleLabel(message) {
    const line =
      message.vehicleDescriptor.journeyDescriptor?.linePlanningNumber;
    if (line != null && line !== 0) {
      return String(line);
    }
    return message.vehicleDescriptor.dataOwnerCode;
  }

  function buildVehicleFeatures() {
    const now = Date.now();
    const features = [];
    for (const [id, entry] of vehiclesById) {
      if (now - entry.lastSeen > STALE_VEHICLE_MS) {
        vehiclesById.delete(id);
        continue;
      }
      const { position, vehicleDescriptor } = entry.message;
      if (position.longitude === 0 && position.latitude === 0) {
        continue;
      }
      const selected = selectedVehicleIdentity === id ? 1 : 0;
      features.push({
        type: "Feature",
        id,
        geometry: {
          type: "Point",
          coordinates: [position.longitude, position.latitude],
        },
        properties: {
          id,
          number: vehicleDescriptor.vehicleNumber,
          icon: vehicleIconFor(vehicleDescriptor.dataOwnerCode, selected === 1),
          selected,
          bearing: position.bearing ?? 0,
          label: vehicleLabel(entry.message),
        },
      });
    }
    return features;
  }

  function flushVehicles() {
    if (!vehiclesFlushDirty) {
      return;
    }
    vehiclesFlushDirty = false;
    vehiclesGeoJSON = {
      type: "FeatureCollection",
      features: buildVehicleFeatures(),
    };
  }

  function selectVehicle(message) {
    selectedVehicle = message;
    vehiclesFlushDirty = true;
    subscribe_on_secondary(
      message.vehicleDescriptor.dataOwnerCode,
      message.vehicleDescriptor.vehicleNumber,
    );
    resetLocationHistory();
  }

  function handleVehicleClick(event) {
    const feature = event.detail?.features?.[0];
    if (!feature) {
      return;
    }
    const id =
      feature.id != null
        ? String(feature.id)
        : feature.properties?.id != null
          ? String(feature.properties.id)
          : undefined;
    const entry = id != null ? vehiclesById.get(id) : null;
    if (entry) {
      selectVehicle(entry.message);
    }
  }

  function handleClusterClick(event) {
    const feature = event.detail?.features?.[0];
    const clusterId = feature?.properties?.cluster_id;
    if (clusterId == null || map == null) {
      return;
    }
    const source = map.getSource("vehicles");
    if (source == null) {
      return;
    }
    source.getClusterExpansionZoom(clusterId, (error, zoom) => {
      if (error) {
        return;
      }
      map.easeTo({
        center: feature.geometry.coordinates,
        zoom,
      });
    });
  }

  /**
   * @type {any[]}
   */
  let feedbackHistory = $state([]);

  let locationHistory = $state([]);

  let filter_intersection = $state(null);

  // Create a FeatureCollection
  let locationHistoryGeoJSON: FeatureCollection = $state({
    type: "FeatureCollection",
    features: [],
  });

  let intersectionsGeoJSON: FeatureCollection = $state({
    type: "FeatureCollection",
    features: [],
  });

  let pulseMarkers = $state([]);

  let intersectionsById = new Map();

  let filteredFeedbackHistory = $derived(
    filter_intersection == null
      ? feedbackHistory
      : feedbackHistory.filter(
          (feedbackItem) => feedbackItem.tlc_id === filter_intersection,
        ),
  );
  let secondaryMarker = $derived(
    $secondaryPosition != null &&
      selectedVehicle != null &&
      $secondaryPosition.vehicleDescriptor.dataOwnerCode +
        ":" +
        $secondaryPosition.vehicleDescriptor.vehicleNumber ==
        selectedVehicle.vehicleDescriptor.dataOwnerCode +
          ":" +
          selectedVehicle.vehicleDescriptor.vehicleNumber
      ? $secondaryPosition
      : null,
  );

  let secondaryBadge = $derived($feedType === "position" ? "P+" : "P");

  let vehicleRoute = $state(null);

  let selectedVehicleIdentity = $derived(
    selectedVehicle == null
      ? null
      : selectedVehicle.vehicleDescriptor.dataOwnerCode +
          ":" +
          selectedVehicle.vehicleDescriptor.vehicleNumber,
  );

  let emptyFeatureCollection = () => ({
    type: "FeatureCollection",
    features: [],
  });

  let routeLinesGeoJSON = $derived.by(() => {
    if (vehicleRoute == null || selectedVehicle == null) {
      return emptyFeatureCollection();
    }
    const route = vehicleRoute.route;
    if (
      route == null ||
      route.type !== "LineString" ||
      route.coordinates.length < 2
    ) {
      return emptyFeatureCollection();
    }
    const point = [
      selectedVehicle.position.longitude,
      selectedVehicle.position.latitude,
    ];
    const nearest = nearestPointOnLine(route, point);
    const dist = nearest.properties.totalDistance ?? nearest.properties.location;
    const totalLen = length(route, { units: "kilometers" });
    const features = [];
    const past = lineSliceAlong(route, 0, dist, { units: "kilometers" });
    const ahead = lineSliceAlong(route, dist, totalLen, {
      units: "kilometers",
    });
    if (past.geometry.coordinates.length >= 2) {
      features.push({
        type: "Feature",
        geometry: past.geometry,
        properties: { color: "#9ca3af" },
      });
    }
    if (ahead.geometry.coordinates.length >= 2) {
      features.push({
        type: "Feature",
        geometry: ahead.geometry,
        properties: { color: "#2563eb" },
      });
    }
    return { type: "FeatureCollection", features };
  });

  let trackPointsGeoJSON = $derived.by(() => {
    if (vehicleRoute == null) {
      return emptyFeatureCollection();
    }
    return {
      type: "FeatureCollection",
      features: (vehicleRoute.actual_track ?? []).map(
        ([longitude, latitude]) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [longitude, latitude] },
          properties: {},
        }),
      ),
    };
  });

  $effect(() => {
    const identity = selectedVehicleIdentity;
    if (identity == null) {
      vehicleRoute = null;
      return;
    }
    const split = identity.split(":");
    const dataOwnerCode = split[0];
    const vehicleNumber = split[1];
    let cancelled = false;
    const load = async () => {
      try {
        const result = await getVehicleRoute(dataOwnerCode, vehicleNumber);
        if (!cancelled) {
          vehicleRoute = result;
        }
      } catch (error) {
        console.error("Failed to fetch vehicle route:", error);
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  });

  $effect(() => {
    $environment;
    $feedType;
    vehiclesById.clear();
    vehiclesFlushDirty = true;
    selectedVehicle = null;
    feedbackHistory = [];
    locationHistory = [];
    vehicleRoute = null;
    locationHistoryGeoJSON = {
      type: "FeatureCollection",
      features: [],
    };
    clear_secondary();
  });

  onMount(async () => {
    try {
      const response = await fetch(
        "https://dashboard-api.openprio.nl/intersections",
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const intersections = await response.json();
      let features = intersections.map((intersection) => {
        const point: Feature<Point> = {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [intersection.longitude, intersection.latitude],
          },
          properties: {
            color: intersectionColor(intersection),
            road_regulator_id: intersection.road_regulator_id,
            intersection_id: intersection.intersection_id,
            intersection_name: intersection.intersection_name,
            tlc_id: intersection.tlc_id,
            tlc_alias: intersection.tlc_alias,
            pbc_configuration: intersection.pbc_configuration,
            use_cases: intersection.use_cases,
          },
        };
        intersectionsById.set(
          `${intersection.road_regulator_id}:${intersection.intersection_id}`,
          {
            longitude: intersection.longitude,
            latitude: intersection.latitude,
          },
        );
        return point;
      });
      intersectionsGeoJSON = {
        type: "FeatureCollection",
        features: features,
      };
    } catch (error) {
      console.error("Failed to fetch intersections:", error);
    }
  });

  onMount(() => {
    const unsubscribe = subscribe.subscribe(
      /**
       * @param {LocationMessage} currentMessage
       */
      (currentMessage) => {
        if (!currentMessage) {
          return;
        }
        const vehicleId = vehicleIdOf(currentMessage);
        vehiclesById.set(vehicleId, {
          message: currentMessage,
          lastSeen: Date.now(),
        });
        vehiclesFlushDirty = true;

        if (selectedVehicleIdentity === vehicleId) {
          selectedVehicle = currentMessage;
          let historyPoint: Feature<Point> = {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [
                currentMessage.position.longitude,
                currentMessage.position.latitude,
              ],
            },
            properties: {
              name: "Sample Point",
            },
          };
          locationHistory.push(historyPoint);
          if (locationHistory.length > MAX_LOCATION_HISTORY) {
            locationHistory.splice(
              0,
              locationHistory.length - MAX_LOCATION_HISTORY,
            );
          }
        }
      },
    );

    const flushInterval = setInterval(flushVehicles, FLUSH_INTERVAL_MS);

    return () => {
      unsubscribe();
      clearInterval(flushInterval);
    };
  });

  onMount(() => {
    const unsubscribe = subscribe.feedback((feedbackMessage) => {
      if (feedbackMessage) {
        feedbackHistory.unshift(feedbackMessage);
        if (feedbackHistory.length > MAX_FEEDBACK_HISTORY) {
          feedbackHistory.length = MAX_FEEDBACK_HISTORY;
        }

        let currentMessage = feedbackMessage.last_openprio_position;
        if (currentMessage?.position == null) {
          return;
        }
        let historyPoint: Feature<Point> = {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [
              currentMessage.position.longitude,
              currentMessage.position.latitude,
            ],
          },
          properties: {
            type_of_message: feedbackMessage.type_of_msg,
            "border-color": numberToColorHex(feedbackMessage.tlc_id),
            color: getFeedbackColor(feedbackMessage),
            tlc_id: feedbackMessage.tlc_id,
          },
        };
        locationHistory.push(historyPoint);
        if (locationHistory.length > MAX_LOCATION_HISTORY) {
          locationHistory.splice(
            0,
            locationHistory.length - MAX_LOCATION_HISTORY,
          );
        }
        locationHistoryGeoJSON = {
          type: "FeatureCollection",
          features: locationHistory,
        };

        pulseAtIntersection(
          feedbackMessage.tlc_region,
          feedbackMessage.tlc_id,
          getFeedbackColor(feedbackMessage),
        );
      }
    });

    return unsubscribe;
  });

  function resetLocationHistory() {
    feedbackHistory = [];
    locationHistory = [];
    locationHistoryGeoJSON = {
      type: "FeatureCollection",
      features: locationHistory,
    };
  }

  function intersectionColor(intersection) {
    if (!intersection.has_pbc_road_operator) {
      return "#9ca3af";
    }
    if (!intersection.has_granted_today) {
      return "#b91c1c";
    }
    return numberToColorHex(intersection.intersection_id);
  }

  function pulseAtIntersection(roadRegulatorId, intersectionId, color) {
    const intersection = intersectionsById.get(
      `${roadRegulatorId}:${intersectionId}`,
    );
    if (!intersection) {
      return;
    }
    const pulse = {
      id: `${roadRegulatorId}:${intersectionId}:${Date.now()}`,
      lngLat: [intersection.longitude, intersection.latitude],
      color,
    };
    pulseMarkers.push(pulse);
    setTimeout(() => {
      pulseMarkers = pulseMarkers.filter((p) => p.id !== pulse.id);
    }, 2000);
  }

  function getFeedbackColor(msg) {
    if (msg.type_of_msg == "srm") {
      return srm_to_color(msg.request_type);
    }
    if (msg.pbc_rejection != "NO_ERROR") {
      return "#dc2626";
    }
    return ssm_to_color(msg.prioritization_response_status);
  }

  function ssm_to_color(prioritization_response_status) {
    if (prioritization_response_status == "GRANTED") {
      return "#16a34a";
    }
    if (prioritization_response_status == "REQUESTED") {
      return "#bbf7d0";
    }
    if (prioritization_response_status == "REJECTED") {
      return "#b91c1c";
    }
    return "#dbeafe";
  }

  function srm_to_color(request_type) {
    if (request_type == "priorityRequestNew") {
      return "#4ade80";
    }
    if (request_type == "priorityRequestUpdate") {
      return "#eab308";
    }
    return "#ef4444";
  }

  function toIsoString(date) {
    var tzo = -date.getTimezoneOffset(),
      dif = tzo >= 0 ? "+" : "-",
      pad = function (num) {
        return (num < 10 ? "0" : "") + num;
      };

    return (
      date.getFullYear() +
      "-" +
      pad(date.getMonth() + 1) +
      "-" +
      pad(date.getDate()) +
      "T" +
      pad(date.getHours()) +
      ":" +
      pad(date.getMinutes()) +
      ":" +
      pad(date.getSeconds()) +
      dif +
      pad(Math.floor(Math.abs(tzo) / 60)) +
      ":" +
      pad(Math.abs(tzo) % 60)
    );
  }

  function formatTimeNicelyFirst(time) {
    let timestamp = new Date(time);
    return (
      timestamp.getHours().toString().padStart(2, "0") +
      ":" +
      timestamp.getMinutes().toString().padStart(2, "0") +
      ":"
    );
  }

  function formatTimeNicelySecond(time) {
    let timestamp = new Date(time);
    return (
      timestamp.getSeconds().toString().padStart(2, "0") +
      "." +
      Math.floor(timestamp.getMilliseconds() / 100)
    );
  }

  function formatTimeNicely(time) {
    return formatTimeNicelyFirst(time) + formatTimeNicelySecond(time);
  }

  function doorStatus(doorStatus: number) {
    switch (doorStatus) {
      case 1: {
        return "Closed";
      }
      case 2: {
        return "Open";
      }
      case 3: {
        return "Released";
      }
      default: {
        return "Unknown";
      }
    }
  }

  function numberToColorHex(number) {
    let colors = [
      "#e6194b",
      "#3cb44b",
      "#ffe119",
      "#4363d8",
      "#f58231",
      "#911eb4",
      "#46f0f0",
      "#f032e6",
      "#bcf60c",
      "#fabebe",
      "#008080",
      "#e6beff",
      "#9a6324",
      "#fffac8",
      "#800000",
      "#aaffc3",
      "#808000",
      "#ffd8b1",
      "#000075",
      "#808080",
      "#000000",
    ];
    return colors[number % colors.length];
  }

  function numberToColor(num) {
    return `border-color: ${numberToColorHex(num)};`;
  }

  function vehicleDirection(doorStatus: number) {
    switch (doorStatus) {
      case 1: {
        return "A";
      }
      case 2: {
        return "B";
      }
      default: {
        return "Undefined";
      }
    }
  }
</script>

<div class="flex h-screen flex-col">
  <header class="pb-8">
    <Navigation></Navigation>
  </header>
  <main class="flex-1 overflow-y-auto pt-4">
    <div class="flex flex-col md:flex-row">
      <Filters></Filters>
      <MapLibre
        bind:map
        center={[5.2913, 52.1326]}
        zoom={8}
        class="mt-6 h-[94vh] w-full md:mt-0"
        standardControls
        images={mapIconSpecs}
        style={"https://api.maptiler.com/maps/52e8038c-e9df-4d0e-a6cc-1269d04c9c19/style.json?key=wMttElGnvszMrzou5eQJ"}
      >
        <Control position="top-left">
          <ControlGroup>
            <ControlButton
              title={"Filters openen — feed: " +
                ($feedType === "position" ? "Position" : "Position-plus")}
              on:click={() => show_filters.update((value) => !value)}
            >
              <div class="relative">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#333"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="2" y1="12" x2="22" y2="12" />
                  <path
                    d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"
                  />
                </svg>
                <span
                  class="absolute -right-1 -top-1 h-2 w-2 rounded-full {$feedType ===
                  'position-plus'
                    ? 'bg-blue-600'
                    : 'bg-gray-500'}"
                ></span>
              </div>
            </ControlButton>
          </ControlGroup>
        </Control>
        <GeoJSON id="positions" data={locationHistoryGeoJSON}>
          <CircleLayer
            id="cluster_circles"
            interactive={false}
            applyToClusters={false}
            paint={{
              // Use step expressions (https://maplibre.org/maplibre-gl-js-docs/style-spec/#expressions-step)
              // with three steps to implement three types of circles:
              //   * Blue, 20px circles when point count is less than 100
              //   * Yellow, 30px circles when point count is between 100 and 750
              //   * Pink, 40px circles when point count is greater than or equal to 750
              "circle-color": ["get", "color"],
              "circle-stroke-color": ["get", "border-color"],
              "circle-stroke-width": ["case", ["has", "type_of_message"], 1, 0],
              "circle-radius": [
                "case",
                ["==", ["get", "type_of_message"], "ssm"],
                8,
                ["==", ["get", "type_of_message"], "srm"],
                4,
                2,
              ],
            }}
          />
        </GeoJSON>

        <GeoJSON id="intersections" data={intersectionsGeoJSON}>
          <CircleLayer
            id="intersection_circles"
            paint={{
              "circle-color": ["get", "color"],
              "circle-radius": 6,
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": 1,
            }}
          >
            <Popup openOn="click" closeOnClickOutside>
              {#if data}
                <div class="text-sm">
                  <div class="font-medium">{data.properties.intersection_name}</div>
                  <div>TLC: {data.properties.tlc_id}</div>
                  <div>TLC alias: {data.properties.tlc_alias ?? "-"}</div>
                  <div>
                    PBC: {data.properties.pbc_configuration?.length
                      ? data.properties.pbc_configuration.join(", ")
                      : "-"}
                  </div>
                  <div>
                    Use cases: {data.properties.use_cases?.length
                      ? data.properties.use_cases.join(", ")
                      : "-"}
                  </div>
                </div>
              {/if}
            </Popup>
          </CircleLayer>
        </GeoJSON>

        <GeoJSON
          id="vehicles"
          data={vehiclesGeoJSON}
          cluster={{ radius: CLUSTER_RADIUS, maxZoom: CLUSTER_MAX_ZOOM }}
        >
          <SymbolLayer
            id="vehicle-clusters"
            filter={["has", "point_count"]}
            hoverCursor="pointer"
            on:click={handleClusterClick}
            layout={{
              "icon-image": [
                "step",
                ["get", "point_count"],
                "cluster-tier-1",
                25,
                "cluster-tier-2",
                100,
                "cluster-tier-3",
                500,
                "cluster-tier-4",
              ],
              "icon-size": [
                "step",
                ["get", "point_count"],
                0.62,
                25,
                0.74,
                100,
                0.86,
                500,
                1,
              ],
              "icon-allow-overlap": true,
              "text-field": ["get", "point_count_abbreviated"],
              "text-size": [
                "step",
                ["get", "point_count"],
                11,
                25,
                12,
                100,
                13,
                500,
                14,
              ],
              "text-allow-overlap": true,
              "text-ignore-placement": true,
            }}
            paint={{
              "text-color": "#ffffff",
              "text-halo-color": "rgba(17,24,39,0.35)",
              "text-halo-width": 0.8,
            }}
          />
          <SymbolLayer
            id="vehicle-symbols"
            filter={["!", ["has", "point_count"]]}
            minzoom={CLUSTER_MAX_ZOOM}
            hoverCursor="pointer"
            on:click={handleVehicleClick}
            layout={{
              "icon-image": ["get", "icon"],
              "icon-rotate": ["get", "bearing"],
              "icon-rotation-alignment": "map",
              "icon-allow-overlap": true,
              "icon-ignore-placement": true,
              "symbol-sort-key": [
                "+",
                ["*", ["get", "selected"], 1000000000],
                ["get", "number"],
              ],
              "icon-size": [
                "interpolate",
                ["linear"],
                ["zoom"],
                6,
                0.5,
                10,
                0.62,
                13,
                0.72,
                16,
                0.86,
                19,
                1,
              ],
            }}
          />
          <SymbolLayer
            id="vehicle-labels"
            filter={["!", ["has", "point_count"]]}
            interactive={false}
            minzoom={LABEL_MIN_ZOOM}
            layout={{
              "text-field": ["get", "label"],
              "text-size": [
                "interpolate",
                ["linear"],
                ["zoom"],
                10,
                8.5,
                14,
                10.5,
                18,
                12,
              ],
              "text-allow-overlap": true,
              "text-ignore-placement": true,
              "symbol-sort-key": [
                "+",
                ["*", ["get", "selected"], 1000000000],
                ["get", "number"],
              ],
            }}
            paint={{
              "text-color": "#ffffff",
              "text-halo-color": "rgba(17,24,39,0.6)",
              "text-halo-width": 0.8,
            }}
          />
        </GeoJSON>

        {#each pulseMarkers as pulse (pulse.id)}
          <Marker
            lngLat={pulse.lngLat}
            class="pointer-events-none z-20 grid place-items-center"
          >
            <div
              class="h-5 w-5 animate-ping rounded-full border-2 [animation-duration:2s]"
              style={`border-color: ${pulse.color};`}
            ></div>
          </Marker>
        {/each}

        {#if vehicleRoute != null}
          <GeoJSON id="vehicle-route" data={routeLinesGeoJSON}>
            <LineLayer
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={{
                "line-color": ["get", "color"],
                "line-width": 4,
                "line-opacity": 0.85,
              }}
            />
          </GeoJSON>
          <GeoJSON id="vehicle-track" data={trackPointsGeoJSON}>
            <CircleLayer
              applyToClusters={false}
              paint={{
                "circle-color": "#374151",
                "circle-radius": 3,
                "circle-stroke-color": "#ffffff",
                "circle-stroke-width": 1,
              }}
            />
          </GeoJSON>
        {/if}

        {#if secondaryMarker}
          <Marker
            lngLat={[
              secondaryMarker.position.longitude,
              secondaryMarker.position.latitude,
            ]}
            class="pointer-events-none relative z-20 grid h-[72px] w-[72px] place-items-center"
          >
            <div class="relative grid h-[72px] w-[72px] place-items-center">
              <img
                src={secondaryMarkerIcon}
                alt=""
                class="h-[72px] w-[72px] transition-transform duration-300"
                style="transform: rotate({secondaryMarker.position
                  .bearing}deg);"
              />
              <span
                class="absolute select-none text-[10px] font-bold text-white [text-shadow:0_0_3px_rgba(17,24,39,0.7)]"
                >{secondaryBadge}</span
              >
            </div>
          </Marker>
        {/if}
      </MapLibre>
      {#if selectedVehicle}
        <div
          class="absolute bottom-0 z-30 flex w-full flex-col bg-gray-100 md:static md:w-auto md:flex-row"
        >
          <button
            class="group flex h-6 w-full items-center justify-center bg-gray-400 text-white hover:bg-gray-700 md:h-full md:w-5"
            onclick={() => {
              selectedVehicle = null;
              vehiclesFlushDirty = true;
              clear_secondary();
            }}
          >
            <div class="rotate-90 md:rotate-0">
              <div
                class="h-0 w-0 rotate-90
                      border-b-[10px] border-l-[4px]
                      border-r-[4px] border-b-gray-800 border-l-transparent
                      border-r-transparent group-hover:border-b-white"
              ></div>
            </div>
          </button>
          <div class="flex h-[94vh] w-80 flex-col gap-2 p-4 text-sm shadow">
            <div class="flex flex-col justify-center">
              <h2 class="text-lg font-bold">Voertuiginformatie</h2>
              <div class="h-[2px] w-full bg-blue-500"></div>
            </div>
            <div class="flex flex-col">
              <h1 class="text-lg font-bold">Deurstatus</h1>
              <div class="flex items-center justify-between gap-2">
                {#if selectedVehicle.doorStatus == 2}
                  <span class="h-4 w-96 bg-green-500"></span>
                {:else if selectedVehicle.doorStatus == 1}
                  <span class="h-4 w-96 bg-red-500"></span>
                {:else if selectedVehicle.doorStatus == 3}
                  <span class="h-4 w-96 bg-yellow-500"></span>
                {:else}
                  <span class="h-4 w-96 bg-gray-200"></span>
                {/if}
                {doorStatus(selectedVehicle.doorStatus)}
              </div>
            </div>
            <div class="flex flex-col">
              <h1 class="text-lg font-bold">Voertuigbeschrijving</h1>
              <div class="flex flex-col">
                <div class="flex justify-between gap-2">
                  <h3>DataOwnerCode</h3>
                  <span>{selectedVehicle.vehicleDescriptor.dataOwnerCode}</span>
                </div>
                <div class="flex justify-between gap-2">
                  <h3>VehicleNumber</h3>
                  <span>{selectedVehicle.vehicleDescriptor.vehicleNumber}</span>
                </div>
                <div class="flex justify-between gap-2">
                  <h3>BlockCode</h3>
                  <span>{selectedVehicle.vehicleDescriptor.blockCode}</span>
                </div>
                <div class="flex justify-between gap-2">
                  <h3>Actieve cabine</h3>
                  <span
                    >{vehicleDirection(
                      selectedVehicle.vehicleDescriptor.drivingDirection,
                    )}</span
                  >
                </div>
                <div class="flex justify-between gap-2">
                  <h3>Aantal gekoppelde voertuigen</h3>
                  <span
                    >{selectedVehicle.vehicleDescriptor
                      .numberOfVehiclesCoupled}</span
                  >
                </div>
              </div>
            </div>
            <div class="flex flex-col">
              <h1 class="text-lg font-bold">Positie</h1>
              <div class="flex flex-col">
                <div class="flex justify-between gap-2">
                  <h3>Latitude</h3>
                  <span>{selectedVehicle.position.latitude.toFixed(6)}</span>
                </div>
                <div class="flex justify-between gap-2">
                  <h3>Longitude</h3>
                  <span>{selectedVehicle.position.longitude.toFixed(6)}</span>
                </div>
                <div class="flex justify-between gap-2">
                  <h3>Snelheid</h3>
                  <span
                    >{(selectedVehicle.position.speed * 3.6).toFixed(
                      0,
                    )}km/h</span
                  >
                </div>
                <div class="flex justify-between gap-2">
                  <h3>Bearing</h3>
                  <span>{selectedVehicle.position.bearing.toFixed(1)}deg</span>
                </div>
                <div class="flex justify-between gap-2">
                  <h3>Hdop</h3>
                  <span>{selectedVehicle.position.hdop.toFixed(2)}</span>
                </div>
                <div class="flex justify-between gap-2">
                  <h3>Aantal satellieten</h3>
                  <span
                    >{selectedVehicle.position.numberOfReceivedSatellites}</span
                  >
                </div>
                <div class="flex justify-between gap-2">
                  <h3>Nauwkeurigheid</h3>
                  <span>{selectedVehicle.position.accuracy}</span>
                </div>
                <div class="flex justify-between gap-2">
                  <h3>Odometer</h3>
                  <span>{selectedVehicle.position.odometer}m</span>
                </div>
              </div>
            </div>
            <div class="flex flex-col">
              <h1 class="text-lg font-bold">Timestamp</h1>
              <span>{toIsoString(new Date(selectedVehicle.timestamp))}</span>
              <div class="flex justify-between gap-2">
                <h3>Latency</h3>
                <span>{new Date().getTime() - selectedVehicle.timestamp}ms</span
                >
              </div>
            </div>
            {#if selectedVehicle.vehicleDescriptor.journeyDescriptor != null}
              <div class="flex flex-col">
                <h1 class="text-lg font-bold">Rit</h1>
                <div class="flex flex-col">
                  <div class="flex justify-between gap-2">
                    <h3>LinePlanningNumber</h3>
                    <span
                      >{selectedVehicle.vehicleDescriptor.journeyDescriptor
                        .linePlanningNumber}</span
                    >
                  </div>
                  <div class="flex justify-between gap-2">
                    <h3>JourneyNumber</h3>
                    <span
                      >{selectedVehicle.vehicleDescriptor.journeyDescriptor
                        .journeyNumber}</span
                    >
                  </div>
                  <div class="flex justify-between gap-2">
                    <h3>OperationDay</h3>
                    <span
                      >{selectedVehicle.vehicleDescriptor.journeyDescriptor
                        .operatingDay}</span
                    >
                  </div>
                </div>
              </div>
            {/if}
            {#if vehicleRoute != null && vehicleRoute.journey != null}
              <div class="flex flex-col">
                <h1 class="text-lg font-bold">Route</h1>
                <div class="flex flex-col">
                  <div class="flex justify-between gap-2">
                    <h3>Lijn</h3>
                    <span>{vehicleRoute.journey.line_planning_number}</span>
                  </div>
                  <div class="flex justify-between gap-2">
                    <h3>Ritnummer</h3>
                    <span>{vehicleRoute.journey.journey_number}</span>
                  </div>
                  <div class="flex justify-between gap-2">
                    <h3>Richting</h3>
                    <span>{vehicleRoute.journey.direction}</span>
                  </div>
                </div>
              </div>
            {/if}
          </div>
          {#if $userCredential}
            <div
              class="flex h-[94vh] w-96 flex-col gap-2 overflow-y-scroll p-4 text-sm shadow"
            >
              <div class="flex flex-col justify-center">
                <div class="m-1 flex flex-row justify-between">
                  <h2 class="text-lg font-bold">Log (SRM + SSM)</h2>
                  {#if filter_intersection != null}
                    <button
                      class="rounded border border-r-8 p-0.5 text-sm"
                      style={numberToColor(filter_intersection)}
                      onclick={() => {
                        filter_intersection = null;
                      }}
                    >
                      {filter_intersection}</button
                    >
                  {/if}
                </div>
                <div class="h-[2px] w-full bg-blue-500"></div>
              </div>
              {#each filteredFeedbackHistory as historyItem}
                <div class="w-full rounded bg-gray-200 p-4">
                  <div class="flex flex-row justify-between">
                    <div>
                      <span class="align-top text-xs"
                        >{formatTimeNicelyFirst(historyItem.timestamp)}</span
                      ><span class="align-top text-base"
                        >{formatTimeNicelySecond(historyItem.timestamp)}</span
                      >
                    </div>
                    <button
                      class="rounded border border-r-8 p-0.5 text-sm"
                      style={numberToColor(historyItem.tlc_id)}
                      onclick={() => {
                        filter_intersection = historyItem.tlc_id;
                      }}>{historyItem.tlc_id}</button
                    >
                    {#if historyItem.type_of_msg == "srm"}
                      <div class="flex flex-row">
                        <div
                          class="rounded-l border-b border-l border-t border-gray-500 bg-white p-0.5 text-sm"
                        >
                          SRM
                        </div>
                        {#if historyItem.request_type == "priorityRequestNew"}
                          <div class="rounded-r bg-green-400 p-0.5 text-sm">
                            NEW
                          </div>
                        {:else if historyItem.request_type == "priorityRequestUpdate"}
                          <div class="rounded-r bg-yellow-500 p-0.5 text-sm">
                            UPDATE
                          </div>
                        {:else}
                          <div class="rounded-r bg-red-500 p-0.5 text-sm">
                            CANCEL
                          </div>
                        {/if}
                      </div>
                    {:else if historyItem.type_of_msg == "ssm"}
                      <div class="flex flex-row">
                        <div
                          class="rounded-l border-b border-l border-t border-gray-500 bg-white p-0.5 text-sm"
                        >
                          SSM
                        </div>
                        {#if historyItem.prioritization_response_status == "GRANTED"}
                          <div class="rounded-r bg-green-600 p-1 text-sm">
                            {historyItem.prioritization_response_status}
                          </div>
                        {:else if historyItem.prioritization_response_status == "REQUESTED"}
                          <div class="rounded-r bg-green-200 p-1 text-sm">
                            {historyItem.prioritization_response_status}
                          </div>
                        {:else if historyItem.prioritization_response_status == "REJECTED"}
                          <div class="rounded-r bg-red-700 p-1 text-sm">
                            {historyItem.prioritization_response_status}
                          </div>
                        {:else if historyItem.pbc_rejection != "NO_ERROR"}
                          <div class="rounded-r bg-red-600 p-1 text-sm">
                            {historyItem.pbc_rejection}
                          </div>
                        {:else}
                          <div class="rounded-r bg-blue-100 p-1 text-sm">
                            {historyItem.prioritization_response_status}
                          </div>
                        {/if}
                      </div>
                    {/if}
                  </div>
                  {#if historyItem.type_of_msg == "srm" || historyItem.pbc_rejection == "NO_ERROR"}
                    <div class="flex flex-row justify-between">
                      <span
                        >ETA: {formatTimeNicely(historyItem.eta_stopline)} (&Delta;{(
                          (new Date(historyItem.eta_stopline).getTime() -
                            new Date(historyItem.timestamp).getTime()) /
                          1000.0
                        ).toFixed(1)}s)</span
                      >
                      <span>Latency: {historyItem.latency}ms</span>
                    </div>
                    <div class="flex flex-row">
                      LaneConnectionID: {historyItem.lane_connection}
                    </div>
                    {#if historyItem.type_of_msg == "srm"}
                      <div class="flex flex-row justify-between">
                        <span>{historyItem.transit_status_loading}</span>
                        <span>{historyItem.transit_status_door_open}</span>
                        <span>{historyItem.transit_status_at_stopline}</span>
                        <span>{historyItem.transit_schedule}</span>
                      </div>
                    {/if}
                  {/if}
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/if}
    </div>
  </main>
</div>

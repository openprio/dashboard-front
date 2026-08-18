<script lang="ts">
  import {
    Alert,
    Button,
    Label,
    Modal,
    Table,
    TableBody,
    TableBodyCell,
    TableBodyRow,
    TableHead,
    TableHeadCell,
    Textarea,
  } from "flowbite-svelte";
  import {
    ClipboardCheckOutline,
    ClipboardOutline,
    DownloadOutline,
  } from "flowbite-svelte-icons";
  import { generateVehicleCredentials } from "../api.js";

  type GeneratedCredential = {
    data_owner_code: string;
    vehicle_number: string;
    token: string;
    created_at: string;
  };

  type SkippedExisting = {
    data_owner_code: string;
    vehicle_number: string;
  };

  type GenerateResult = {
    generated: GeneratedCredential[];
    skipped_existing: SkippedExisting[];
  };

  let {
    dataOwner,
    open = $bindable(false),
    ongenerated,
  }: {
    dataOwner: string;
    open?: boolean;
    ongenerated?: () => void;
  } = $props();

  const MAX_VEHICLES_PER_BATCH = 500;

  let step = $state<"input" | "result">("input");
  let vehicleInput = $state("");
  let generateError = $state("");
  let generating = $state(false);
  let result = $state<GenerateResult | null>(null);
  let copied = $state<"" | "json" | "csv">("");

  /**
   * Parses free-form input like "1001-1050, 1100-1200, 1320" into a
   * deduplicated list of vehicle numbers. Returns the invalid tokens so the
   * caller can show a validation message.
   */
  function parseVehicleNumbers(input: string): {
    vehicles: string[];
    invalid: string[];
  } {
    const tokens = input.split(/[\s,;]+/).filter(Boolean);
    const vehicles = new Set<string>();
    const invalid: string[] = [];

    for (const token of tokens) {
      const range = token.match(/^(\d+)-(\d+)$/);
      if (range) {
        const start = Number(range[1]);
        const end = Number(range[2]);
        if (start > end) {
          invalid.push(token);
          continue;
        }
        for (let n = start; n <= end; n++) {
          vehicles.add(String(n));
        }
      } else if (/^\d+$/.test(token)) {
        vehicles.add(token);
      } else {
        invalid.push(token);
      }
    }
    return { vehicles: [...vehicles], invalid };
  }

  let parsed = $derived(parseVehicleNumbers(vehicleInput));

  async function handleGenerate() {
    generateError = "";
    if (parsed.invalid.length > 0) {
      generateError = `Ongeldige invoer: ${parsed.invalid.join(", ")}. Gebruik voertuignummers of bereiken zoals 1001-1050.`;
      return;
    }
    if (parsed.vehicles.length === 0) {
      generateError = "Voer minimaal één voertuignummer in.";
      return;
    }
    if (parsed.vehicles.length > MAX_VEHICLES_PER_BATCH) {
      generateError = `Maximaal ${MAX_VEHICLES_PER_BATCH} voertuigen per batch (nu ${parsed.vehicles.length}).`;
      return;
    }

    generating = true;
    try {
      const entries = parsed.vehicles.map((vehicle_number) => ({
        data_owner_code: dataOwner,
        vehicle_number,
      }));
      result = await generateVehicleCredentials(entries);
      step = "result";
      ongenerated?.();
    } catch (e) {
      generateError = e.message || "Credentials genereren is mislukt.";
    } finally {
      generating = false;
    }
  }

  function toJson(rows: GeneratedCredential[]): string {
    return JSON.stringify(rows, null, 2);
  }

  function toCsv(rows: GeneratedCredential[]): string {
    const header = "data_owner_code,vehicle_number,token,created_at";
    const lines = rows.map(
      (r) =>
        `${r.data_owner_code},${r.vehicle_number},${r.token},${r.created_at}`,
    );
    return [header, ...lines].join("\n");
  }

  function downloadFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function downloadJson() {
    if (!result) return;
    downloadFile(
      toJson(result.generated),
      "vehicle_credentials.json",
      "application/json",
    );
  }

  function downloadCsv() {
    if (!result) return;
    downloadFile(
      toCsv(result.generated),
      "vehicle_credentials.csv",
      "text/csv",
    );
  }

  async function copy(format: "json" | "csv") {
    if (!result) return;
    const text =
      format === "json" ? toJson(result.generated) : toCsv(result.generated);
    try {
      await navigator.clipboard.writeText(text);
      copied = format;
      setTimeout(() => (copied = ""), 3000);
    } catch {
      generateError = "Kopiëren naar het klembord is mislukt.";
    }
  }

  function resetState() {
    step = "input";
    vehicleInput = "";
    generateError = "";
    result = null;
    copied = "";
  }

  // Reset the wizard every time the modal is closed.
  $effect(() => {
    if (!open) resetState();
  });
</script>

<Modal bind:open title="Credentials genereren" size="lg" autoclose={false}>
  {#if step === "input"}
    <div class="flex flex-col gap-4">
      <p class="text-sm text-gray-500">
        Genereer nieuwe credentials voor <strong>{dataOwner}</strong>. Voer
        voertuignummers in, gescheiden door komma's of enters. Bereiken zoals
        <code class="rounded bg-gray-100 px-1">1001-1050</code> zijn ook toegestaan.
      </p>
      <div>
        <Label for="vehicle-numbers" class="mb-2">Voertuignummers</Label>
        <Textarea
          id="vehicle-numbers"
          rows={6}
          placeholder="1001-1050, 1100-1200, 1320"
          bind:value={vehicleInput}
        />
      </div>
      {#if parsed.vehicles.length > 0}
        <p class="text-sm text-gray-500">
          {parsed.vehicles.length}
          {parsed.vehicles.length === 1 ? "voertuig" : "voertuigen"} geselecteerd.
        </p>
      {/if}
      {#if generateError}
        <Alert color="red" dismissable>{generateError}</Alert>
      {/if}
      <div class="flex justify-end gap-3">
        <Button
          color="blue"
          onclick={handleGenerate}
          disabled={generating || parsed.vehicles.length === 0}
        >
          {generating ? "Genereren..." : "Genereer"}
        </Button>
        <Button color="alternative" onclick={() => (open = false)}>
          Annuleren
        </Button>
      </div>
    </div>
  {:else if result}
    <div class="flex flex-col gap-4">
      <Alert color="yellow">
        <span class="font-medium">Let op:</span> de tokens worden alleen nu getoond
        en kunnen later niet meer worden opgehaald. Kopieer ze of download ze als
        JSON of CSV.
      </Alert>

      {#if result.generated.length > 0}
        <div class="max-h-80 overflow-y-auto rounded border border-gray-200">
          <Table>
            <TableHead>
              <TableHeadCell>Voertuignummer</TableHeadCell>
              <TableHeadCell>Token</TableHeadCell>
              <TableHeadCell>Aangemaakt op</TableHeadCell>
            </TableHead>
            <TableBody>
              {#each result.generated as row (row.vehicle_number)}
                <TableBodyRow>
                  <TableBodyCell>{row.vehicle_number}</TableBodyCell>
                  <TableBodyCell class="font-mono text-xs">
                    {row.token}
                  </TableBodyCell>
                  <TableBodyCell>
                    {new Date(row.created_at).toLocaleString("nl-NL")}
                  </TableBodyCell>
                </TableBodyRow>
              {/each}
            </TableBody>
          </Table>
        </div>
      {:else}
        <p class="text-sm text-gray-500">
          Er zijn geen nieuwe credentials gegenereerd.
        </p>
      {/if}

      {#if result.skipped_existing.length > 0}
        <p class="text-sm text-gray-500">
          <strong>{result.skipped_existing.length}</strong>
          {result.skipped_existing.length === 1
            ? "voertuig heeft"
            : "voertuigen hebben"} al credentials en
          {result.skipped_existing.length === 1 ? "is" : "zijn"} overgeslagen:
          <span class="font-mono">
            {result.skipped_existing.map((s) => s.vehicle_number).join(", ")}
          </span>
        </p>
      {/if}

      {#if generateError}
        <Alert color="red" dismissable>{generateError}</Alert>
      {/if}

      <div class="flex flex-wrap justify-end gap-3">
        <Button
          color="blue"
          onclick={() => copy("json")}
          disabled={result.generated.length === 0}
        >
          {#if copied === "json"}
            <ClipboardCheckOutline class="mr-2 h-4 w-4" />
            Gekopieerd!
          {:else}
            <ClipboardOutline class="mr-2 h-4 w-4" />
            Kopieer JSON
          {/if}
        </Button>
        <Button
          color="blue"
          onclick={() => copy("csv")}
          disabled={result.generated.length === 0}
        >
          {#if copied === "csv"}
            <ClipboardCheckOutline class="mr-2 h-4 w-4" />
            Gekopieerd!
          {:else}
            <ClipboardOutline class="mr-2 h-4 w-4" />
            Kopieer CSV
          {/if}
        </Button>
        <Button
          color="alternative"
          onclick={downloadJson}
          disabled={result.generated.length === 0}
        >
          <DownloadOutline class="mr-2 h-4 w-4" />
          Download JSON
        </Button>
        <Button
          color="alternative"
          onclick={downloadCsv}
          disabled={result.generated.length === 0}
        >
          <DownloadOutline class="mr-2 h-4 w-4" />
          Download CSV
        </Button>
        <Button color="alternative" onclick={() => (open = false)}>
          Sluiten
        </Button>
      </div>
    </div>
  {/if}
</Modal>

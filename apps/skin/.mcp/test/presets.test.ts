import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { spawnTestPresetsServer, type TestPresetsServer } from "./helpers/presets-server";

// Взято живьём с реального omnifield-палитры/omnifield-avatar (get_preset на локальном
// backend/presets) — настоящая, структурно валидная форма, не выдуманная. name/author подогнаны
// под этот тестовый прогон.
const PALETTE = {
  name: "vitest-palette",
  scales: { accent: "#3457d5", danger: "#c2282e", neutral: "#6b7280", success: "#197a3d", warning: "#a35a06" },
  dimensions: {
    "border-width": "1px",
    card: { between: ["360px", "1280px"], narrow: "20rem", wide: "24rem" },
    column: "1rem",
    "control-height": { between: ["360px", "1280px"], narrow: "2rem", wide: "2.25rem" },
    density: "1",
    "font-size": { between: ["360px", "1280px"], narrow: "0.9375rem", wide: "1rem" },
    layout: { between: ["360px", "1280px"], narrow: "64rem", wide: "80rem" },
    radius: "10px",
    rail: { between: ["360px", "1280px"], narrow: "12rem", wide: "14rem" },
    space: { between: ["360px", "1280px"], narrow: "0.375rem", wide: "0.5rem" },
    tracking: "0em",
  },
  light: {
    "accent-contrast": "#ffffff",
    "danger-contrast": "#ffffff",
    "ease-in": "cubic-bezier(0.4, 0, 1, 1)",
    "ease-in-out": "cubic-bezier(0.4, 0, 0.2, 1)",
    "ease-linear": "linear",
    "ease-out": "cubic-bezier(0, 0, 0.2, 1)",
    "leading-none": "1",
    "leading-normal": "1.5",
    "leading-relaxed": "1.7",
    "leading-snug": "1.35",
    "leading-tight": "1.2",
    "motion-fast": "150ms",
    "motion-instant": "75ms",
    "motion-normal": "250ms",
    "motion-slow": "400ms",
    "success-contrast": "#ffffff",
    "warning-contrast": "#ffffff",
    "weight-bold": "700",
    "weight-medium": "500",
    "weight-normal": "400",
    "weight-semibold": "600",
  },
  dark: {
    "accent-10": "#4062df",
    "accent-9": "#3457d5",
    "accent-contrast": "#ffffff",
    "danger-10": "#d13237",
    "danger-9": "#c2282e",
    "danger-contrast": "#ffffff",
    "success-10": "#1a8040",
    "success-9": "#197a3d",
    "success-contrast": "#ffffff",
    "warning-10": "#aa5e06",
    "warning-9": "#a35a06",
    "warning-contrast": "#ffffff",
  },
};

const FORM = {
  name: "vitest-avatar",
  component: "avatar",
  recipe: {
    base: {
      fallback: {
        props: {
          alignItems: "center",
          blockSize: "100%",
          display: "flex",
          fontSize: "var(--font-size-sm)",
          fontWeight: "var(--weight-medium)",
          inlineSize: "100%",
          justifyContent: "center",
          textTransform: "uppercase",
        },
        states: { hidden: { props: { display: "none" } }, visible: { props: { display: "flex" } } },
      },
      image: {
        props: { blockSize: "100%", inlineSize: "100%", objectFit: "cover" },
        states: { hidden: { props: { display: "none" } }, visible: { props: { display: "block" } } },
      },
      root: {
        props: {
          alignItems: "center",
          background: "var(--neutral-4)",
          blockSize: "var(--control-height-md)",
          borderRadius: "var(--radius-full)",
          color: "var(--neutral-12)",
          display: "inline-flex",
          flexShrink: "0",
          inlineSize: "var(--control-height-md)",
          justifyContent: "center",
          overflow: "hidden",
          position: "relative",
        },
      },
    },
    defaultVariant: "md",
    variants: {
      lg: {
        fallback: { props: { fontSize: "var(--font-size-md)" } },
        root: { props: { blockSize: "var(--control-height-lg)", inlineSize: "var(--control-height-lg)" } },
      },
      md: {},
      sm: {
        fallback: { props: { fontSize: "var(--font-size-xs)" } },
        root: { props: { blockSize: "var(--control-height-sm)", inlineSize: "var(--control-height-sm)" } },
      },
    },
  },
  keyframes: null,
  variantTags: { lg: ["default"], md: ["default"], sm: ["default"] },
};

let presetsServer: TestPresetsServer;
let registerPresetTools: (server: McpServer) => void;

beforeAll(async () => {
  presetsServer = await spawnTestPresetsServer();
  process.env["SKIN_MCP_PRESETS_URL"] = presetsServer.url;
  ({ registerPresetTools } = await import("../src/tools/presets"));

  // Сид один раз на файл — не полагаемся на порядок describe-блоков. tag → palette → form: тот же
  // порядок, что push-to-prod.mjs (форма сверяется с палитрой по имени, variantTags — со словарём
  // тегов). "default" — DEFAULT_TAG из @web-core/skin/tags, FORM ссылается на него в variantTags.
  const client = await connectedClient();
  await client.callTool({ name: "save_preset", arguments: { kind: "tag", state: { name: "default" }, author: "vitest" } });
  await client.callTool({ name: "save_preset", arguments: { kind: "palette", state: PALETTE, author: "vitest" } });
  await client.callTool({ name: "save_preset", arguments: { kind: "form", state: FORM, author: "vitest" } });
}, 30000);

afterAll(async () => {
  await presetsServer.close();
});

async function connectedClient(): Promise<Client> {
  const server = new McpServer({ name: "test-server", version: "0.0.0" });
  registerPresetTools(server);

  const client = new Client({ name: "test-client", version: "0.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return client;
}

async function readJson(result: Awaited<ReturnType<Client["callTool"]>>) {
  const first = (result.content as { type: string; text?: string }[])[0];
  if (!first || first.type !== "text" || first.text === undefined) {
    throw new Error(`unexpected result shape: ${JSON.stringify(result)}`);
  }
  return JSON.parse(first.text);
}

describe("save_preset + get_preset + list_presets — palette round-trip", () => {
  it("saves a valid palette and reads it back by name", async () => {
    const client = await connectedClient();
    const name = "vitest-roundtrip-palette";
    const palette = { ...PALETTE, name };

    const saved = await readJson(
      await client.callTool({ name: "save_preset", arguments: { kind: "palette", state: palette, author: "vitest" } }),
    );
    // save_preset возвращает {saved: PresetRecord}, не {saved: boolean} — сверено живьём.
    expect(saved.saved.name).toBe(name);

    const read = await readJson(await client.callTool({ name: "get_preset", arguments: { kind: "palette", name } }));
    expect(read.state.name).toBe(name);
    expect(read.state.scales.accent).toBe(PALETTE.scales.accent);

    const list = await readJson(await client.callTool({ name: "list_presets", arguments: { kind: "palette" } }));
    const names = list.items.map((item: { name: string }) => item.name);
    expect(names).toContain(name);
    // Заголовок без id/kind — та же форма, что list-presets-drop-redundant-fields закрепила.
    expect(list.items[0]).not.toHaveProperty("id");
    expect(list.items[0]).not.toHaveProperty("kind");
  });
});

describe("check_palette", () => {
  it("passes a structurally valid palette", async () => {
    const client = await connectedClient();
    const body = await readJson(await client.callTool({ name: "check_palette", arguments: { palette: PALETTE } }));
    expect(body.ok).toBe(true);
  });

  it("reports a flaw instead of silently accepting a palette missing a required scale", async () => {
    const client = await connectedClient();
    const { neutral, ...scalesWithoutNeutral } = PALETTE.scales;
    void neutral;
    const broken = { ...PALETTE, scales: scalesWithoutNeutral };

    const body = await readJson(await client.callTool({ name: "check_palette", arguments: { palette: broken } }));
    expect(body.ok).toBe(false);
  });
});

describe("save_preset — author ownership", () => {
  it("refuses a write from a different author once a record is owned", async () => {
    const client = await connectedClient();
    const name = "vitest-owned-palette";

    const first = await readJson(
      await client.callTool({
        name: "save_preset",
        arguments: { kind: "palette", state: { ...PALETTE, name }, author: "alice" },
      }),
    );
    expect(first.saved.name).toBe(name);

    const result = await client.callTool({
      name: "save_preset",
      arguments: { kind: "palette", state: { ...PALETTE, name }, author: "bob" },
    });
    expect(result.isError).toBe(true);

    const still = await readJson(await client.callTool({ name: "get_preset", arguments: { kind: "palette", name } }));
    expect(still.state.author).toBe("alice");
  });
});

describe("check_form", () => {
  it("passes a structurally valid form and resolves variantTags", async () => {
    const client = await connectedClient();
    const body = await readJson(await client.callTool({ name: "check_form", arguments: { form: FORM } }));

    expect(body.ok).toBe(true);
    expect(body.tagGroups).toBeDefined();
  });

  it("reports unknown-variant when variantTags names a variant recipe does not have", async () => {
    const client = await connectedClient();
    const broken = { ...FORM, variantTags: { ...FORM.variantTags, "no-such-variant": ["default"] } };

    const body = await readJson(await client.callTool({ name: "check_form", arguments: { form: broken } }));
    expect(body.ok).toBe(false);
    expect(body.referenceFlaws.some((f: { name: string }) => f.name === "unknown-variant")).toBe(true);
  });
});

describe("check_outfit + assemble_preview", () => {
  it("check_outfit resolves palette/forms by name and reports ok:true for a real combination", async () => {
    const client = await connectedClient();
    const outfit = { name: "vitest-outfit", palette: PALETTE.name, forms: [FORM.name] };

    const body = await readJson(await client.callTool({ name: "check_outfit", arguments: { outfit } }));
    expect(body.ok).toBe(true);
  });

  it("check_outfit reports a flaw for a form name that does not exist", async () => {
    const client = await connectedClient();
    const outfit = { name: "vitest-outfit-broken", palette: PALETTE.name, forms: ["no-such-form"] };

    const body = await readJson(await client.callTool({ name: "check_outfit", arguments: { outfit } }));
    expect(body.ok).toBe(false);
  });

  it("assemble_preview returns a report plus a CSS resource_link, not inline CSS", async () => {
    const client = await connectedClient();
    const outfit = { name: "vitest-outfit", palette: PALETTE.name, forms: [FORM.name] };

    const result = await client.callTool({ name: "assemble_preview", arguments: { outfit } });
    expect(result.isError).toBe(false);

    const types = (result.content as { type: string }[]).map((c) => c.type);
    expect(types).toContain("resource_link");
    expect(types).toContain("text");
  });
});

import { httpPeer, stdioPeer } from "@web-core/mcp/peer";

const PROD_URL = process.env["SKIN_MCP_PROD_URL"];
if (!PROD_URL) {
  console.error("SKIN_MCP_PROD_URL не задан — некуда пушить (см. README.md).");
  process.exit(1);
}

const author = process.env["SKIN_MCP_ADMIN_AUTHOR"];
const adminToken = process.env["SKIN_MCP_ADMIN_TOKEN"];

// Локальный сервер поднимается тем же способом, что и разработчик (pnpm start) — свой процесс на
// время скрипта, не подключение к уже запущенному. Прод — по HTTP, адресом из env. env: process.env
// обязателен — по умолчанию SDK передаёт дочернему процессу обрезанный набор переменных (PATH/HOME/
// ...), локальный skin-mcp иначе молча стартует с дефолтным SKIN_MCP_PRESETS_URL, даже если у
// оператора он переопределён (найдено живой финальной сверкой, см. FAQ.md).
const local = stdioPeer("pnpm", ["start"], { name: "push-to-prod-local", env: process.env });
const prod = httpPeer(PROD_URL, { name: "push-to-prod-remote" });

async function readJson(result) {
  const first = result.content?.[0];
  if (!first || first.type !== "text") throw new Error(`unexpected tool result shape: ${JSON.stringify(result)}`);
  return JSON.parse(first.text);
}

// Порядок важен: tag/palette должны существовать на проде раньше form (paletteName-сверка,
// variantTags-словарь), form раньше outfit (checkOutfit резолвит формы по имени).
const PLAN = [
  { kind: "tag", isReference: () => true },
  { kind: "palette", isReference: (name) => name.startsWith("omnifield") },
  { kind: "form", isReference: (name) => name.startsWith("omnifield") },
  { kind: "outfit", isReference: (name) => name.startsWith("omnifield") },
  { kind: "assembly", isReference: (name) => name.startsWith("omnifield") },
];

for (const { kind, isReference } of PLAN) {
  const { items } = await readJson(await local.callTool("list_presets", { kind }));
  const toPush = items.filter((record) => isReference(record.name));

  for (const record of toPush) {
    const entry = await readJson(await local.callTool("get_preset", { kind, name: record.name }));
    const result = await readJson(
      await prod.callTool("save_preset", { kind, state: entry.state, label: entry.label, author, adminToken }),
    );

    if (result.saved) console.log(`✓ ${kind}/${record.name}`);
    else console.error(`✗ ${kind}/${record.name}`, JSON.stringify(result));
  }
}

await local.close();
await prod.close();

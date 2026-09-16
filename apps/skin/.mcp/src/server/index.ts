import { createServer } from "@web-core/neurobox/server";
import { registerTools } from "../tools";

const transport =
  process.env["SKIN_MCP_TRANSPORT"] === "http" ? "http" : "stdio";
// 8788, не общий "3000" по умолчанию у @web-core/neurobox — 3000 в реальном контейнере разработки занят
// сторонней инфраструктурой (не web-core), listen() падает EADDRINUSE на КАЖДОМ старте без PORT.
// 8788 — рядом со службой пресетов этой же зоны (8787), не общий с другими web-core-серверами.
const port = Number(process.env["PORT"] ?? 8788);
const host = process.env["SKIN_MCP_HOST"];

// Коротко и по делу: глубина — в docs/*.md по get_doc, не здесь. Каждый лишний токен тут платится
// на КАЖДОЙ сессии, независимо от задачи (см. ROADMAP.yaml, tool-descriptions-cost-tokens).
const instructions = [
  "Разведка: list_components → get_passport/get_assemblies/get_io_schema конкретного компонента —",
  "до того, как писать палитру/форму/сборку. list_docs/get_doc — темы по запросу (color, author,",
  "forms), зовите ТОЛЬКО когда тема реально нужна прямо сейчас.",
  "check_* отдаёт отчёт с флавами ВНУТРИ данных (isError:false) — нормальный отрицательный",
  "результат, не отказ инструмента. save_preset проверяет сама и откажет тем же отчётом.",
].join(" ");

const server = createServer({
  name: "web-core-skin",
  version: "0.0.0",
  transport,
  host,
  instructions,
  registerTools,
});

await server.listen(port);

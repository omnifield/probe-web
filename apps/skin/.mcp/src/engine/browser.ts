import { createBrowser } from "@web-core/mcp/browser";

// Сама механика (chrome-devtools-mcp, peer, парсинг pageId) — в @web-core/mcp/browser, браузер
// нужен не только этой зоне. Здесь только конфигурация под skin-mcp: свой путь к бинарнику из
// переменной окружения зоны (см. FAQ.md — почему это не хардкод).
const browser = createBrowser({ executablePath: process.env["SKIN_MCP_CHROME_EXECUTABLE"] });

export const newPage = browser.newPage;
export const navigate = browser.navigate;
export const screenshot = browser.screenshot;
export const snapshot = browser.snapshot;
export const click = browser.click;
export type { Screenshot } from "@web-core/mcp/browser";

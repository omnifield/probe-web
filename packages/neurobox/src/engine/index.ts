// Единственная точка резолва framework-agnostic транспорта бокса (@tanstack/ai-client) в
// web-core — приложение никогда не импортирует вендора напрямую, по тому же образцу, что
// @web-core/router/@web-core/query/@web-core/form.
export * from "@tanstack/ai-client";

// Заголовки доступа (token/X-User-Login) — общие между connect() и типизированными ручками бокса.
export * from "./access.js";

// Свой ConnectConnectionAdapter поверх вендора — штатный fetchServerSentEvents не собирает
// конверт бокса (context/отмена), см. FAQ.md.
export * from "./connection.js";

// GET /api/agent/{threadId}/spent — типизированный снимок расхода, без счёта дельт.
export * from "./spend.js";

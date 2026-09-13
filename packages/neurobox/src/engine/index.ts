// Единственная точка резолва framework-agnostic транспорта бокса (@tanstack/ai-client) в
// web-core — приложение никогда не импортирует вендора напрямую, по тому же образцу, что
// @web-core/router/@web-core/query/@web-core/form.
export * from "@tanstack/ai-client";

// Свой ConnectConnectionAdapter поверх вендора — штатный fetchServerSentEvents не собирает
// конверт бокса (context/отмена), см. FAQ.md.
export * from "./connection.js";

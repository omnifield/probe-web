// Сохранение кэша `QueryClient` между перезагрузками — два вендорских пакета, которые на
// практике всегда берут вместе (persister нужен только вместе с движком persist-client),
// поэтому здесь один подпуть, а не два. Отдельно от `./index` по той же причине, что у аддонов
// `@omnifield/probe-web-store` (`./persist` там же): оба вендора — НАША зависимость, без
// реэкспорта их подпути недостижимы строгим pnpm.
export * from "@tanstack/query-persist-client-core";
export { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

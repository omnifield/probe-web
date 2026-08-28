// Аддон `@xstate/store`: `createStore({...}).with(persist({ storage, key }))` — сохранение
// снапшота в `localStorage`/произвольное хранилище. Отдельный подпуть по той же причине, что
// и у `./undo`/`./reset`/`./validate`: `@xstate/store` — НАША зависимость (её нет у приложения
// напрямую), и её подпути без реэкспорта здесь были бы недостижимы строгим pnpm.
export * from "@xstate/store/persist";

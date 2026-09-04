// Полноценные стейт-машины XState — слой ПОВЕРХ `.` (не альтернатива ему), для случаев, где
// плоского `createStore` не хватает: явные состояния, guards, вложенность, акторы. Отдельный
// подпуть, а не часть `.`, потому что `xstate`/`@xstate/solid` — ОПЦИОНАЛЬНЫЙ peer (см.
// `package.json`): приложение, которому хватает `createStore`, не обязано его ставить.
//
// ВАЖНАЯ РАЗНИЦА С `useSelector` ИЗ `.`: `useMachine`/`useActor` отдают снапшот НЕ акксессором,
// а реактивным solid-стором (`createStore` из `solid-js/store`, разобрано по значению один раз
// на вызов) — читается путём свойства, `state.context.count`, БЕЗ вызова как функции. Аксессор
// у них третьим лишним не идёт — это устройство самого `@xstate/solid` (сверено по исходнику
// `xstate-solid.esm.js`, 2026-08-28), а не наша обёртка поверх него.
export * from "xstate";
export { fromActorRef, useActor, useActorRef, useMachine } from "@xstate/solid";

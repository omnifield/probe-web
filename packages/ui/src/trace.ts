// Perf-трейсы зоны `ui`. ВНУТРЕННЕЕ: наружу не экспортируется и в `exports` манифеста не
// объявлено — поверхность пакета это примитивы, а не инструментовка.
//
// Форма повторяет `runtime`/`style`/`build` намеренно: один и тот же способ включения на все
// зоны продукта. Отличие одно и оно по делу — здесь трейс ПАРНЫЙ (mount ↔ dispose), потому
// что предмет замера у компонента это время жизни узла, а не длительность вызова.

import { createUniqueId, onCleanup } from "solid-js";

/** Глобальный тумблер трейсов: `globalThis.__PROBE_WEB_UI_TRACE__ = true`. */
const FLAG = "__PROBE_WEB_UI_TRACE__";

type TraceGlobal = typeof globalThis & { [FLAG]?: boolean };

/**
 * Включены ли трейсы. По умолчанию — нет, включает только явный глобальный флаг.
 *
 * Автоопределение по dev-режиму сборщика (`import.meta.env.DEV`) не используется по той же
 * причине, что и в `runtime`: пакет приезжает потребителю зависимостью, а подстановку в файлы
 * из `node_modules` Vite не делает — условие осталось бы вечно ложным.
 */
function enabled(): boolean {
  return (globalThis as TraceGlobal)[FLAG] === true;
}

/**
 * Отмечает жизнь ОДНОГО экземпляра примитива: строка при монтировании и парная ей при
 * размонтировании. Общий `id` пары показывает в дампе, какой узел инстанцируется дважды.
 *
 * Зовётся первой строкой тела компонента. Когда канал выключен — мгновенный `return` ДО
 * вызова `createUniqueId` и до постановки `onCleanup`: ноль аллокаций на hot-path.
 *
 * @param node имя примитива вида `ui.button`
 */
export function traceLife(node: string): void {
  if (!enabled()) return;

  const id = createUniqueId();
  const started = performance.now();
  console.debug(`[probe-web-ui] ${node} mount — ${id}`);

  onCleanup(() => {
    const ms = performance.now() - started;
    console.debug(`[probe-web-ui] ${node} dispose — ${id}, жил ${ms.toFixed(2)}ms`);
  });
}

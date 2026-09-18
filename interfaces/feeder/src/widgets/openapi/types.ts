import type { EndpointDescriptor, OpenapiEndpoint } from "../../entities/openapi/index.js";
import type { InvokeResult } from "../../features/invoke-endpoint/index.js";

/** Общий контракт `onChange` обоих видов мода 2 — стреляет на вызов ручки, не на правку поля. */
export interface OpenapiInvocation {
  readonly endpoint: OpenapiEndpoint;
  /** Параметры, с которыми ручка была вызвана — сохранить эту пару `{ endpoint, value }` и есть
   *  способ позже передать её в `OpenapiList` (настроил в редакторе → дёргай на витрине). */
  readonly value: unknown;
  readonly response: InvokeResult;
}

/** Одна секция `OpenapiEditor`. Группа НЕ хранит отдельный флаг «чем я являюсь» — только сами
 *  данные (`raw`/`endpoints`), вид всегда выводится из их текущего содержимого (`openapiGroupKind`)
 *  заново на каждый рендер. Из этого сразу следует нужное поведение без отдельной обработки: юзер
 *  убрал последнюю ручку из группы-юзера или стёр `raw` из группы-схемы — группа САМА возвращается
 *  в нейтральное состояние, никакой «залипшей» отметки вида не остаётся. */
export interface OpenapiGroup {
  readonly id: string;
  readonly name: string;
  readonly raw: string;
  readonly endpoints: readonly EndpointDescriptor[];
}

export type OpenapiGroupKind = "empty" | "schema" | "manual";

/** `raw` непустой — группа-схема (даже если параллельно как-то оказались и `endpoints` — приоритет
 *  у `raw`, это не должно происходить через штатный UI, но функция обязана быть тотальной).
 *  Иначе — есть хоть одна ручка → юзер, иначе — нейтральная. */
export function openapiGroupKind(group: OpenapiGroup): OpenapiGroupKind {
  if (group.raw.trim() !== "") return "schema";
  if (group.endpoints.length > 0) return "manual";
  return "empty";
}

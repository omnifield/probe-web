import type { OpenapiEndpoint } from "../../entities/openapi/index.js";
import type { InvokeResult } from "../../features/invoke-endpoint/index.js";

/** Общий контракт `onChange` обоих видов мода 2 — стреляет на вызов ручки, не на правку поля. */
export interface OpenapiInvocation {
  readonly endpoint: OpenapiEndpoint;
  /** Параметры, с которыми ручка была вызвана — сохранить эту пару `{ endpoint, value }` и есть
   *  способ позже передать её в `OpenapiList` (настроил в редакторе → дёргай на витрине). */
  readonly value: unknown;
  readonly response: InvokeResult;
}

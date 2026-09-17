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

/** Группа-схема — ручки распознаются из `raw` (сегодня свагер 2.0), read-only: юзер не правит
 *  ручки внутри поштучно, «обновить» значит перезалить `raw` целиком и переразобрать заново, тот
 *  же контракт, что и `OpenapiEditor` до групп. */
export interface SchemaGroup {
  readonly id: string;
  readonly name: string;
  readonly kind: "schema";
  readonly raw: string;
}

/** Группа-юзер — ручки без исходного документа, дескрипторы (`EndpointDescriptor`) заполняются
 *  вручную через `Tree` (мод 1). Полностью редактируемая — юзер добавляет/убирает/правит ручки
 *  сам, в отличие от группы-схемы. */
export interface ManualGroup {
  readonly id: string;
  readonly name: string;
  readonly kind: "manual";
  readonly endpoints: readonly EndpointDescriptor[];
}

/** Одна секция `OpenapiEditor`. У юзера может быть сколько угодно бэков со свагером и сколько
 *  угодно бэков без него — группы не сливаются в общий список ручек, каждая подписана юзером и
 *  остаётся своим источником (см. FAQ.md). */
export type OpenapiGroup = SchemaGroup | ManualGroup;

import type { FieldRule } from "@web-core/io";

/**
 * Дочерний ресурс СХЕМЫ (`ROADMAP.yaml`'s `adapter-child-of-schema`) — живёт, пока жива схема; на
 * одну схему можно навесить сколько угодно адаптеров, каждый под свой компонент кита независимо.
 * Компонент про адаптеры не знает вообще — только свой `entity/io.ts` (`packages/ui`).
 */
export interface Adapter {
  readonly id: string;
  /** Схема-родитель, из полей которой набран `intake`. */
  readonly schemaId: string;
  /** Компонент кита, под который сведены поля. */
  readonly component: string;
  /** Приём: поле схемы → поле компонента. */
  readonly intake: readonly FieldRule[];
  /** Отдача: поле компонента → поле схемы. Не выводится машиной из `intake` — оба направления
   *  пишутся руками отдельно (`adapter-child-of-schema`). */
  readonly emit: readonly FieldRule[];
}

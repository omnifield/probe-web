// Контекст на приложение вокруг `createSkinConnection`. Разбор — FAQ.md.
import {
  createContext,
  createEffect,
  createMemo,
  createResource,
  onMount,
  untrack,
  useContext,
  type Accessor,
  type JSX,
  type ParentProps,
  type Resource,
} from "solid-js";

import { createSkinConnection, type SkinConnection } from "./connection.js";
import type { ComponentPassport } from "../engine/passport/form/index.js";
import type { SkinSource, SkinSwitchOptions } from "../wear/switch.js";

/** `SkinConnection` плюс общий на приложение список имён источника. */
export interface SkinContextValue extends SkinConnection {
  names: Resource<readonly string[]>;
}

const SkinContext = createContext<SkinContextValue>();

export interface SkinProviderProps extends ParentProps {
  readonly source: SkinSource;
  readonly options?: SkinSwitchOptions;
}

/** Заводит `SkinConnection` на всё поддерево и сам восстанавливает запомненный выбор при
 *  монтировании. Источник и опции берутся один раз, как и у `createSkinConnection`. */
export function SkinProvider(props: SkinProviderProps): JSX.Element {
  const source = untrack(() => props.source);
  const skin = createSkinConnection(source, untrack(() => props.options) ?? {});
  const [names] = createResource(() => source.names());

  onMount(() => {
    skin.restore().catch((cause: unknown) => console.debug("скин не восстановлен", cause));
  });

  return (
    <SkinContext.Provider value={{ ...skin, names }}>{props.children}</SkinContext.Provider>
  );
}

/** Значение ближайшего `SkinProvider`. Вне него — отказ, не тихий `undefined`. */
export function useSkin(): SkinContextValue {
  const value = useContext(SkinContext);
  if (value === undefined) {
    throw new Error("[web-core-skin] useSkin(): вне <SkinProvider>.");
  }
  return value;
}

/**
 * Читает `data`, который источник отдал на последний `ensureComponentSkin` компонента с этим
 * именем — тот же фетч, что уже сделал сам компонент через `useComponentSkin`, без второго запроса
 * за тем же. Реактивно: обновляется и когда компонент допечатывает новое значение оси, и когда
 * наряд сменился (карта чистится целиком, `component-skin-data-passthrough`).
 *
 * `T` — на совести вызывающего: контракт этого слоя — `unknown` (источники разные, форма не
 * гарантирована никем ниже), а не `Form` конкретно. Компонента с этим именем ещё не было под
 * `<SkinProvider>`, либо источник не дал `data`, либо ничего не надето — везде `undefined`,
 * различать эти случаи не входит в контракт (см. {@link SkinConnection.componentData}).
 */
export function useComponentSkinData<T = unknown>(component: string): Accessor<T | undefined> {
  const value = useSkin();
  const data = createMemo(() => value.componentData().get(component) as T | undefined);
  return data;
}

/**
 * Читает `outfit`, который источник отдал вместе с `data` на последний `ensureComponentSkin` ЛЮБОГО
 * компонента дерева — тот же вызов, тот же ответ, просто вторая его половина (про наряд целиком, не
 * про конкретный компонент). Реактивно, тем же приёмом, что {@link useComponentSkinData}: обновляется
 * на каждый допечатанный компонент и чистится при смене имени наряда (`outfit-data-passthrough`).
 *
 * Требует, чтобы ХОТЯ БЫ ОДИН компонент в дереве уже позвал `useComponentSkin` — сам по себе этот
 * хук сеть не заводит и ничего не запрашивает, читает то, что уже нашлось попутно.
 */
export function useOutfitData<T = unknown>(): Accessor<T | undefined> {
  const value = useSkin();
  const data = createMemo(() => value.outfitData() as T | undefined);
  return data;
}

/**
 * Компонент кита сам просит свой CSS — по значению `variant`/каждой `setting` c атрибутной меткой,
 * реактивно. Без `SkinProvider` в дереве — тихий no-op. `props` принимается как `object`, не
 * `Record<string, unknown>`: реальные пропсы кита (`AccordionRootProps`, `DialogRootProps`, …) —
 * обычные интерфейсы от Kobalte/Ark без индексной сигнатуры, и `Record<string, unknown>` их
 * структурно не принял бы без `as` на стороне КАЖДОГО вызывающего. Чтение по неизвестному заранее
 * ключу — задача этой функции, а не 30+ мест, которые её зовут: один `as` внутри, а не тридцать
 * снаружи. Разбор — FAQ.md (`component-skin-on-demand`).
 */
export function useComponentSkin(passport: ComponentPassport, props: object): void {
  const value = useContext(SkinContext);
  if (value === undefined) return;

  const record = props as Readonly<Record<string, unknown>>;
  const variantMark = passport.variantAxis.mark;
  const variantAttr = variantMark.kind === "attribute" ? variantMark.name : undefined;

  createEffect(() => {
    // `value.worn()` — трекнутая зависимость, не только значение: перезапускает эффект и когда
    // наряд появляется (после асинхронного restore()), и когда меняется. Разбор — FAQ.md.
    const outfitName = value.worn()?.name;
    if (outfitName === undefined) return;

    const attrValue = variantAttr === undefined ? undefined : (record[variantAttr] as string | undefined);
    value
      .ensureComponentSkin(passport.component, { kind: "variant", value: attrValue })
      .catch((cause: unknown) => console.debug(`скин компонента «${passport.component}» не допечатан`, cause));
  });

  for (const [name, setting] of Object.entries(passport.settings)) {
    if (setting.mark?.kind !== "attribute") continue;

    createEffect(() => {
      const outfitName = value.worn()?.name;
      if (outfitName === undefined) return;

      // Пропс называется по имени НАСТРОЙКИ (`name` — ключ в `passport.settings`, тип у него из
      // `defineSettings<Props>()`), а не по имени атрибута (`setting.mark.name`) — тот компонент
      // проставляет на разметку сам, своей формулой (`outlined ? "true" : undefined`, у другой
      // настройки — своя, необязательно симметричная). Прочитать, что реально ляжет в атрибут, без
      // повторения формулы каждого компонента нельзя — но эффективное значение (пропс или, если не
      // назван, `byDefault`) совпадает с ней в единственном месте, которое имеет значение: там, где
      // компонент отрисован БЕЗ явного пропса. Разбор — FAQ.md.
      const raw = record[name] as string | boolean | undefined;
      const effective = raw ?? setting.byDefault;
      const attrValue = typeof effective === "boolean" ? String(effective) : effective;

      value
        .ensureComponentSkin(passport.component, { kind: "setting", name, value: attrValue })
        .catch((cause: unknown) => console.debug(`скин компонента «${passport.component}» не допечатан`, cause));
    });
  }
}

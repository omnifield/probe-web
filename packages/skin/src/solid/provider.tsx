// Контекст на приложение вокруг `createSkinConnection`. Разбор — FAQ.md.
import {
  createContext,
  createEffect,
  createResource,
  onMount,
  untrack,
  useContext,
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
 * Компонент кита сам просит свой CSS — по значению `variant`/каждой `setting` c атрибутной меткой,
 * реактивно (значение меняется на разметке — допечатка догоняет). Без `SkinProvider` в дереве —
 * тихий no-op, не отказ: кит обязан жить без presets/провайдера вовсе, это его базовое обещание, не
 * только этого хука (`component-skin-on-demand`, ROADMAP.yaml).
 */
export function useComponentSkin(
  passport: ComponentPassport,
  props: Readonly<Record<string, unknown>>,
): void {
  const value = useContext(SkinContext);
  if (value === undefined) return;

  const variantMark = passport.variantAxis.mark;
  const variantAttr = variantMark.kind === "attribute" ? variantMark.name : undefined;

  createEffect(() => {
    // `value.worn()` — трекнутая зависимость: наряда ещё нет при монтировании (restore()
    // асинхронный) — эффект обязан перезапуститься сам, когда он появится, а не молчать до
    // следующего чужого триггера. Тот же сигнал перезапускает эффект и при смене наряда — переигрыш
    // накопленного состояния решён реактивностью, а не отдельной памятью на стороне механики.
    const outfitName = value.worn()?.name;
    if (outfitName === undefined) return;

    const attrValue = variantAttr === undefined ? undefined : (props[variantAttr] as string | undefined);
    value
      .ensureComponentSkin(passport.component, { kind: "variant", value: attrValue })
      .catch((cause: unknown) => console.debug(`скин компонента «${passport.component}» не допечатан`, cause));
  });

  for (const [name, setting] of Object.entries(passport.settings)) {
    if (setting.mark?.kind !== "attribute") continue;
    const settingAttr = setting.mark.name;

    createEffect(() => {
      const outfitName = value.worn()?.name;
      if (outfitName === undefined) return;

      const attrValue = props[settingAttr] as string | undefined;
      if (attrValue === undefined) return;

      value
        .ensureComponentSkin(passport.component, { kind: "setting", name, value: attrValue })
        .catch((cause: unknown) => console.debug(`скин компонента «${passport.component}» не допечатан`, cause));
    });
  }
}

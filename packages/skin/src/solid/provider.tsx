// Контекст на приложение вокруг `createSkinConnection`. Разбор — FAQ.md.
import {
  createContext,
  createResource,
  onMount,
  untrack,
  useContext,
  type JSX,
  type ParentProps,
  type Resource,
} from "solid-js";

import { createSkinConnection, type SkinConnection } from "./connection.js";
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

// `SkinProvider` — общая обвязка на приложение вокруг `createSkinConnection`, чтобы каждый
// продукт не писал контекст/restore-на-старте/резолв доступных скинов заново. Продукт даёт
// СВОЙ `SkinSource` (адрес и разбор своей службы раздачи — `createPresetsSkinSource` или другой),
// провайдер — реактивную обвязку сверху: соединение в контексте, восстановление запомненного
// выбора при монтировании, список имён одним общим `Resource` вместо своего в каждом потребителе.
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

/** То, что видит потребитель внутри `SkinProvider` — соединение плюс общий список имён. */
export interface SkinContextValue extends SkinConnection {
  /** Имена скинов источника — один `Resource` на приложение, не по компоненту-потребителю. */
  names: Resource<readonly string[]>;
}

const SkinContext = createContext<SkinContextValue>();

export interface SkinProviderProps extends ParentProps {
  readonly source: SkinSource;
  readonly options?: SkinSwitchOptions;
}

/**
 * Заводит `SkinConnection` на всё поддерево и сам восстанавливает запомненный выбор при
 * монтировании (тот же приём, что раньше каждый потребитель повторял через `onMount` руками).
 * Отказ восстановления — не авария приложения, только `console.debug`; узнать причину точнее —
 * дело потребителя источника (он один знает форму своих ошибок), через ручной `restore()`.
 */
export function SkinProvider(props: SkinProviderProps): JSX.Element {
  // Источник и опции берутся ОДИН раз при заведении — как и сам `createSkinConnection`, провайдер
  // не следит за их сменой на лету (сменить источник — значит перемонтировать провайдер).
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

/** Соединение и список имён из ближайшего `SkinProvider`. Вне него — отказ, не тихий `null`. */
export function useSkin(): SkinContextValue {
  const value = useContext(SkinContext);
  if (value === undefined) {
    throw new Error("[web-core-skin] useSkin(): вне <SkinProvider>.");
  }
  return value;
}

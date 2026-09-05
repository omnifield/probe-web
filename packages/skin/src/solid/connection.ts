// Реактивная обвязка над `SkinSwitch` для Solid. Разбор — FAQ.md.

import { createSignal, onCleanup, type Accessor } from "solid-js";

import { makeSkinSwitch, type SkinMode, type SkinSource, type SkinSwitchOptions, type SkinWearOptions, type SkinWorn } from "../wear/switch.js";

/** То же самое, что `SkinSwitch`, но `worn` — сигнал, а не функция по запросу. */
export interface SkinConnection {
  worn: Accessor<SkinWorn | null>;
  wear(name: string, options?: SkinWearOptions): Promise<SkinWorn | null>;
  takeOff(options?: SkinWearOptions): void;
  restore(): Promise<SkinWorn | null>;
  /** Надевает тот же скин в другой половине. Ничего не надето — не действует. */
  setMode(mode: SkinMode): void;
}

/**
 * Заводит `SkinSwitch` и оборачивает его сигналом. Зовите внутри компонента или `createRoot()` —
 * уборка вешается на `onCleanup()` самим примитивом.
 */
export function createSkinConnection(
  source: SkinSource,
  options: SkinSwitchOptions = {},
): SkinConnection {
  const skin = makeSkinSwitch(source, options);
  const [worn, setWorn] = createSignal(skin.worn());

  onCleanup(() => skin.dispose());

  async function wear(name: string, wearOptions?: SkinWearOptions): Promise<SkinWorn | null> {
    const result = await skin.wear(name, wearOptions);
    setWorn(result);
    return result;
  }

  function takeOff(wearOptions?: SkinWearOptions): void {
    skin.takeOff(wearOptions);
    setWorn(skin.worn());
  }

  async function restore(): Promise<SkinWorn | null> {
    const result = await skin.restore();
    setWorn(result);
    return result;
  }

  function setMode(mode: SkinMode): void {
    const current = worn();
    if (current === null) return;
    void wear(current.name, { mode });
  }

  return { worn, wear, takeOff, restore, setMode };
}

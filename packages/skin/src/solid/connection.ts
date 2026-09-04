// РЕАКТИВНАЯ ОБВЯЗКА (`PWEB-213`, переехала из `@web-core/runtime` — `PWEB-221`).
//
// `SkinSwitch.worn()` (`../wear.ts`) — обычная функция: читает атрибут с корня по запросу, а не
// следит за собой. Solid-потребителю этого мало — без сигнала каждый такой продукт заводит свой
// `createSignal`, руками зовёт `restore()` на монтаже, руками же досинхронизирует сигнал после
// каждого `wear()`/`takeOff()`. Один и тот же ручной код так собирался дважды подряд на одном
// продукте (`apps/skin`, независимо друг от друга) — сюда переехало то, что оба раза писали
// заново.

import { createSignal, onCleanup, type Accessor } from "solid-js";

import { makeSkinSwitch, type SkinMode, type SkinSource, type SkinSwitchOptions, type SkinWearOptions, type SkinWorn } from "../wear/switch.js";

/** То же самое, что `SkinSwitch`, но `worn` — сигнал, а не функция по запросу. */
export interface SkinConnection {
  /** Во что одета страница сейчас — реактивно. Следит за собой после `wear`/`takeOff`/`restore`. */
  worn: Accessor<SkinWorn | null>;

  /** То же, что `SkinSwitch.wear()`. Сигнал обновляет сама — досинхронизировать его не нужно. */
  wear(name: string, options?: SkinWearOptions): Promise<SkinWorn | null>;

  /** То же, что `SkinSwitch.takeOff()`. Сигнал обновляет сама. */
  takeOff(options?: SkinWearOptions): void;

  /** То же, что `SkinSwitch.restore()`. Сигнал обновляет сама. */
  restore(): Promise<SkinWorn | null>;

  /**
   * Меняет половину надетого — надевает тот же скин в другой половине. Ничего не надето —
   * менять нечего, половина без скина не бывает (см. `SkinWearOptions.mode`).
   */
  setMode(mode: SkinMode): void;
}

/**
 * Заводит `SkinSwitch` и оборачивает его сигналом. `options` — те же, что у `makeSkinSwitch()`.
 *
 * Зовите внутри компонента или `createRoot()`: уборка (`SkinSwitch.dispose()`) вешается на
 * `onCleanup()` самим примитивом, а `onCleanup()` без владельца Solid не запомнит, кого звать.
 *
 * НЕ решает: горячую замену модуля потребителя. `import.meta.hot.dispose()` — про ТЕКУЩИЙ
 * модуль, и библиотека не может повесить его за модуль, который её зовёт. `onCleanup()` здесь
 * закрывает уборку по владению Solid; закрывает ли этого достаточно для HMR-сценария продукта —
 * проверяется в нём самом, вручную, глазами на `<head>`.
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

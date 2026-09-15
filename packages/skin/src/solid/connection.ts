// Реактивная обвязка над `SkinSwitch` для Solid. Разбор — FAQ.md.

import { createSignal, onCleanup, type Accessor } from "solid-js";

import {
  makeSkinSwitch,
  type ComponentSkinAxis,
  type EnsuredSkinData,
  type SkinMode,
  type SkinSource,
  type SkinSwitchOptions,
  type SkinWearOptions,
  type SkinWorn,
} from "../wear/switch.js";

/** То же самое, что `SkinSwitch`, но `worn` — сигнал, а не функция по запросу. */
export interface SkinConnection {
  worn: Accessor<SkinWorn | null>;
  wear(name: string, options?: SkinWearOptions): Promise<SkinWorn | null>;
  takeOff(options?: SkinWearOptions): void;
  restore(): Promise<SkinWorn | null>;
  /** Переключает половину БЕЗ повторного похода к источнику — обе половины уже в CSS, приехавшем
   *  на `wear()`. Ничего не надето — не действует. */
  setMode(mode: SkinMode): void;
  /** Прямой доступ к `SkinSwitch.ensureComponentSkin` — `useComponentSkin` зовёт его сама, руками
   *  дёргать незачем, но наружу не скрыт. Побочный эффект каждого вызова — запись в
   *  {@link componentData} по имени компонента и в {@link outfitData}, см. там же. */
  ensureComponentSkin(component: string, axis: ComponentSkinAxis): Promise<EnsuredSkinData>;
  /** `data`, отданный источником на последний `ensureComponentSkin` каждого компонента (по имени) —
   *  то, что источник нашёл, пока печатал его CSS (например, запись формы), без второго запроса за
   *  тем же. Чистится целиком при смене ИМЕНИ наряда (не при смене режима — `setMode()` не ходит
   *  к источнику вовсе, и данные формы от режима не зависят). Разбор —
   *  FAQ.md (`component-skin-data-passthrough`). */
  componentData: Accessor<ReadonlyMap<string, unknown>>;
  /** То же самое, но про НАРЯД целиком (например, записи `Outfit`+`Palette`) — ОДНО значение на
   *  соединение, не карта: наряд один, не по компоненту. Приходит тем же вызовом, что и
   *  `componentData` (тот же `ensureComponentSkin`, `outfit`-поле его ответа) — второй сетевой поход
   *  не заводится. Чистится по тому же правилу, что и `componentData`. Разбор — FAQ.md
   *  (`outfit-data-passthrough`). */
  outfitData: Accessor<unknown>;
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
  const [componentData, setComponentData] = createSignal<ReadonlyMap<string, unknown>>(new Map());
  const [outfitData, setOutfitData] = createSignal<unknown>(undefined);

  onCleanup(() => skin.dispose());

  /** Единственная точка, где `worn`-сигнал реально обновляется — так чистка `componentData`/
   *  `outfitData` по смене ИМЕНИ наряда видит все три пути (`wear`/`takeOff`/`restore`) одинаково, а
   *  не только локальную обёртку `wear` ниже (которую `restore` сознательно не зовёт — он идёт через
   *  `skin.restore()` напрямую). */
  function applyWorn(result: SkinWorn | null): SkinWorn | null {
    if (result?.name !== worn()?.name) {
      setComponentData(new Map());
      setOutfitData(undefined);
    }
    setWorn(result);
    return result;
  }

  async function wear(name: string, wearOptions?: SkinWearOptions): Promise<SkinWorn | null> {
    const result = await skin.wear(name, wearOptions);
    return applyWorn(result);
  }

  function takeOff(wearOptions?: SkinWearOptions): void {
    skin.takeOff(wearOptions);
    applyWorn(skin.worn());
  }

  async function restore(): Promise<SkinWorn | null> {
    const result = await skin.restore();
    return applyWorn(result);
  }

  function setMode(mode: SkinMode): void {
    skin.setMode(mode);
    applyWorn(skin.worn());
  }

  /** Гейт по имени наряда — свой, не унаследованный от `skin.ensureComponentSkin`: тот гасит гонку
   *  ТОЛЬКО для CSS-листа (не трогает его при устаревшем ответе), а `data`/`outfit` отдаёт с тем же
   *  безусловным `return`, не различая «легитимный `undefined`» и «устарело». Без своей проверки
   *  здесь устаревший вызов старого наряда мог бы затереть в картах уже пришедшие свежие данные
   *  нового наряда своим `undefined`. */
  async function ensureComponentSkin(component: string, axis: ComponentSkinAxis): Promise<EnsuredSkinData> {
    const startedFor = worn()?.name;
    const ensured = await skin.ensureComponentSkin(component, axis);
    if (worn()?.name !== startedFor) return {};

    setComponentData((prev) => {
      const next = new Map(prev);
      next.set(component, ensured.data);
      return next;
    });
    setOutfitData(ensured.outfit);
    return ensured;
  }

  return { worn, wear, takeOff, restore, setMode, ensureComponentSkin, componentData, outfitData };
}

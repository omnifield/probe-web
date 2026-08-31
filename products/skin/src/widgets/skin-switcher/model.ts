// НАДЕТОЕ — какой скин выбран и в какой половине (восстановлено `PWEB-173`, было `pages/
// showcase/model/wearing.ts` — снято вместе со старой витриной, механика ниже цела и не менялась).
//
// НАДЕВАНИЕ ЗОВЁТСЯ, А НЕ ПОВТОРЯЕТСЯ. Лист стилей, атрибут на корне и память выбора — механика
// приложения (`runtime`, `SKIN`). Своей вставки стилей здесь нет.
//
// ВИДЖЕТ ВЛАДЕЕТ СВОИМ СОСТОЯНИЕМ ЦЕЛИКОМ — модель и разметка живут в одной папке
// (`widgets/skin-switcher/`), а не разнесены по `pages/`: переключатель скина — самостоятельная
// единица интерфейса, её можно унести в другой лайаут не разбирая витрину на части.

import {
  makeSkinSwitch,
  type SkinMode,
  type SkinWorn,
} from "@omnifield/probe-web-runtime";
import { SkinRefused } from "@omnifield/probe-web-skin";
import { OutfitRefused } from "@omnifield/probe-web-skin/model";
import { createResource, createSignal, onMount } from "solid-js";

import {
  listOutfits,
  SKIN_SOURCE,
  SERVICE_HINT,
  StoreDown,
} from "../../entities/outfit/model/index.js";
import { setWornSkin, wornSkin } from "../../entities/outfit/model/worn.js";

/** Переключатель скинов. Владеет своим листом стилей и опознанием на корне. Синглтон намеренно —
 * второй экземпляр завёл бы второй лист стилей на тот же документ. */
const SKIN = makeSkinSwitch(SKIN_SOURCE);

// ГОРЯЧАЯ ЗАМЕНА ЭТОГО МОДУЛЯ заводит НОВЫЙ `SKIN` со своим листом стилей — старый лист иначе
// остаётся сиротой в `<head>` навсегда (`dispose()` для этого и назван в контракте `runtime`).
if (import.meta.hot) {
  import.meta.hot.dispose(() => SKIN.dispose());
}

/** Причина отказа надевания — короткой строкой человеку, не в отладчик. */
function reasonOf(cause: unknown): string {
  if (cause instanceof OutfitRefused || cause instanceof SkinRefused) {
    const [first] = cause.flaws;
    const rest = cause.flaws.length - 1;

    if (first === undefined) return cause.name;

    return `${first.where}: ${first.means}${rest > 0 ? ` · и ещё изъянов: ${rest}` : ""}`;
  }

  if (cause instanceof StoreDown) return `${cause.message} · ${SERVICE_HINT}`;

  return cause instanceof Error ? cause.message : String(cause);
}

/**
 * Состояние надетого: что выбрано, в какой половине, и перечень нарядов службы.
 *
 * Фабрика, вызывается один раз на корень виджета — тем же приёмом, что и `createSignal`.
 */
export function createWearingState() {
  // НАДЕТОЕ — это имя И половина вместе: половина принадлежит скину, а не документу, и второй
  // ручки под неё не существует. Нет скина — нет и половины. ОБЩИЙ сигнал (`entities/outfit/
  // model/worn.ts`), не свой: витрине (`pages/_workspace/showcase`) нужно знать, что надето,
  // чтобы взять оттуда имена вариаций формы (`variantsOf`) — до этой правки состояние было
  // закрыто здесь, витрина зашивала список литералом.
  const worn = wornSkin;
  const setWorn = setWornSkin;

  /**
   * ОТКАЗ НАДЕВАНИЯ — состояние виджета, а не строка в отладчике. Сборка отвергает наряд целиком:
   * запись, пережившая компонент, перестаёт собираться вся, — и молчащий переключатель оставил бы
   * человека с голым китом и без причины, при живой службе и полном списке скинов.
   */
  const [refusal, setRefusal] = createSignal<string | null>(null);

  const wearing = (attempt: Promise<SkinWorn | null>): void => {
    void attempt
      .then((next) => {
        setRefusal(null);
        setWorn(next);
      })
      .catch((cause: unknown) => {
        console.debug("скин не надет", cause);
        setRefusal(reasonOf(cause));
      });
  };

  /** Сменить половину — значит надеть тот же скин в другой половине. Другого пути нет. */
  const setMode = (mode: SkinMode) => {
    const текущее = worn();

    if (текущее === null) return;

    wearing(SKIN.wear(текущее.name, { mode }));
  };

  const wear = (name: string) => {
    wearing(SKIN.wear(name));
  };

  const takeOff = () => {
    SKIN.takeOff();
    setWorn(SKIN.worn());
  };

  // Перечень НАРЯДОВ — из СЛУЖБЫ. Части по отдельности не надеваются, поэтому в списке стоят
  // наряды: палитру и формы человек видит в редакторе, а не здесь.
  const [records] = createResource(() => listOutfits());

  // Первый заход: восстанавливаем запомненный выбор, а если его нет — надеваем первый скин
  // службы и НЕ запоминаем. Чужое умолчание выбором человека не является, и памятью оно не
  // становится.
  onMount(() => {
    void (async () => {
      try {
        const restored = await SKIN.restore();
        if (restored !== null) {
          setWorn(restored);
          return;
        }

        const [first] = await SKIN.names();
        if (first !== undefined) setWorn(await SKIN.wear(first, { remember: false }));
      } catch (cause) {
        console.debug("скин не надет на первом заходе", cause);
        setRefusal(reasonOf(cause));
      }
    })();
  });

  return { worn, refusal, records, wear, takeOff, setMode };
}

export type WearingState = ReturnType<typeof createWearingState>;

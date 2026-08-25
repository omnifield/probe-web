// ГЕЙТ РАСКРЫТИЯ ВБОК — тот же приём, что у вертикали (`PWEB-105`), другая ось.
//
// ## Почему отдельный файл, а не общая параметризация
//
// Механику поднять браузер и нажать кнопку зона делит (`test/helpers/kit.ts`) — она одна и та же
// независимо от оси. А вот СНИМОК (что считать «обрезано», какое свойство мерить, где живёт
// признак раскрытости) у каждой оси свой и читается яснее по имени поля (`ширина`, а не общее
// «размер»), чем через генерик. Здесь то же разделение, каким размечена сама запись: адрес общий,
// вид по оси — свой.
//
// ## Что здесь ловится и почему иначе — никак
//
// Ровно те же три довода, что у вертикального гейта (шапка `disclosure.test.ts`): `jsdom` не
// считает раскладку, текстовая сверка отвечает на другой вопрос, а клик через DOM не двигает
// машину состояний. Плюс один — свой для горизонтали: `orientation="horizontal"` СБОРКА паспорта
// не называет вовсе (умолчание — `vertical`), и её приходится передать узлу так же, как передал
// бы её настоящий потребитель, — руками, при рисовании.

import { ask, load, withChrome, type Call } from "@omnifield/live-check";
import { beforeAll, describe, expect, it } from "vitest";

import { referenceForms, referenceOutfit, referencePalette } from "../src/index.js";
import { assemble, generateSkinCss, собранный } from "./assembled.js";
import { движенияНа, координата, собратьКит, СТРАНИЦА, тык as тыкПо } from "./helpers/kit.js";

const СОДЕРЖИМОЕ = координата("accordion", "itemContent");
const КНОПКА = координата("accordion", "itemTrigger");
const ПУНКТ = координата("accordion", "item");

/** Тычок по кнопке раздела — тем же общим приёмом, что и у вертикального гейта. */
const тык = (call: Call, номер: number): Promise<void> => тыкПо(call, КНОПКА, номер);

/**
 * Снимок всех трёх разделов ПО ШИРИНЕ — что видно человеку, а не что написано в правиле.
 *
 * `обрезано` — главный ответ пробы: содержимое, чей текст не помещается в свою же коробку по
 * ширине, показано НЕ ЦЕЛИКОМ. Схлопнутый раздел отвечает здесь «да» независимо от того, чем его
 * схлопнули.
 */
const СНИМОК = `(() => {
  const разделы = [...document.querySelectorAll('${СОДЕРЖИМОЕ}')];
  if (разделы.length !== 3) throw new Error("разделов не три — кит собрал не то, и замер бы соврал");

  return JSON.stringify(разделы.map((узел) => {
    const стиль = getComputedStyle(узел);
    return {
      ширина: Math.round(узел.getBoundingClientRect().width * 100) / 100,
      видно: узел.clientWidth,
      всего: узел.scrollWidth,
      обрезано: узел.scrollWidth > узел.clientWidth + 0.5,
      движение: стиль.animationName,
      идёт: узел.getAnimations().length,
      спрятан: узел.hidden,
      мера: узел.style.getPropertyValue("--width"),
      пункт: узел.closest('${ПУНКТ}').getAttribute("data-state"),
    };
  }));
})()`;

/** Ширины всех трёх разделов в одном кадре. */
const ШИРИНЫ = `разделы.map((узел) => Math.round(узел.getBoundingClientRect().width * 10) / 10)`;

/** Съёмка ПОКОЯ: фиксированное окно — здесь предмет, что ничего не происходит. */
const СЪЁМКА_ПОКОЯ = `(() => {
  const разделы = [...document.querySelectorAll('${СОДЕРЖИМОЕ}')];
  window.__кадры = [];
  const шаг = () => {
    window.__кадры.push(${ШИРИНЫ});
    if (window.__кадры.length < 30) requestAnimationFrame(шаг);
  };
  requestAnimationFrame(шаг);
  return true;
})()`;

/**
 * Съёмка ДВИЖЕНИЯ — идёт, пока идёт движение, а не отмеренное время.
 *
 * Приём унаследован от вертикального гейта (`PWEB-98`/`PWEB-105`) уже в починенном виде: тот
 * мигал на таймере и фиксированном числе кадров ровно потому, что тычок — несколько ходок по
 * протоколу, и под нагрузкой они съедают часть отведённого окна. Заводить здесь заново старую,
 * уже сломанную версию значило бы вернуть тот же дефект другой оси.
 */
const СЪЁМКА_ДВИЖЕНИЯ = `(() => {
  const разделы = [...document.querySelectorAll('${СОДЕРЖИМОЕ}')];
  window.__кадры = [];

  window.__съёмка = new Promise((готово) => {
    const исходные = JSON.stringify(${ШИРИНЫ});
    let началось = false;
    let тихих = 0;

    const шаг = () => {
      const идёт = разделы.some((узел) => узел.getAnimations().length > 0);
      const ширины = ${ШИРИНЫ};

      if (идёт || JSON.stringify(ширины) !== исходные) началось = true;
      тихих = идёт ? 0 : тихих + 1;

      window.__кадры.push(ширины);

      const хватит = (началось && тихих >= 5) || window.__кадры.length >= 300;
      if (хватит) готово(true); else requestAnimationFrame(шаг);
    };

    requestAnimationFrame(шаг);
  });

  return true;
})()`;

const КОНЕЦ_ДВИЖЕНИЯ = "window.__съёмка";
const КАДРЫ = "JSON.stringify(window.__кадры)";

interface Раздел {
  ширина: number;
  видно: number;
  всего: number;
  обрезано: boolean;
  движение: string;
  идёт: number;
  спрятан: boolean;
  мера: string;
  пункт: string | null;
}

interface Протокол {
  приЗагрузке: Раздел[];
  покой: number[][];
  переключение: number[][];
  после: Раздел[];
}

/** Сколько РАЗНЫХ ширин приняла эта колонка кадров: одна — движения не было. */
function различных(кадры: number[][], индекс: number): number {
  return new Set(кадры.map((кадр) => кадр[индекс]!)).size;
}

/** Один прогон: поднять горизонтальную страницу под этим листом, снять протокол. */
async function прогон(call: Call, кит: string, css: string, тише: boolean): Promise<Протокол> {
  await call("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-reduced-motion", value: тише ? "reduce" : "" }],
  });
  await load(call, СТРАНИЦА);
  await ask(call, `document.getElementById("скин").textContent = ${JSON.stringify(css)}; true`);
  await ask(call, `${кит}\n;true`);
  await ask(call, "new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)))");

  await ask(call, СЪЁМКА_ПОКОЯ);
  await ask(call, "new Promise((ok) => setTimeout(() => ok(true), 500))");
  const покой = JSON.parse(await ask(call, КАДРЫ)) as number[][];
  const приЗагрузке = JSON.parse(await ask(call, СНИМОК)) as Раздел[];

  await ask(call, СЪЁМКА_ДВИЖЕНИЯ);
  await тык(call, 1);
  await ask(call, КОНЕЦ_ДВИЖЕНИЯ);
  const переключение = JSON.parse(await ask(call, КАДРЫ)) as number[][];
  const после = JSON.parse(await ask(call, СНИМОК)) as Раздел[];

  return { приЗагрузке, покой, переключение, после };
}

const эталон = generateSkinCss(собранный.skin);

/**
 * МУТАЦИЯ ЗАДАЧИ — состояние ДО задачи: настройка легальна, а вида под ней нет.
 *
 * Ровно то, с чего задача начиналась: адрес легален (`PWEB-103`/`PWEB-104`),
 * `orientation="horizontal"` доезжает до узла, а рисовать раскрытие вбок некому — ни правил под
 * настройкой, ни движений по `--width` форма не объявляла. Кит и вертикаль в мутации не тронуты:
 * снята ровно та запись, что добавила эта задача, — settings и её два кадра.
 */
const безГоризонтали = referenceForms.map((form) => {
  if (form.component !== "accordion") return form;

  const { "раскрытие-вбок": вбок1, "закрытие-вбок": вбок2, ...движения } = form.keyframes ?? {};

  return { ...form, recipe: { ...form.recipe, settings: undefined }, keyframes: движения };
});
const сМутацией = generateSkinCss(
  assemble(referenceOutfit, { palettes: [referencePalette], forms: безГоризонтали }).skin,
);

const протоколы: Record<string, Протокол> = {};

beforeAll(async () => {
  // Единственное отличие от вертикального прогона: узел получает `orientation="horizontal"` —
  // руками, тем же способом, каким это сделал бы настоящий потребитель. Ни кит, ни его сборка не
  // трогаются: настройка ложится на корень поверх того, что назвала сборка сама.
  const кит = await собратьКит("accordion", { orientation: "horizontal" });

  await withChrome(async (call) => {
    протоколы["эталон"] = await прогон(call, кит, эталон, false);
    протоколы["тише"] = await прогон(call, кит, эталон, true);
    протоколы["мутация"] = await прогон(call, кит, сМутацией, false);
  });
}, 180_000);

describe("настройка ДЕЙСТВИТЕЛЬНО легла на узел", () => {
  it("data-orientation на корне, и раскладка ПОШЛА В РЯД — иначе замер ничего не значил", async () => {
    await withChrome(async (call) => {
      await load(call, СТРАНИЦА);
      const кит = await собратьКит("accordion", { orientation: "horizontal" });
      await ask(call, `document.getElementById("скин").textContent = ${JSON.stringify(эталон)}; true`);
      await ask(call, `${кит}\n;true`);

      const root = координата("accordion", "root");
      const итог = JSON.parse(
        await ask(
          call,
          `(() => JSON.stringify({
            orientation: document.querySelector('${root}').getAttribute("data-orientation"),
            flexDirection: getComputedStyle(document.querySelector('${root}')).flexDirection,
          }))()`,
        ),
      ) as { orientation: string | null; flexDirection: string };

      expect(итог.orientation).toBe("horizontal");
      // Прямое A/B с мутацией ниже: там при том же атрибуте раскладка остаётся `column`.
      expect(итог.flexDirection).toBe("row");
    });
  }, 30_000);
});

describe("МУТАЦИЯ ЗАДАЧИ: настройка легальна, а вида под ней нет", () => {
  // Положительный контроль первым: без него зелёный прогон ниже значил бы и «раскрытие вбок
  // работает», и «замер ничего не различает».
  //
  // ЗАМЕРЕНО, а не предположено: «вида нет» здесь означает НЕ обрезание, а полное отсутствие
  // раскладки в ряд — `flexDirection` корня остаётся `column`, будто атрибута нет вовсе, хотя он
  // стоит на узле (`data-orientation="horizontal"`, проверено там же). Содержимое при этом идёт
  // блоком на всю ширину страницы и ничем не обрезано — обрезание тут не тот сигнал: до задачи
  // раскладка просто не замечала настройку.

  it("раскладка осталась ВЕРТИКАЛЬНОЙ несмотря на атрибут — ровно то, с чего задача начиналась", async () => {
    await withChrome(async (call) => {
      const кит = await собратьКит("accordion", { orientation: "horizontal" });
      await load(call, СТРАНИЦА);
      await ask(call, `document.getElementById("скин").textContent = ${JSON.stringify(сМутацией)}; true`);
      await ask(call, `${кит}\n;true`);

      const итог = JSON.parse(
        await ask(
          call,
          `(() => JSON.stringify({
            root: getComputedStyle(document.querySelector('${координата("accordion", "root")}')).flexDirection,
            orientation: document.querySelector('${координата("accordion", "root")}').getAttribute("data-orientation"),
          }))()`,
        ),
      ) as { root: string; orientation: string | null };

      expect(итог.orientation).toBe("horizontal");
      expect(итог.root).toBe("column");
    });
  }, 30_000);
});

describe("раздел, раскрытый ИЗНАЧАЛЬНО, показан целиком ПО ШИРИНЕ", () => {
  it("текст помещается в свою коробку — ничего не обрезано", () => {
    const первый = протоколы["эталон"]!.приЗагрузке[0]!;

    expect(первый.обрезано).toBe(false);
    expect(первый.ширина).toBeGreaterThan(0);
    // Мера в покое НУЛЕВАЯ — тот же приём, что у высоты: кит ставит `--width` только на время
    // движения, и вид в покое на неё не опирается.
    expect(первый.мера).toBe("0px");
  });

  it("соседи при этом закрыты и спрятаны КИТОМ, а не скином", () => {
    for (const раздел of протоколы["эталон"]!.приЗагрузке.slice(1)) {
      expect(раздел.спрятан).toBe(true);
      expect(раздел.пункт).toBe("closed");
    }
  });
});

describe("вспышки при загрузке нет", () => {
  it("в покое ширины не шевелятся ни на кадр", () => {
    for (const индекс of [0, 1, 2]) {
      expect(различных(протоколы["эталон"]!.покой, индекс), `раздел ${индекс + 1}`).toBe(1);
    }
  });

  it("и ни одно движение не идёт", () => {
    const разделы = протоколы["эталон"]!.приЗагрузке;

    for (const раздел of разделы) expect(раздел.идёт).toBe(0);
  });
});

describe("раскрытие и закрытие идут КАДРАМИ ПО ШИРИНЕ — от настоящего указателя", () => {
  it("тычок доехал до машины состояний", () => {
    const после = протоколы["эталон"]!.после;

    expect(после[0]!.пункт).toBe("closed");
    expect(после[1]!.пункт).toBe("open");
  });

  it("раскрываемый и закрываемый разделы ЗАПУСКАЮТ настоящую анимацию, а не прыгают", async () => {
    // Спрошено у Web Animations API сразу после тычка, а не сосчитано по кадрам — тот же довод,
    // что у вертикального гейта: подсчёт различных кадров плавает с нагрузкой воркспейса, состояние
    // анимации в браузере — нет.
    await withChrome(async (call) => {
      const кит = await собратьКит("accordion", { orientation: "horizontal" });
      await load(call, СТРАНИЦА);
      await ask(call, `document.getElementById("скин").textContent = ${JSON.stringify(эталон)}; true`);
      await ask(call, `${кит}\n;true`);
      await ask(call, "new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)))");

      await тык(call, 1);
      const движения = await движенияНа(call, СОДЕРЖИМОЕ);

      // ЕСТЬ СРЕДИ идущих, а не РОВНО ОНО ОДНО — тот же довод, что у вертикального гейта:
      // безусловный переход по цвету играет рядом с именованным движением, законно.
      const идёт = (набор: typeof движения[number], name: string) =>
        набор.some((a) => a.name === name && a.duration === 320 && a.playState === "running");

      expect(идёт(движения[0]!, "закрытие-вбок"), JSON.stringify(движения[0])).toBe(true);
      expect(идёт(движения[1]!, "раскрытие-вбок"), JSON.stringify(движения[1])).toBe(true);
    });
  }, 30_000);

  it("тычком раскрытый — целиком, а не приблизительно", () => {
    // Ширина у соседей СВОЯ на законных основаниях: у раздела-2 текст короче раздела-1 («Второй
    // раздел закрыт.» против «Здесь лежит то, что раскрывают.»), и ширина по ширине пропорциональна
    // тексту — в отличие от высоты, где оба укладываются в одну строку и потому равны. Сравнивать
    // здесь не с чем, кроме как с самим собой: следующая проба.
    const тычком = протоколы["эталон"]!.после[1]!;

    expect(тычком.обрезано).toBe(false);
  });

  it("ПОЛНЫЙ ЦИКЛ (открыт → закрыт → снова открыт) возвращает раздел к исходной ширине", async () => {
    // Сравнение с СОБОЙ, а не с соседом: тот же узел, тот же текст, дважды через анимацию. Не
    // сойдись ширина после цикла с исходной статической — человек увидел бы прыжок размера при
    // возврате к разделу, который уже открывали раньше.
    await withChrome(async (call) => {
      const кит = await собратьКит("accordion", { orientation: "horizontal" });
      await load(call, СТРАНИЦА);
      await ask(call, `document.getElementById("скин").textContent = ${JSON.stringify(эталон)}; true`);
      await ask(call, `${кит}\n;true`);
      await ask(call, "new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)))");

      const исходный = (JSON.parse(await ask(call, СНИМОК)) as Раздел[])[0]!;

      await ask(call, СЪЁМКА_ДВИЖЕНИЯ);
      await тык(call, 1);
      await ask(call, КОНЕЦ_ДВИЖЕНИЯ);

      await ask(call, СЪЁМКА_ДВИЖЕНИЯ);
      await тык(call, 0);
      await ask(call, КОНЕЦ_ДВИЖЕНИЯ);

      const послеЦикла = (JSON.parse(await ask(call, СНИМОК)) as Раздел[])[0]!;

      expect(послеЦикла.пункт).toBe("open");
      expect(послеЦикла.обрезано).toBe(false);
      expect(послеЦикла.видно).toBe(исходный.видно);
    });
  }, 30_000);
});

describe("МУТАЦИЯ: движение убрано — раздел остаётся целым", () => {
  it("движения нет ни на одном разделе", () => {
    for (const раздел of протоколы["тише"]!.приЗагрузке) {
      expect(раздел.движение).toBe("none");
    }
  });

  it("изначально раскрытый по-прежнему показан целиком", () => {
    expect(протоколы["тише"]!.приЗагрузке[0]!.обрезано).toBe(false);
  });

  it("переключение доходит до конца — мгновенно и целиком", () => {
    const после = протоколы["тише"]!.после;

    expect(после[0]!.пункт).toBe("closed");
    expect(после[1]!.пункт).toBe("open");
    expect(после[1]!.обрезано).toBe(false);
    expect(после[0]!.спрятан).toBe(true);
  });

  it("и БЕЗ АНИМАЦИИ — спрошено у Web Animations API, а не сосчитано по кадрам", async () => {
    // Тот же довод, что у вертикального гейта: подсчёт различных ширин плавал под настоящей
    // нагрузкой воркспейса — Solid способен разнести один реактивный апдейт на несколько кадров
    // растровки, и это законно даже БЕЗ единой CSS-анимации.
    await withChrome(async (call) => {
      await call("Emulation.setEmulatedMedia", {
        features: [{ name: "prefers-reduced-motion", value: "reduce" }],
      });
      const кит = await собратьКит("accordion", { orientation: "horizontal" });
      await load(call, СТРАНИЦА);
      await ask(call, `document.getElementById("скин").textContent = ${JSON.stringify(эталон)}; true`);
      await ask(call, `${кит}\n;true`);
      await ask(call, "new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)))");

      await тык(call, 1);
      const движения = await движенияНа(call, СОДЕРЖИМОЕ);

      expect(движения[0]).toEqual([]);
      expect(движения[1]).toEqual([]);
    });
  }, 30_000);
});

describe("ВЕРТИКАЛЬ НЕ ЗАДЕТА: раскладка та же кнопка, но кит трогать было нельзя", () => {
  it("координата содержимого и признак раскрытости — те же атрибуты, что у вертикали", () => {
    // Косвенный, но настоящий довод: если бы кит или адрес частей поменялись под горизонталь,
    // этот же селектор перестал бы находить узлы, и `beforeAll` упал бы на «разделов не три».
    // Раз протокол собран — адрес общий для обеих ориентаций, как паспорт и обещает.
    expect(протоколы["эталон"]!.приЗагрузке).toHaveLength(3);
  });
});

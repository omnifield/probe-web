// ЖИВЫЕ ПРОБЫ РАСКРЫТИЯ — настоящим Chromium, не jsdom (`PWEB-98`, `PWEB-105`, `PWEB-111`).
//
// ОТДЕЛЬНЫЙ ФАЙЛ, а не часть `accordion.test.tsx` — находка при переезде, а не решение по
// раскладке (задача просила «accordion.test.tsx — плюс живые пробы», и здесь назван РОВНО тот
// случай, где так не получилось). Причина техническая, не вкусовая: `собратьКит` бандлит точку
// входа через `esbuild` в процессе, а `esbuild` ломается под `jsdom` — у него внутренний инвариант
// `new TextEncoder().encode("") instanceof Uint8Array`, который jsdom, подменяя глобальные классы
// своими из другого реалма, делает ложным («живого браузера нет» тут ни при чём — это отдельный,
// нативный `Uint8Array` jsdom против того, что видит модуль `esbuild`). Vitest назначает ОДНО
// окружение на файл, а не на describe-блок, и юнит-пробы гармошки (`mount`, `document` из
// `test/dom.jsx`) требуют `jsdom`, а эта проба — обычный `node`, без jsdom вообще. Ужиться в одном
// файле им негде.
//
// Живёт РЯДОМ с компонентом (та же папка), просто в файле, который матчит третий проект vitest
// (`vitest.config.ts`, `environment: "node"`) — то же разведение окружений, что и раньше
// (`test/*.test.tsx` → dom, `test/*.test.ts` → surface), только на уровне ОДНОГО компонента.
//
// Перенесено построчно из `packages/skin-reference/test/disclosure.test.ts` и
// `disclosure-horizontal.test.ts` (снесённый пакет, git-история цела на
// `git show 5d560ae:packages/skin-reference/test/disclosure.test.ts` и соответствующем пути для
// горизонтали); вид не менялся при переезде.

import { ask, load, withChrome, type Call } from "@omnifield/live-check";
import type { Outfit } from "@omnifield/probe-web-skin/model";
import { beforeAll, describe, expect, it } from "vitest";

import { движенияНа, координата, собратьКит, СТРАНИЦА, тык as тыкПо } from "../../test/kit-live.js";
import { palette } from "../../test/palette.js";
import { assemble, generateSkinCss } from "../../test/skin.js";
import { form } from "./accordion.recipe.js";

// ГЕЙТ РАСКРЫТИЯ — живым браузером, настоящим указателем и настоящей машиной состояний
// (`PWEB-98`, `PWEB-111`). Перенесено построчно из `packages/skin-reference/test/disclosure.test.ts`
// (снесённый пакет, git-история цела на
// `git show 5d560ae:packages/skin-reference/test/disclosure.test.ts`).
//
// ## Почему этот вопрос не отвечается ничем дешевле
//
// Раскрытие гармошки — единственное место кита, где вид складывается ТРОИМИ: скин пишет
// движение, кит меряет узел и кладёт меру, а машина раскрывашки решает, когда движение началось и
// кончилось. Разъехаться они могут молча:
//
//   • `jsdom` не считает раскладку вовсе — высоты у него нет, кадров нет, `--height` некому
//     измерить;
//   • текстовая сверка отвечает на другой вопрос: запись может быть безупречной по форме, а
//     раздел, открытый изначально, останется схлопнутым, потому что меру в покое кит держит
//     нулём;
//   • **клик через DOM не годится.** `el.click()` шлёт событие, но машину состояний не двигает
//     так, как её двигает человек: раскрытие идёт через указатель. Тычок здесь настоящий —
//     `Input.dispatchMouseEvent` по координатам узла.
//
// Разметку рисует ОБЪЯВЛЕННАЯ КИТОМ сборка (`assembly` паспорта, `../../test/kit-live.js`), а
// не разметка, написанная пробой, — иначе проверялось бы наше представление о ките, а не кит.
describe("раскрытие вниз — живой браузер, вертикаль", () => {
  const СОДЕРЖИМОЕ = координата("accordion", "itemContent");
  const КНОПКА = координата("accordion", "itemTrigger");
  const ПУНКТ = координата("accordion", "item");

  /** Снимок всех трёх разделов: что видно человеку, а не что написано в правиле. */
  const СНИМОК = `(() => {
    const разделы = [...document.querySelectorAll('${СОДЕРЖИМОЕ}')];
    if (разделы.length !== 3) throw new Error("разделов не три — кит собрал не то, и замер бы соврал");

    return JSON.stringify(разделы.map((узел) => {
      const стиль = getComputedStyle(узел);
      return {
        высота: Math.round(узел.getBoundingClientRect().height * 100) / 100,
        видно: узел.clientHeight,
        всего: узел.scrollHeight,
        обрезано: узел.scrollHeight > узел.clientHeight + 0.5,
        движение: стиль.animationName,
        идёт: узел.getAnimations().length,
        спрятан: узел.hidden,
        мера: узел.style.getPropertyValue("--height"),
        пункт: узел.closest('${ПУНКТ}').getAttribute("data-state"),
      };
    }));
  })()`;

  const ВЫСОТЫ = `разделы.map((узел) => Math.round(узел.getBoundingClientRect().height * 10) / 10)`;

  const СЪЁМКА_ПОКОЯ = `(() => {
    const разделы = [...document.querySelectorAll('${СОДЕРЖИМОЕ}')];
    window.__кадры = [];
    const шаг = () => {
      window.__кадры.push(${ВЫСОТЫ});
      if (window.__кадры.length < 30) requestAnimationFrame(шаг);
    };
    requestAnimationFrame(шаг);
    return true;
  })()`;

  /**
   * Съёмка ДВИЖЕНИЯ — идёт, пока идёт движение, и обещанием отвечает, когда оно кончилось.
   *
   * Не сорок кадров и таймер: тычок это несколько ходок по протоколу, и под нагрузкой они едят
   * часть отведённого окна — съёмка на таймере успевала закончиться раньше, чем машина состояний
   * доходила до движения, и проба мигала. Здесь ждём НАСТОЯЩЕГО признака (`getAnimations()`).
   */
  const СЪЁМКА_ДВИЖЕНИЯ = `(() => {
    const разделы = [...document.querySelectorAll('${СОДЕРЖИМОЕ}')];
    window.__кадры = [];

    window.__съёмка = new Promise((готово) => {
      const исходные = JSON.stringify(${ВЫСОТЫ});
      let началось = false;
      let тихих = 0;

      const шаг = () => {
        const идёт = разделы.some((узел) => узел.getAnimations().length > 0);
        const высоты = ${ВЫСОТЫ};

        if (идёт || JSON.stringify(высоты) !== исходные) началось = true;
        тихих = идёт ? 0 : тихих + 1;

        window.__кадры.push(высоты);

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
    высота: number;
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

  function различных(кадры: number[][], индекс: number): number {
    return new Set(кадры.map((кадр) => кадр[индекс]!)).size;
  }

  const тык = (call: Call, номер: number): Promise<void> => тыкПо(call, КНОПКА, номер);

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

  const outfit: Outfit = { name: "проба", palette: palette.name, forms: [form.name] };
  const эталон = generateSkinCss(assemble(outfit, { palettes: [palette], forms: [form] }).skin);

  /**
   * МУТАЦИЯ ЗАДАЧИ — прежняя запись: высота приезжает правилом по НАДЁЖНОМУ предку.
   *
   * В покое кит держит меру нулём, значит `height: var(--height)` кладёт ноль на раздел, который
   * человек видит раскрытым. Запись при этом остаётся законной — механика её пропускает.
   */
  const предок = form.recipe.base!["itemContent"]!.ancestors![0]!;
  const формаСМутацией = {
    ...form,
    recipe: {
      ...form.recipe,
      base: {
        ...form.recipe.base,
        itemContent: {
          ...form.recipe.base!["itemContent"]!,
          ancestors: [{ ...предок, style: { props: { ...предок.style.props, height: "var(--height)" } } }],
        },
      },
    },
  };
  const сМутацией = generateSkinCss(
    assemble(outfit, { palettes: [palette], forms: [формаСМутацией] }).skin,
  );

  const протоколы: Record<string, Протокол> = {};

  beforeAll(async () => {
    const кит = await собратьКит("accordion");

    await withChrome(async (call) => {
      протоколы["эталон"] = await прогон(call, кит, эталон, false);
      протоколы["тише"] = await прогон(call, кит, эталон, true);
      протоколы["мутация"] = await прогон(call, кит, сМутацией, false);
    });
  }, 180_000);

  describe("раздел, раскрытый ИЗНАЧАЛЬНО, показан целиком", () => {
    it("текст помещается в свою коробку — ничего не обрезано", () => {
      const первый = протоколы["эталон"]!.приЗагрузке[0]!;

      expect(первый.обрезано).toBe(false);
      expect(первый.высота).toBeGreaterThan(0);
      expect(первый.мера).toBe("0px");
    });

    it("соседи при этом закрыты и спрятаны КИТОМ, а не скином", () => {
      for (const раздел of протоколы["эталон"]!.приЗагрузке.slice(1)) {
        expect(раздел.спрятан).toBe(true);
        expect(раздел.пункт).toBe("closed");
      }
    });

    it("МУТАЦИЯ ЗАДАЧИ: верни высоту в правило по предку — раздел схлопывается", () => {
      const первый = протоколы["мутация"]!.приЗагрузке[0]!;

      expect(первый.обрезано).toBe(true);
      expect(первый.видно).toBeLessThan(протоколы["эталон"]!.приЗагрузке[0]!.видно);
    });
  });

  describe("вспышки при загрузке нет", () => {
    it("в покое высоты не шевелятся ни на кадр", () => {
      for (const индекс of [0, 1, 2]) {
        expect(различных(протоколы["эталон"]!.покой, индекс), `раздел ${индекс + 1}`).toBe(1);
      }
    });

    it("и ни одно движение НЕ ИДЁТ — при том что закрытым оно назначено", () => {
      const разделы = протоколы["эталон"]!.приЗагрузке;

      for (const раздел of разделы) expect(раздел.идёт).toBe(0);

      expect(разделы[0]!.движение).toBe("none");
      expect(разделы[1]!.движение).toBe("закрытие");
      expect(разделы[1]!.спрятан).toBe(true);
    });
  });

  describe("раскрытие и закрытие идут КАДРАМИ — от настоящего указателя", () => {
    it("тычок доехал до машины состояний: разделы поменялись местами", () => {
      const после = протоколы["эталон"]!.после;

      expect(после[0]!.пункт).toBe("closed");
      expect(после[1]!.пункт).toBe("open");
    });

    it("раскрываемый и закрываемый разделы ЗАПУСКАЮТ настоящую анимацию, а не прыгают", async () => {
      await withChrome(async (call) => {
        await load(call, СТРАНИЦА);
        await ask(call, `document.getElementById("скин").textContent = ${JSON.stringify(эталон)}; true`);
        await ask(call, `${await собратьКит("accordion")}\n;true`);
        await ask(call, "new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)))");

        await тык(call, 1);
        const движения = await движенияНа(call, СОДЕРЖИМОЕ);

        const идёт = (набор: typeof движения[number], name: string) =>
          набор.some((a) => a.name === name && a.duration === 320 && a.playState === "running");

        expect(идёт(движения[0]!, "закрытие"), JSON.stringify(движения[0])).toBe(true);
        expect(идёт(движения[1]!, "раскрытие"), JSON.stringify(движения[1])).toBe(true);
      });
    }, 30_000);

    it("раскрытый тычком выглядит так же, как раскрытый изначально", () => {
      const изначально = протоколы["эталон"]!.приЗагрузке[0]!;
      const тычком = протоколы["эталон"]!.после[1]!;

      expect(тычком.обрезано).toBe(false);
      expect(тычком.видно).toBe(изначально.видно);
    });
  });

  describe("МУТАЦИЯ: движение убрано — раздел остаётся целым", () => {
    it("движения нет ни на одном разделе", () => {
      for (const раздел of протоколы["тише"]!.приЗагрузке) {
        expect(раздел.движение).toBe("none");
      }
    });

    it("изначально раскрытый по-прежнему показан целиком", () => {
      expect(протоколы["тише"]!.приЗагрузке[0]!.обрезано).toBe(false);
      expect(протоколы["тише"]!.приЗагрузке[0]!.видно).toBe(
        протоколы["эталон"]!.приЗагрузке[0]!.видно,
      );
    });

    it("переключение доходит до конца — мгновенно и целиком", () => {
      const после = протоколы["тише"]!.после;

      expect(после[0]!.пункт).toBe("closed");
      expect(после[1]!.пункт).toBe("open");
      expect(после[1]!.обрезано).toBe(false);
      expect(после[0]!.спрятан).toBe(true);
    });

    it("и БЕЗ АНИМАЦИИ — иначе просьбу никто не услышал", async () => {
      await withChrome(async (call) => {
        await call("Emulation.setEmulatedMedia", {
          features: [{ name: "prefers-reduced-motion", value: "reduce" }],
        });
        await load(call, СТРАНИЦА);
        await ask(call, `document.getElementById("скин").textContent = ${JSON.stringify(эталон)}; true`);
        await ask(call, `${await собратьКит("accordion")}\n;true`);
        await ask(call, "new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)))");

        await тык(call, 1);
        const движения = await движенияНа(call, СОДЕРЖИМОЕ);

        expect(движения[0]).toEqual([]);
        expect(движения[1]).toEqual([]);
      });
    }, 30_000);
  });
});

// ГЕЙТ РАСКРЫТИЯ ВБОК — тот же приём, что у вертикали (`PWEB-105`, `PWEB-111`), другая ось.
// Перенесено построчно из
// `packages/skin-reference/test/disclosure-horizontal.test.ts` (снесённый пакет, git-история
// цела на `git show 5d560ae:packages/skin-reference/test/disclosure-horizontal.test.ts`).
//
// Механику поднять браузер и нажать кнопку зона делит (`../../test/kit-live.js`) — она одна и та
// же независимо от оси. СНИМОК (что считать «обрезано», какое свойство мерить) у каждой оси свой
// и читается яснее по имени поля (`ширина`, а не общее «размер»), чем через генерик.
//
// Плюс один довод, свой для горизонтали: `orientation="horizontal"` СБОРКА паспорта не называет
// вовсе (умолчание — `vertical`), и её приходится передать узлу так же, как передал бы её
// настоящий потребитель, — руками, при рисовании (`собратьКит("accordion", {orientation:…})`).
describe("раскрытие вбок — живой браузер, горизонталь", () => {
  const СОДЕРЖИМОЕ = координата("accordion", "itemContent");
  const КНОПКА = координата("accordion", "itemTrigger");
  const ПУНКТ = координата("accordion", "item");

  const тык = (call: Call, номер: number): Promise<void> => тыкПо(call, КНОПКА, номер);

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

  const ШИРИНЫ = `разделы.map((узел) => Math.round(узел.getBoundingClientRect().width * 10) / 10)`;

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

  function различных(кадры: number[][], индекс: number): number {
    return new Set(кадры.map((кадр) => кадр[индекс]!)).size;
  }

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

  const outfit: Outfit = { name: "проба", palette: palette.name, forms: [form.name] };
  const эталон = generateSkinCss(assemble(outfit, { palettes: [palette], forms: [form] }).skin);

  /**
   * МУТАЦИЯ ЗАДАЧИ — состояние ДО задачи: настройка легальна, а вида под ней нет.
   *
   * Адрес легален (`PWEB-103`/`PWEB-104`), `orientation="horizontal"` доезжает до узла, а
   * рисовать раскрытие вбок некому — ни правил под настройкой, ни движений по `--width` форма не
   * объявляла. Кит и вертикаль в мутации не тронуты: снята ровно та запись, что добавила эта
   * задача, — `settings` и её два кадра.
   */
  const { "раскрытие-вбок": вбок1, "закрытие-вбок": вбок2, ...движенияБезГоризонтали } =
    form.keyframes ?? {};
  const формаБезГоризонтали = {
    ...form,
    recipe: { ...form.recipe, settings: undefined },
    keyframes: движенияБезГоризонтали,
  };
  const сМутацией = generateSkinCss(
    assemble(outfit, { palettes: [palette], forms: [формаБезГоризонтали] }).skin,
  );

  const протоколы: Record<string, Протокол> = {};

  beforeAll(async () => {
    // Единственное отличие от вертикального прогона: узел получает `orientation="horizontal"` —
    // руками, тем же способом, каким это сделал бы настоящий потребитель.
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
        expect(итог.flexDirection).toBe("row");
      });
    }, 30_000);
  });

  describe("МУТАЦИЯ ЗАДАЧИ: настройка легальна, а вида под ней нет", () => {
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
      await withChrome(async (call) => {
        const кит = await собратьКит("accordion", { orientation: "horizontal" });
        await load(call, СТРАНИЦА);
        await ask(call, `document.getElementById("скин").textContent = ${JSON.stringify(эталон)}; true`);
        await ask(call, `${кит}\n;true`);
        await ask(call, "new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok)))");

        await тык(call, 1);
        const движения = await движенияНа(call, СОДЕРЖИМОЕ);

        const идёт = (набор: typeof движения[number], name: string) =>
          набор.some((a) => a.name === name && a.duration === 320 && a.playState === "running");

        expect(идёт(движения[0]!, "закрытие-вбок"), JSON.stringify(движения[0])).toBe(true);
        expect(идёт(движения[1]!, "раскрытие-вбок"), JSON.stringify(движения[1])).toBe(true);
      });
    }, 30_000);

    it("тычком раскрытый — целиком, а не приблизительно", () => {
      const тычком = протоколы["эталон"]!.после[1]!;

      expect(тычком.обрезано).toBe(false);
    });

    it("ПОЛНЫЙ ЦИКЛ (открыт → закрыт → снова открыт) возвращает раздел к исходной ширине", async () => {
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
      expect(протоколы["эталон"]!.приЗагрузке).toHaveLength(3);
    });
  });
});

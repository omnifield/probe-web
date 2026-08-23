// ШВЫ С ЧУЖИМИ ЗОНАМИ — то, на что механика скина опирается, но чем не владеет.
//
// Швы трёх родов, и ломаются они одинаково — молча:
//
//   • **ИМЕНА**, которые мы адресуем, а объявляет и ставит кто-то другой;
//   • **ПОВЕДЕНИЕ** чужой функции, от которого зависит наш ответ;
//   • **ВКЛАД** чужой поставки в общий ответ каскада — в том числе НУЛЕВОЙ.
//
// Место одно намеренно: сюда смотрят, когда спрашивают «на что мы опираемся у соседей». Разложи
// эти пробы по предметным файлам — и вопрос перестанет иметь адрес.
//
// ## Имена: что здесь чинится
//
// `data-node` объявляет и ставит механика сборки (`assembly`), класс тёмной пары — `runtime` со
// зоной значений. У нас они записаны вторыми копиями (`src/marks.ts`), потому что наружу ни одна
// из зон их не отдаёт: у `assembly` это литерал прямо в отрисовке, у `runtime` — внутренняя
// константа за замороженной поверхностью.
//
// Вторая копия опасна не тем, что она копия, а тем, КАК она ломается. Переименуют у хозяина —
// здесь останется прежнее, генератор напишет селектор, который ни во что не попадает, и отказа
// не будет: правило просто не сработает, а чинить пойдут ВИД.
//
// Эти пробы превращают тишину в красноту. Они не сверяют строки — они берут НАСТОЯЩИЙ вывод
// чужой зоны и спрашивают, попадает ли в него наш селектор. Переименование у хозяина роняет
// пробу в тот же прогон.
//
// **Это заплатка на время, а не решение.** Имя обязано приходить оттуда, где его ставят; один
// дом для обоих — cross-zone решение, поднято архитектору. Обе зоны стоят здесь
// `devDependency` — в поставку не едут.
//
// ## Поведение: что здесь чинится
//
// Читаемость считает пары ТЕМ разбором цвета, который отдаёт зона значений. Что он понимает, а
// что нет, решает она; наш ответ на этом стоит целиком.
//
// Сузься разбор обратно — скин, написанный ходовыми записями, целиком уехал бы в «посчитать
// нечем». Ответ остался бы честным и совершенно бесполезным: нечитаемая кнопка проехала бы
// молча, а перечень выглядел бы работающим.
//
// Проба берёт наш ОТВЕТ, а не чужую функцию: чужую зону проверяет её владелец, а мы проверяем
// то, на что опираемся.

import { createRegistry, RenderTree, type AssemblyTree } from "@omnifield/probe-web-assembly";
import { makeSkinSwitch, type SkinSource } from "@omnifield/probe-web-runtime";
import { kitOf } from "@omnifield/probe-web-ui";
import { admits, passportOf } from "@omnifield/probe-web-ui/passport";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import postcss from "postcss";
import { afterEach, describe, expect, it } from "vitest";

import { skinContrast } from "../src/contrast.js";
import { generateSketchCss, generateSkinCss } from "../src/generate.js";
import { nodeSelector } from "../src/address.js";
import type { SketchEdit, Skin } from "../src/model.js";
import { lookup } from "./passports.js";
import { cleanup, mount } from "./dom.jsx";

afterEach(() => {
  cleanup();
  document.documentElement.className = "";
});

const registry = createRegistry({
  // ПАРА поставщика, а не карта компонентов рядом с паспортами (`PWEB-85`). Кит отдаёт паспорт
  // вместе с тем, чем рисуется каждая его часть, — собери мы карту у себя, она разошлась бы с
  // анатомией молча, и добавленная китом часть осталась бы неодетой.
  components: { button: kitOf("button")! },
  admits,
});

const tree: AssemblyTree = {
  components: {
    root: "btn-1",
    nodes: { "btn-1": { id: "btn-1", type: "button", parentId: null, children: [] } },
  },
};

/** Селекторы порождённого текста — как их видит парсер, а не поиск подстроки. */
function selectorsOf(css: string): string[] {
  const found: string[] = [];
  postcss.parse(css).walkRules((rule) => {
    found.push(rule.selector);
  });
  return found;
}

describe("шов с механикой сборки: признак узла", () => {
  const edits: readonly SketchEdit[] = [
    { node: "btn-1", component: "button", part: "root", style: { props: { color: "red" } } },
  ];

  it("наш селектор правки образца попадает в узел, который нарисовала ЧУЖАЯ механика", () => {
    const host = mount(() => <RenderTree tree={tree} registry={registry} />);
    const node = host.querySelector("button")!;

    // Не сверка строк: узел отрисован механикой сборки, признак поставила она, а спрашиваем мы
    // своим селектором. Переименует она признак — попадать станет некуда, и проба покраснеет.
    expect(node.matches(nodeSelector("btn-1"))).toBe(true);

    for (const selector of selectorsOf(generateSketchCss(edits, lookup))) {
      expect(node.matches(selector)).toBe(true);
    }
  });

  it("координата и признак узла живут на ОДНОМ узле — это две области одного адреса", () => {
    const host = mount(() => <RenderTree tree={tree} registry={registry} />);
    const node = host.querySelector("button")!;

    expect(node.matches('[data-scope="button"][data-part="root"]')).toBe(true);
    expect(node.matches(nodeSelector("btn-1"))).toBe(true);
  });
});

// ## Половина приезжает ВМЕСТЕ СО СКИНОМ, и дверь тут одна
//
// Режим — половина скина, а не свойство документа, и у рантайма это выражено формой вызова:
// `wear(имя, { mode })`. Отдельной ручки режима нет вовсе — она была бы вторым ответом на
// вопрос «во что одета страница».
//
// Поэтому проба надевает: не «сначала оденем, потом затемним», а одним движением — тем самым,
// которым это делает приложение. Спрашиваем по-прежнему одно: попадает ли наш селектор тёмной
// половины в тот корень, который затемнил ЧУЖОЙ рантайм.
//
// Атрибут и класс проба руками не ставит: зашей мы их здесь, она перестала бы ловить
// переименование у хозяина — ровно то, ради чего этот файл существует.
describe("шов с рантаймом: тёмная пара", () => {
  const skin: Skin = {
    name: "пара",
    variables: { light: { ink: "black" }, dark: { ink: "white" } },
    recipes: {},
  };

  /** Селектор тёмной половины — тот, что порождён, а не записанный в пробе. */
  const css = generateSkinCss(skin, lookup);
  const darkSelector = selectorsOf(css).find((selector) =>
    selector.startsWith(":root") && selector !== ":root",
  )!;

  /**
   * Источник скинов приложения — наш же порождённый текст. Что именно в листе, здесь не
   * важно: проба спрашивает СЕЛЕКТОР, а не вычисленный вид (тот проверяет `passage`).
   */
  const source: SkinSource = { names: () => [skin.name], css: () => css };

  /** Свой ключ памяти: чужую запись выбора проба трогать не должна. */
  const KEY = "probe-web:шов-тёмная-пара";
  const worn = makeSkinSwitch(source, { storageKey: KEY });

  afterEach(() => {
    worn.takeOff({ remember: false });
    worn.dispose();
    // Память чистим руками: одна проба запоминает выбор намеренно, и утечь в следующую он не
    // должен — иначе соседняя проба мерила бы вчерашний выбор вместо своего.
    localStorage.removeItem(KEY);
  });

  it("порождённая тёмная половина цепляется за корень, который затемнил ЧУЖОЙ рантайм", async () => {
    await worn.wear(skin.name, { mode: "dark", remember: false });

    expect(document.documentElement.matches(darkSelector)).toBe(true);
  });

  it("в светлой половине — не цепляется: светлая это ОТСУТСТВИЕ признака", async () => {
    await worn.wear(skin.name, { mode: "light", remember: false });

    expect(document.documentElement.matches(darkSelector)).toBe(false);
  });

  it("на ГОЛОМ корне тёмная половина не цепляется НИКОГДА — надевать её не звали", () => {
    // Половине взяться неоткуда: она приезжает со скином, а скин не надет. Проба заодно держит
    // и наш вывод: селектор тёмной половины обязан ТРЕБОВАТЬ признака, а не совпадать со всем.
    expect(worn.worn()).toBeNull();
    expect(document.documentElement.matches(darkSelector)).toBe(false);
  });

  it("светлая половина цепляется за корень всегда — она не про режим", async () => {
    await worn.wear(skin.name, { mode: "dark", remember: false });

    expect(document.documentElement.matches(":root")).toBe(true);
  });

  it("надевание БЕЗ имени половины стоящую не сбрасывает — молчание это не «светлая»", async () => {
    // Новое обещание рантайма, и наш вывод стоит на нём целиком: половина ставится, когда её
    // НАЗВАЛИ, — своим именем или запомненным. Не названо ни там, ни там — документ не трогается.
    //
    // Читай рантайм молчание как «светлая», перекраска скина на лету сбрасывала бы тёмную у
    // человека, который её выбрал, и наша тёмная половина отцеплялась бы посреди работы.
    await worn.wear(skin.name, { mode: "dark", remember: false });
    expect(document.documentElement.matches(darkSelector)).toBe(true);

    await worn.wear(skin.name, { remember: false });

    expect(document.documentElement.matches(darkSelector)).toBe(true);
  });

  it("названная половина сильнее запомненной — её называют сейчас, а ту выбрали когда-то", async () => {
    // Вторая сторона того же обещания. Молчание не трогает документ (проба выше), а слово —
    // трогает, и трогает поверх памяти. Не будь так, человек, переключивший половину, видел бы
    // вчерашнюю: наша тёмная цеплялась бы не тогда, когда её попросили.
    await worn.wear(skin.name, { mode: "light" });
    expect(document.documentElement.matches(darkSelector)).toBe(false);

    await worn.wear(skin.name, { mode: "dark", remember: false });

    expect(document.documentElement.matches(darkSelector)).toBe(true);
  });
});

// ## Про режим отвечает скин, и только он: вклад базы равен НУЛЮ
//
// Третий шов того же рода, что первые два, только опираемся здесь не на имя и не на поведение
// функции, а на ВКЛАД чужой поставки в общий ответ каскада. Вклад бывает и нулевым — как раз
// этот случай, — и нулевым он обязан быть так же проверяемо, как ненулевым.
//
// ## Какое решение проба кодировала раньше и почему оно снято
//
// Было: «база объявляет СПОСОБНОСТЬ (`color-scheme: light dark`), голое приложение следует за
// настройкой человека, а наш ответ эту способность перебивает». Пробы ждали от базы `light
// dark`.
//
// Решение отменено (`PWEB-61`, `05a14bf`) — и отменено ЗАМЕРОМ, а не вкусом: без строки в базе
// браузер отвечает `normal` и рисует светлое при любой настройке системы. То есть «следование
// за человеком» бралось целиком из НАШЕГО объявления и было видом от фреймворка, а не его
// отсутствием. Обоснование не выдержало проверки, и вместе с ним ушло объявление.
//
// Записано это здесь, а не стёрто: через выпуск строку вернут как «потерянную», и вопрос
// «почему база молчит?» придётся выводить заново.
//
// ## Что проба кодирует ТЕПЕРЬ
//
//   голая страница (только база)  → базовый слой о режиме не говорит НИЧЕГО
//   надет скин                    → отвечает та половина, которую назвал скин
//   скин снят                     → база молчит снова
//
// Это сильнее прежнего: раньше проверялось, что база что-то объявляет, теперь — что её вклад
// РАВЕН НУЛЮ, а весь ответ даёт скин.
//
// «Ноль» здесь не записан значением намеренно. Сравнивается ответ документа С базой и БЕЗ
// единого листа: запиши мы ожидаемое словом (`normal`), проба стала бы слепком текущего вывода
// — тем самым, чего делать было нельзя.
//
// Материал НАСТОЯЩИЙ — тот `base.css`, который уезжает потребителю. Сверять с копией строки
// здесь бессмысленно: вопрос не «что написано у соседа», а что из этого следует в каскаде.
describe("шов с базовым слоем: вклад базы в режим равен нулю", () => {
  const base = readFileSync(
    createRequire(import.meta.url).resolve("@omnifield/probe-web-style/base.css"),
    "utf8",
  );

  const skin: Skin = {
    name: "пара",
    variables: { light: { ink: "black" }, dark: { ink: "white" } },
    recipes: {},
  };

  /** Порядок листов — тот, что объявлен контрактом подключения: база, затем скин. */
  function sheets(...texts: readonly string[]): HTMLStyleElement[] {
    return texts.map((css) => {
      const tag = document.createElement("style");
      tag.textContent = css;
      document.head.append(tag);
      return tag;
    });
  }

  /** Что документ отвечает про режим сейчас. */
  function mode(): string {
    return getComputedStyle(document.documentElement).getPropertyValue("color-scheme").trim();
  }

  /** Ответ документа, к которому не подключено НИЧЕГО, — точка отсчёта, а не записанное слово. */
  const silence = mode();

  afterEach(() => {
    document.head.querySelectorAll("style").forEach((tag) => tag.remove());
  });

  it("голая страница: базовый слой о режиме не говорит НИЧЕГО", () => {
    sheets(base);

    expect(mode()).toBe(silence);
  });

  it("надет скин — отвечает та половина, которую назвал он", () => {
    // Он же положительный контроль: без него «база молчит» проходило бы и на замере, который
    // не умеет замечать вообще ничего.
    sheets(base, generateSkinCss(skin, lookup));

    expect(mode()).not.toBe(silence);
    expect(mode()).toBe("light");
    document.documentElement.classList.add("dark");
    expect(mode()).toBe("dark");
  });

  it("скин снят — база молчит снова", () => {
    const [, worn] = sheets(base, generateSkinCss(skin, lookup));

    expect(mode()).toBe("light");
    worn!.remove();

    expect(mode()).toBe(silence);
  });
});

describe("шов с зоной значений: разбор цвета", () => {
  /** Один и тот же слабый текст на белом, записанном по-разному: 3.03 при норме 4.5. */
  function verdict(background: string): string[] {
    const skin: Skin = {
      name: "запись",
      recipes: { button: { base: { root: { props: { color: "#949494", background } } } } },
    };

    return skinContrast(skin, [passportOf("button")!]).notes.map((note) =>
      note.kind === "low" ? `low ${note.half}` : `?${note.kind}`,
    );
  }

  it("ходовые записи СЧИТАЮТСЯ, а не уходят в «посчитать нечем»", () => {
    // До `PWEB-42` разбор понимал ровно `oklch(…)` и шестнадцатеричную запись, и скин,
    // написанный по-людски, проверку проезжал целиком. Сузься перечень обратно — упадёт здесь.
    for (const background of [
      "rgb(255, 255, 255)",
      "rgb(255 255 255)",
      "white",
      "hsl(0 0% 100%)",
      "hwb(0 100% 0%)",
      "#fff",
      "oklch(1 0 0)",
    ]) {
      expect(verdict(background)).toEqual(["low light", "low dark"]);
    }
  });

  it("а неразобранное по-прежнему называется неразобранным", () => {
    // Обратная сторона того же шва: расширение перечня не должно превращать «не знаю такой
    // записи» в тихое «всё хорошо».
    expect(verdict("color-mix(in oklch, red, blue)")).toEqual([
      "?unreckonable",
      "?unreckonable",
    ]);
  });
});

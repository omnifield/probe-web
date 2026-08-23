// Надевание и снятие скина: источник, выбор по имени, снятие, память выбора.
//
// Проект `skin` в `vitest.config.ts` — JSDOM без Solid и без JSX-трансформа: механика обязана
// работать без Solid, и проба, поднимающая его, доказывала бы обратное.
//
// Скины здесь — НАСТОЯЩИЙ CSS в настоящем листе, а вид проверяется вычисленным на корне
// значением. Подставить сюда «наш узел получил такой-то текст» значило бы проверить нашу же
// подстановку: вопрос механики не в том, что мы положили строку, а в том, что вид приехал.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeSkinSwitch, type SkinSource } from "../src/index.js";

const STORAGE_KEY = "probe-web:skin";

const root = () => document.documentElement;

/** Вычисленное на корне значение — то, что увидит браузер, а не то, что мы записали. */
const seen = (token: string) => getComputedStyle(root()).getPropertyValue(token).trim();

/** Наши листы — по метке владельца. Их число и есть ответ на «не плодим ли теги». */
const ours = () => [...document.head.querySelectorAll("style[data-probe-web-skin]")];

/** Скин как текст: объявляет своё значение на корне. */
const skinCss = (radius: string) => `:root { --radius: ${radius}; }`;

const SKINS: Record<string, string> = {
  twitter: skinCss("1.3rem"),
  brutal: skinCss("0rem"),
};

/** Источник приложения — обычный объект. Механика про его устройство не знает ничего. */
function givenSource(skins: Record<string, string> = SKINS): SkinSource {
  return {
    names: () => Object.keys(skins),
    css: (name) => {
      const css = skins[name];
      if (css === undefined) throw new Error(`нет скина «${name}»`);
      return css;
    },
  };
}

/** Тот же источник, но отвечающий не сразу — как настоящая служба. */
function givenSlowSource(delays: Record<string, number>): SkinSource {
  return {
    names: () => Promise.resolve(Object.keys(SKINS)),
    css: (name) =>
      new Promise((resolve) => {
        setTimeout(() => resolve(SKINS[name] ?? ""), delays[name] ?? 0);
      }),
  };
}

beforeEach(() => {
  document.head.innerHTML = "";
  root().removeAttribute("data-skin");
  root().removeAttribute("data-theme");
  root().classList.remove("dark");
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("надевание и снятие", () => {
  it("надевает скин по имени: вид приезжает, опознание встаёт на КОРЕНЬ", async () => {
    const skin = makeSkinSwitch(givenSource());

    const after = await skin.wear("twitter");

    expect(seen("--radius")).toBe("1.3rem");
    expect(root().getAttribute("data-skin")).toBe("twitter");
    expect(after).toEqual({ name: "twitter", mode: "light" });
    expect(skin.worn()).toEqual({ name: "twitter", mode: "light" });
  });

  it("снимает скин — остаётся ГОЛЫЙ КИТ: ни листа, ни опознания, ни значений", async () => {
    const skin = makeSkinSwitch(givenSource());
    await skin.wear("twitter");

    skin.takeOff();

    expect(ours()).toHaveLength(0);
    expect(root().hasAttribute("data-skin")).toBe(false);
    expect(seen("--radius")).toBe("");
    expect(skin.worn()).toBeNull();
  });

  it("до первого надевания не делает НИЧЕГО — ни листа, ни обращения к источнику", () => {
    const source = givenSource();
    const asked = vi.spyOn(source, "css");

    makeSkinSwitch(source);

    expect(ours()).toHaveLength(0);
    expect(asked).not.toHaveBeenCalled();
    expect(root().hasAttribute("data-skin")).toBe(false);
  });

  // Проверяем ТОТ ЖЕ САМЫЙ узел, а не «узел один». Разница в том, что мигание при смене скина
  // даёт снятие старого листа перед разбором нового, и число листов до и после у обоих способов
  // одинаково — отличает их только тождество узла. Кадра голого кита в JSDOM не увидеть, и
  // тождество здесь единственная машинно проверяемая тень этого свойства.
  it("смена скина заменяет текст в ТОМ ЖЕ листе, а не вешает новый", async () => {
    const skin = makeSkinSwitch(givenSource());

    await skin.wear("twitter");
    const first = ours()[0];
    await skin.wear("brutal");

    expect(ours()).toHaveLength(1);
    expect(ours()[0]).toBe(first);
    expect(seen("--radius")).toBe("0rem");
    expect(root().getAttribute("data-skin")).toBe("brutal");
  });

  it("снятие и повторное надевание работают: голо → одето → голо → одето", async () => {
    const skin = makeSkinSwitch(givenSource());

    await skin.wear("twitter");
    skin.takeOff();
    await skin.wear("brutal");

    expect(ours()).toHaveLength(1);
    expect(seen("--radius")).toBe("0rem");
  });

  it("отдаёт перечень источника как есть — и синхронного, и обещанием", async () => {
    expect(await makeSkinSwitch(givenSource()).names()).toEqual(["twitter", "brutal"]);
    expect(await makeSkinSwitch(givenSlowSource({})).names()).toEqual(["twitter", "brutal"]);
  });
});

describe("механика необязательна", () => {
  // Гейт задачи: страница, подключившая файл скина САМА, обязана выглядеть так же. Это и есть
  // граница «механика снимает ручную работу, а не является путём к результату».
  it("статическая страница со своим листом выглядит так же, как одетая механикой", async () => {
    const byHand = document.createElement("style");
    byHand.textContent = SKINS.twitter;
    document.head.append(byHand);
    root().setAttribute("data-skin", "twitter");

    const handmade = seen("--radius");

    document.head.innerHTML = "";
    root().removeAttribute("data-skin");
    await makeSkinSwitch(givenSource()).wear("twitter");

    expect(seen("--radius")).toBe(handmade);
    expect(root().getAttribute("data-skin")).toBe("twitter");
  });

  it("приложение без единого скина живёт: пустой источник — не отказ", async () => {
    const skin = makeSkinSwitch({ names: () => [], css: () => "" });

    expect(await skin.names()).toEqual([]);
    expect(await skin.restore()).toBeNull();
    expect(ours()).toHaveLength(0);
    expect(skin.worn()).toBeNull();
  });
});

// Режим — ПОЛОВИНА СКИНА, и дверь к нему одна: его называют при надевании. Отдельной ручки
// нет намеренно — она была бы вторым ответом на вопрос «во что одета страница».
describe("половина приезжает вместе со скином", () => {
  it("НАЗВАННАЯ половина ставится", async () => {
    await makeSkinSwitch(givenSource()).wear("twitter", { mode: "dark" });

    expect(root().classList.contains("dark")).toBe(true);
  });

  it("названная сильнее запомненной — её называют сейчас, запомненную выбрали когда-то", async () => {
    const skin = makeSkinSwitch(givenSource());
    await skin.wear("twitter", { mode: "dark" });

    await skin.wear("brutal", { mode: "light" });

    expect(root().classList.contains("dark")).toBe(false);
    expect(skin.worn()).toEqual({ name: "brutal", mode: "light" });
  });

  it("не названа — встаёт ЗАПОМНЕННАЯ: выбор человека ждал своей половины", async () => {
    await makeSkinSwitch(givenSource()).wear("twitter", { mode: "dark" });

    // Следующий заход: документ чист, память та же.
    document.head.innerHTML = "";
    root().removeAttribute("data-skin");
    root().classList.remove("dark");

    await makeSkinSwitch(givenSource()).wear("brutal");

    expect(root().classList.contains("dark")).toBe(true);
  });

  it("НЕ НАЗВАНА И НЕ ЗАПОМНЕНА — не ставится ничего: свою половину назовёт сам скин", async () => {
    // Система говорит тёмный — и это ничего не меняет. Без неё проба была бы пустой: «не
    // поставили» и «поставили светлую» на документе выглядят одинаково.
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("dark"),
      media: query,
    }));

    await makeSkinSwitch(givenSource()).wear("twitter");

    expect(root().classList.contains("dark")).toBe(false);
    expect(root().className).toBe("");
  });

  it("«не ставится ничего» — это НЕ ТРОГАЕМ: половину, стоящую на странице, не сбрасываем", async () => {
    // Страница пришла тёмной сама — так одевается статическая страница без механики. Нам её
    // половину не называли и мы её не помним; значит и мнения о ней у нас нет. Подставь мы
    // светлую «по умолчанию» — механика молча раздела бы чужой выбор, и на чистом документе
    // этого было бы не видно: светлая половина и есть отсутствие класса.
    root().classList.add("dark");

    await makeSkinSwitch(givenSource()).wear("twitter");

    expect(root().classList.contains("dark")).toBe(true);
  });

  it("снятие уносит половину вместе со скином — голое состояние целиком голое", async () => {
    const skin = makeSkinSwitch(givenSource());
    await skin.wear("twitter", { mode: "dark" });

    skin.takeOff();

    expect(root().classList.contains("dark")).toBe(false);
    expect(root().className).toBe("");
  });

  it("снятая половина не забыта: следующий скин надевается с ней же", async () => {
    const skin = makeSkinSwitch(givenSource());
    await skin.wear("twitter", { mode: "dark" });
    skin.takeOff();

    await skin.wear("brutal");

    expect(root().classList.contains("dark")).toBe(true);
  });

  it("половина читается с корня, а не из памяти — одеться могли и без нас", async () => {
    const skin = makeSkinSwitch(givenSource());
    await skin.wear("twitter");
    root().classList.add("dark");

    expect(skin.worn()).toEqual({ name: "twitter", mode: "dark" });
  });

  // Шестой пункт потока, и он проверяется, а не подразумевается.
  it("ЧЕЛОВЕК, ВЫБРАВШИЙ СКИН И ПОЛОВИНУ, В СЛЕДУЮЩИЙ ЗАХОД ВИДИТ ИХ ЖЕ", async () => {
    await makeSkinSwitch(givenSource()).wear("brutal", { mode: "dark" });

    // Перезагрузка: документ пришёл чистым, хранилище — нет.
    document.head.innerHTML = "";
    root().removeAttribute("data-skin");
    root().classList.remove("dark");

    const next = makeSkinSwitch(givenSource());

    expect(await next.restore()).toEqual({ name: "brutal", mode: "dark" });
    expect(seen("--radius")).toBe("0rem");
    expect(root().classList.contains("dark")).toBe(true);
  });

  it("запасная половина от приложения ставится, когда памяти нет — это его выбор", async () => {
    const skin = makeSkinSwitch(givenSource(), { fallback: { skin: "twitter", mode: "dark" } });

    expect(await skin.restore()).toEqual({ name: "twitter", mode: "dark" });
  });

  it("запомненная половина сильнее запасной — человек уже выбрал", async () => {
    await makeSkinSwitch(givenSource()).wear("brutal", { mode: "light" });
    root().removeAttribute("data-skin");
    document.head.innerHTML = "";

    const next = makeSkinSwitch(givenSource(), { fallback: { skin: "twitter", mode: "dark" } });

    expect(await next.restore()).toEqual({ name: "brutal", mode: "light" });
  });
});

describe("память выбора", () => {
  it("запоминает надетое и восстанавливает его в следующем заходе", async () => {
    await makeSkinSwitch(givenSource()).wear("brutal");

    // Следующий заход: документ чист, хранилище то же.
    document.head.innerHTML = "";
    root().removeAttribute("data-skin");

    const next = makeSkinSwitch(givenSource());
    expect(await next.restore()).toEqual({ name: "brutal", mode: "light" });
    expect(seen("--radius")).toBe("0rem");
  });

  it("восстановление НИЧЕГО не запоминает — это не выбор человека", async () => {
    await makeSkinSwitch(givenSource()).wear("brutal");
    const recorded = localStorage.getItem(STORAGE_KEY);

    root().removeAttribute("data-skin");
    await makeSkinSwitch(givenSource()).restore();

    expect(localStorage.getItem(STORAGE_KEY)).toBe(recorded);
  });

  it("надевание с remember: false не превращает чужое умолчание в выбор человека", async () => {
    await makeSkinSwitch(givenSource()).wear("twitter", { remember: false });

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("СНЯТЫЙ скин не воскресает: восстановление уважает снятое и умолчания не надевает", async () => {
    const skin = makeSkinSwitch(givenSource(), { fallback: { skin: "twitter" } });
    await skin.wear("brutal");
    skin.takeOff();

    root().removeAttribute("data-skin");
    const next = makeSkinSwitch(givenSource(), { fallback: { skin: "twitter" } });

    expect(await next.restore()).toBeNull();
    expect(ours()).toHaveLength(0);
  });

  it("запомненного скина в источнике больше нет — берётся названное умолчание", async () => {
    await makeSkinSwitch(givenSource()).wear("brutal");
    root().removeAttribute("data-skin");
    document.head.innerHTML = "";

    const shrunk = makeSkinSwitch(givenSource({ twitter: SKINS.twitter }), {
      fallback: { skin: "twitter" },
    });

    expect((await shrunk.restore())?.name).toBe("twitter");
  });

  it("запомненного нет и умолчание не названо — остаётся голый кит, а не первый из перечня", async () => {
    const skin = makeSkinSwitch(givenSource());

    expect(await skin.restore()).toBeNull();
    expect(ours()).toHaveLength(0);
  });

  it("своим ключом хранилища заходы разных приложений не пересекаются", async () => {
    await makeSkinSwitch(givenSource(), { storageKey: "их:скин" }).wear("brutal");

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem("их:скин")).toContain("brutal");
  });

  it("половина, которую не называли, в памяти не трогается", async () => {
    const skin = makeSkinSwitch(givenSource());
    await skin.wear("twitter", { mode: "dark" });

    await skin.wear("brutal");

    const record = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<string, unknown>;

    expect(record).toEqual({ skin: "brutal", mode: "dark" });
  });

  it("хранилище недоступно — надевание всё равно работает: память это удобство", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("квота");
    });

    await makeSkinSwitch(givenSource()).wear("twitter");

    expect(seen("--radius")).toBe("1.3rem");
    expect(root().getAttribute("data-skin")).toBe("twitter");
  });
});

describe("отказы и гонки", () => {
  it("отказ источника не оставляет полусостояния — на корне остаётся прежнее", async () => {
    const skin = makeSkinSwitch(givenSource());
    await skin.wear("twitter");

    await expect(skin.wear("нет-такого")).rejects.toThrow("нет скина");

    expect(root().getAttribute("data-skin")).toBe("twitter");
    expect(seen("--radius")).toBe("1.3rem");
    expect(ours()).toHaveLength(1);
  });

  it("пустое имя — внятный отказ, а не пустое опознание на корне", async () => {
    const skin = makeSkinSwitch(givenSource());

    await expect(skin.wear("  ")).rejects.toThrow("takeOff()");
    expect(root().hasAttribute("data-skin")).toBe(false);
  });

  it("побеждает выбранный ПОСЛЕДНИМ, а не приехавший последним", async () => {
    const skin = makeSkinSwitch(givenSlowSource({ twitter: 50, brutal: 1 }));

    const slow = skin.wear("twitter");
    const fast = skin.wear("brutal");
    await Promise.all([slow, fast]);

    expect(root().getAttribute("data-skin")).toBe("brutal");
    expect(seen("--radius")).toBe("0rem");
    expect(ours()).toHaveLength(1);
  });

  it("снятие обгоняет надевание, которое ещё едет", async () => {
    const skin = makeSkinSwitch(givenSlowSource({ twitter: 20 }));

    const riding = skin.wear("twitter");
    skin.takeOff();
    await riding;

    expect(root().hasAttribute("data-skin")).toBe(false);
    expect(ours()).toHaveLength(0);
  });
});

describe("перезапуск", () => {
  it("уборка снимает СВОЙ лист и не трогает опознание, поставленное новым экземпляром", async () => {
    const old = makeSkinSwitch(givenSource());
    await old.wear("twitter");

    const fresh = makeSkinSwitch(givenSource());
    await fresh.wear("brutal");
    old.dispose();

    expect(root().getAttribute("data-skin")).toBe("brutal");
    expect(ours()).toHaveLength(1);
    expect(seen("--radius")).toBe("0rem");
  });

  it("лист, снятый снаружи, заводится заново — механика не залипает в снятом состоянии", async () => {
    const skin = makeSkinSwitch(givenSource());
    await skin.wear("twitter");

    document.head.innerHTML = "";
    await skin.wear("brutal");

    expect(ours()).toHaveLength(1);
    expect(seen("--radius")).toBe("0rem");
  });
});

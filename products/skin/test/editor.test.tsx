// РЕДАКТОР — ручки, тонкая правка и путь до службы (`PWEB-31`).
//
// Проверяется то, без чего редактор врёт человеку:
//
//   1. цвет и форма правятся В ОДНОМ месте и на видимых компонентах, а не в пустоте;
//   2. ручка читает себя ОБРАТНО: положение соответствует записи, а не нашим надеждам;
//   3. правка видна сразу и тем же путём, каким видно сохранённое, — надеванием черновика;
//   4. части и состояния берутся из ПАСПОРТА, вариации — из ЗАПИСИ;
//   5. сохранённое доезжает до службы целиком и заменяет прежнюю запись, а не ложится рядом;
//   6. унаследованное отличимо от пустого — иначе человек пишет заново то, что уже сказано.
//
// Чего здесь нет: проверки, что «стало красиво». Вид проверяет человек, а машина — что правка
// доехала туда, куда обещано, и ровно в том виде.

import { SCALE_ROLES } from "@omnifield/probe-web-skin/model";
import { passportOf } from "@omnifield/probe-web-ui/passport";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../src/showcase/app.jsx";

import { cleanup, mount } from "./dom.jsx";
import { FORM, OUTFIT, PALETTE } from "./fixtures.js";
import { restoreStore, serveLook, storedNow } from "./store-stub.js";

beforeEach(() => serveLook({ palettes: [PALETTE], forms: [FORM], outfits: [OUTFIT] }));

afterEach(() => {
  restoreStore();
  cleanup();
  document.documentElement.removeAttribute("data-skin");
  for (const sheet of document.querySelectorAll("style")) sheet.remove();
  localStorage.clear();
});

/** Выбирает компонент в перечне — перечень теперь весь кит, и первый в нём не кнопка. */
function pick(host: HTMLElement, component: string): void {
  const пункт = [...host.querySelectorAll<HTMLButtonElement>(".rail__item")].find(
    (кнопка) => (кнопка.textContent ?? "").trim() === component,
  );

  пункт?.click();
}

/** Открывает правку кнопки и дожидается, пока черновик приедет из службы. */
async function openEditor(): Promise<HTMLElement> {
  const host = mount(() => <App />);

  pick(host, "button");

  const [, правка] = [...host.querySelectorAll<HTMLButtonElement>(".views__item")];

  правка?.click();

  await vi.waitFor(() => expect(host.querySelector(".knob__color")).not.toBeNull());

  return host;
}

/** Раскрывает названный раздел панели — так же, как это делает рукой человек. */
function open(host: HTMLElement, title: string): void {
  const раздел = [...host.querySelectorAll<HTMLButtonElement>(".knobs__head")].find(
    (кнопка) => кнопка.querySelector(".knobs__title")?.textContent === title,
  );

  if (раздел?.getAttribute("aria-expanded") !== "true") раздел?.click();
}

/** Открывает правку и раскрывает тонкую настройку: свойства свёрнуты по умолчанию. */
async function openFine(): Promise<HTMLElement> {
  const host = await openEditor();

  open(host, "Тонко");
  await vi.waitFor(() => expect(host.querySelectorAll(".prop").length).toBeGreaterThan(0));

  return host;
}

/** Строка свойства по имени — то, что человек видит и правит. */
function rowOf(host: HTMLElement, name: string): HTMLElement | undefined {
  return [...host.querySelectorAll<HTMLElement>(".prop")].find(
    (строка) => строка.querySelector(".prop__name")?.textContent === name,
  );
}

describe("цвет и форма в одном месте", () => {
  it("правка показывает КОМПОНЕНТ, а не образец цвета", async () => {
    const host = await openEditor();

    // Крутят не в пустоте: рядом с настройками стоит живой компонент в правимой координате.
    // Витринного потока здесь нет — это другой экран и другой вопрос.
    expect(host.querySelector(".stage__show")).not.toBeNull();
    expect(host.querySelector('[data-scope="button"]')).not.toBeNull();
    expect(host.querySelectorAll(".case")).toHaveLength(0);
  });

  it("ручек ровно столько, сколько намерений в словаре", async () => {
    const host = await openEditor();

    // Перечень словарный: заведи механика шестое намерение — ручка появится сама.
    expect(host.querySelectorAll(".knob__color")).toHaveLength(SCALE_ROLES.length);
  });

  it("ручка читает себя обратно — положение равно записи", async () => {
    const host = await openEditor();
    const [первая] = [...host.querySelectorAll<HTMLInputElement>(".knob__color")];

    expect(первая?.value).toBe(PALETTE.scales?.["акцент"]);
  });

  it("правка цвета одевает показ черновиком, а не красит образец", async () => {
    const host = await openEditor();
    const [первая] = [...host.querySelectorAll<HTMLInputElement>(".knob__color")];

    первая!.value = "#ff0000";
    первая!.dispatchEvent(new Event("input", { bubbles: true }));

    await vi.waitFor(() =>
      expect(document.documentElement.getAttribute("data-skin")).toBe("draft"),
    );

    // Семя доехало в лист: механика построила из него лестницу, а не подставила цвет на узел.
    const лист = [...document.querySelectorAll("style")].map((узел) => узел.textContent).join("");

    expect(лист).toContain("--акцент-9");
  });

  it("мера ниже нормы не крутится: пол выведен, а не выбран", async () => {
    const host = await openEditor();

    open(host, "Меры");

    await vi.waitFor(() => expect(host.querySelectorAll(".knob__range").length).toBeGreaterThan(0));

    const плотность = [...host.querySelectorAll<HTMLInputElement>(".knob__range")].find(
      (ползунок) => ползунок.title.includes("2.5.8"),
    );

    // Не «мы решили 0.75», а «ниже нижняя ступень перестаёт быть достижимой целью» —
    // и число приходит из механики вместе с причиной.
    expect(плотность).toBeDefined();
    expect(Number(плотность?.min)).toBeGreaterThan(0);
  });
});

describe("сохранение цветов и скина", () => {
  it("цвета сохраняются своим именем — их тянут другие скины", async () => {
    const host = await openEditor();
    const [поле] = [...host.querySelectorAll<HTMLInputElement>(".knobs__save .prop__value")];

    поле!.value = "цвета-2";
    поле!.dispatchEvent(new Event("input", { bubbles: true }));
    [...host.querySelectorAll<HTMLButtonElement>(".knobs__save .form__button")][0]?.click();

    await vi.waitFor(() => {
      const палитры = storedNow().filter((запись) => запись.kind === "palette");

      expect(палитры.map((запись) => запись.name)).toContain("цвета-2");
    });
  });

  it("скин — это сочетание: цвета плюс формы, одним именем", async () => {
    const host = await openEditor();
    const поля = [...host.querySelectorAll<HTMLInputElement>(".knobs__save .prop__value")];

    поля[1]!.value = "скин-2";
    поля[1]!.dispatchEvent(new Event("input", { bubbles: true }));
    [...host.querySelectorAll<HTMLButtonElement>(".knobs__save .form__button")][1]?.click();

    await vi.waitFor(() => {
      const наряды = storedNow().filter((запись) => запись.kind === "outfit");
      const новый = наряды.find((запись) => запись.name === "скин-2");

      expect(новый).toBeDefined();
      // Внутри — ссылки на цвета и формы, а не их копии: правка цветов видна всем, кто их тянет.
      expect(JSON.stringify(новый?.state)).toContain(PALETTE.name);
      expect(JSON.stringify(новый?.state)).toContain("скин-2-button");
    });
  });
});

describe("что показано", () => {
  it("части приходят из паспорта, своего перечня у редактора нет", async () => {
    const host = await openFine();
    const названо = [...host.querySelectorAll(".form__part-name")].map(
      (узел) => узел.textContent ?? "",
    );

    expect(названо).toEqual([...(passportOf("button")?.anatomy.keys() ?? [])]);
  });

  it("состояния в выборе — тоже паспортные", async () => {
    const host = await openEditor();
    const options = [...host.querySelectorAll(".stage__coords option")].map(
      (узел) => узел.textContent ?? "",
    );

    for (const состояние of passportOf("button")?.parts[0]?.states ?? []) {
      expect(options).toContain(состояние.name);
    }
  });

  it("вариации в выборе — из ЗАПИСИ, потому что имена принадлежат скину", async () => {
    const host = await openEditor();
    const options = [...host.querySelectorAll(".stage__coords option")].map(
      (узел) => узел.textContent ?? "",
    );

    for (const имя of Object.keys(FORM.recipe.variants ?? {})) expect(options).toContain(имя);
    // Паспорт имён не знает и знать не должен — обратная сторона того же.
    expect(JSON.stringify(passportOf("button"))).not.toContain("главная");
  });

  it("написанное на координате отделено от пришедшего от базы", async () => {
    const host = await openFine();

    // База кнопки в фикстуре объявляет фон и цвет — они свои, со снятием.
    expect(rowOf(host, "background")?.className).not.toContain("prop--inherited");

    const [, вариация] = [...host.querySelectorAll<HTMLSelectElement>(".stage__coords select")];
    вариация!.value = "главная";
    вариация!.dispatchEvent(new Event("change", { bubbles: true }));

    await vi.waitFor(() => {
      // В вариации объявлены фон и цвет; скругление приходит от базы — оно показано бледным и
      // без кнопки снятия: снимать здесь нечего, сказано это в другом месте.
      expect(rowOf(host, "borderRadius")?.className).toContain("prop--inherited");
      expect(rowOf(host, "borderRadius")?.querySelector(".prop__drop")).toBeNull();
    });

    expect(rowOf(host, "background")?.className).not.toContain("prop--inherited");
  });
});

describe("правка", () => {
  it("одевает показ ЧЕРНОВИКОМ — тем же путём, каким одевается сохранённое", async () => {
    const host = await openFine();
    const поле = rowOf(host, "background")?.querySelector<HTMLInputElement>(".prop__value");

    поле!.value = "var(--акцент-9)";
    поле!.dispatchEvent(new Event("change", { bubbles: true }));

    // Опознание на корне — свидетельство того, что правка проехала сборку и порождение, а не
    // легла стилем на узел: стиль на узле корня не трогает вовсе.
    await vi.waitFor(() =>
      expect(document.documentElement.getAttribute("data-skin")).toBe("draft"),
    );

    const лист = [...document.querySelectorAll("style")].map((узел) => узел.textContent).join("");

    expect(лист).toContain("var(--акцент-9)");
  });

  it("снятое свойство уходит из показа", async () => {
    const host = await openFine();

    rowOf(host, "color")?.querySelector<HTMLButtonElement>(".prop__drop")?.click();

    await vi.waitFor(() => expect(rowOf(host, "color")).toBeUndefined());
  });
});

describe("сохранение", () => {
  it("кладёт правку в службу вместо прежней записи, а не рядом", async () => {
    const host = await openFine();
    const поле = rowOf(host, "background")?.querySelector<HTMLInputElement>(".prop__value");

    поле!.value = "var(--акцент-9)";
    поле!.dispatchEvent(new Event("change", { bubbles: true }));

    host.querySelector<HTMLButtonElement>(".form__button--main")?.click();

    await vi.waitFor(() => {
      const формы = storedNow().filter((запись) => запись.kind === "form");

      // Ровно одна: две записи одного имени оставили бы решение «какая поедет в наряд» за
      // порядком перечня, то есть за случайностью.
      expect(формы).toHaveLength(1);
      expect(JSON.stringify(формы[0]?.state)).toContain("var(--акцент-9)");
    });
  });

  it("после сохранения человек остаётся в правке, а не переодевается", async () => {
    const host = await openFine();

    host.querySelector<HTMLButtonElement>(".form__button--main")?.click();

    // Сохранённая запись РАВНА черновику, которым одет показ: переодевание на наряд мигнуло бы
    // экраном и вернулось к тому же виду, сообщив о работе, которой не было.
    await vi.waitFor(() =>
      expect(storedNow().filter((запись) => запись.kind === "form")).toHaveLength(1),
    );

    expect(document.documentElement.getAttribute("data-skin")).toBe("draft");
    expect(host.querySelectorAll(".prop").length).toBeGreaterThan(0);
  });

  it("уход из правки возвращает показ на наряд", async () => {
    const host = await openFine();
    const [витрина] = [...host.querySelectorAll<HTMLButtonElement>(".views__item")];

    витрина?.click();

    await vi.waitFor(() =>
      expect(document.documentElement.getAttribute("data-skin")).toBe(OUTFIT.name),
    );
  });
});

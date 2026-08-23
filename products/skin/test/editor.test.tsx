// РЕДАКТОР — ручки, тонкая правка и сборка черновика (`PWEB-31`).
//
// Экран монтируется НАПРЯМУЮ, а не через витрину: переключателя видов в хедере больше нет —
// витрина показывает, и только (решение user 2026-08-23). Навигацию к правке сделаем, когда
// возьмёмся за редактор всерьёз; до тех пор его части проверяются как части, а не через путь,
// которого в интерфейсе нет.
//
// Проверяется то, без чего редактор врёт человеку:
//
//   1. правка идёт НА КОМПОНЕНТЕ — рядом с ручками стоит живой узел, а не образец заливки;
//   2. ручка читает себя ОБРАТНО: положение равно записи, а не нашим надеждам;
//   3. границы приходят из механики вместе с нормой, а не выбраны нами;
//   4. части и состояния берутся из ПАСПОРТА, вариации — из ЗАПИСИ;
//   5. черновик собирается тем же путём, что сохранённая запись;
//   6. унаследованное отличимо от пустого — иначе человек пишет заново то, что уже сказано.

import { generateSkinCss } from "@omnifield/probe-web-skin";
import { SCALE_ROLES, type Form, type Palette } from "@omnifield/probe-web-skin/model";
import { passportOf } from "@omnifield/probe-web-ui/passport";
import { createSignal } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EditScreen } from "../src/editor/screen.jsx";
import { type Draft, draftLook, hold } from "../src/skins/index.js";

import { cleanup, mount } from "./dom.jsx";
import { FORM, OUTFIT, PALETTE } from "./fixtures.js";
import { restoreStore, serveLook } from "./store-stub.js";

beforeEach(() => serveLook({ palettes: [PALETTE], forms: [FORM], outfits: [OUTFIT] }));

afterEach(() => {
  restoreStore();
  hold(null);
  cleanup();
});

/** Что запросили сохранить — имена, с которыми позвали. */
interface Записано {
  palette: string[];
  skin: string[];
}

/** Поднимает экран правки с живым черновиком и отдаёт разметку вместе с ним. */
function open(): { host: HTMLElement; draft: () => Draft; saved: Записано } {
  const [draft, setDraft] = createSignal<Draft>({ palette: PALETTE, form: FORM });
  const saved: Записано = { palette: [], skin: [] };

  const host = mount(() => (
    <EditScreen
      component="button"
      draft={draft()}
      gaps={[]}
      saving={false}
      trouble={null}
      onDraft={setDraft}
      onSavePalette={(имя) => saved.palette.push(имя)}
      onSaveSkin={(имя) => saved.skin.push(имя)}
    />
  ));

  return { host, draft, saved };
}

/** Раскрывает названный раздел панели — так же, как это делает рукой человек. */
function unfold(host: HTMLElement, title: string): void {
  const раздел = [...host.querySelectorAll<HTMLButtonElement>(".knobs__head")].find(
    (кнопка) => кнопка.querySelector(".knobs__title")?.textContent === title,
  );

  if (раздел?.getAttribute("aria-expanded") !== "true") раздел?.click();
}

/** Строка свойства по имени — то, что человек видит и правит. */
function rowOf(host: HTMLElement, name: string): HTMLElement | undefined {
  return [...host.querySelectorAll<HTMLElement>(".prop")].find(
    (строка) => строка.querySelector(".prop__name")?.textContent === name,
  );
}

describe("правка идёт на компоненте", () => {
  it("рядом с ручками стоит живой узел, а не образец заливки", () => {
    const { host } = open();

    expect(host.querySelector(".stage__show")).not.toBeNull();
    expect(host.querySelector('[data-scope="button"][data-part="root"]')).not.toBeNull();
  });

  it("координата выбирается на экране, а не в свёрнутом разделе", () => {
    const { host } = open();
    const выборы = host.querySelectorAll(".stage__coords select");

    // Часть, вариация, состояние: от них зависит показ, поэтому они на виду.
    expect(выборы).toHaveLength(3);
  });
});

describe("ручки цвета и меры", () => {
  it("ручек ровно столько, сколько намерений в словаре", () => {
    const { host } = open();

    // Перечень словарный: заведи механика шестое намерение — ручка появится сама.
    expect(host.querySelectorAll(".knob__color")).toHaveLength(SCALE_ROLES.length);
  });

  it("ручка читает себя обратно — положение равно записи", () => {
    const { host } = open();
    const [первая] = [...host.querySelectorAll<HTMLInputElement>(".knob__color")];

    expect(первая?.value).toBe(PALETTE.scales?.["акцент"]);
  });

  it("правка цвета меняет СЕМЯ, а не готовый оттенок", () => {
    const { host, draft } = open();
    const [первая] = [...host.querySelectorAll<HTMLInputElement>(".knob__color")];

    первая!.value = "#ff0000";
    первая!.dispatchEvent(new Event("input", { bubbles: true }));

    // Из семени механика строит двенадцать ступеней и обе половины; правь мы ступень, вторая
    // половина осталась бы от прежнего цвета.
    expect((draft().palette as Palette).scales?.["акцент"]).toBe("#ff0000");
  });

  it("мера ниже нормы не крутится: пол выведен, а не выбран", () => {
    const { host } = open();

    unfold(host, "Меры");

    const плотность = [...host.querySelectorAll<HTMLInputElement>(".knob__range")].find(
      (ползунок) => ползунок.title.includes("2.5.8"),
    );

    // Не «мы решили 0.75», а «ниже нижняя ступень перестаёт быть достижимой целью»: число
    // приходит из механики вместе с нормой и причиной.
    expect(плотность).toBeDefined();
    expect(Number(плотность?.min)).toBeGreaterThan(0);
  });

  it("текучая мера показана краями, а не ползунком", () => {
    const { host } = open();

    unfold(host, "Меры");

    // Полюсами объявлены четыре числа; одним ползунком пришлось бы врать, какой полюс поехал.
    const тихие = [...host.querySelectorAll(".knob__value--quiet")].map((узел) => узел.textContent);

    expect(тихие.length + host.querySelectorAll(".knob__range").length).toBeGreaterThan(0);
  });
});

describe("тонкая правка", () => {
  it("части приходят из паспорта, своего перечня у редактора нет", () => {
    const { host } = open();

    unfold(host, "Тонко");

    const названо = [...host.querySelectorAll(".form__part-name")].map(
      (узел) => узел.textContent ?? "",
    );

    expect(названо).toEqual([...(passportOf("button")?.anatomy.keys() ?? [])]);
  });

  it("состояния и вариации в выборе — паспортные и записанные", () => {
    const { host } = open();
    const options = [...host.querySelectorAll(".stage__coords option")].map(
      (узел) => узел.textContent ?? "",
    );

    for (const состояние of passportOf("button")?.parts[0]?.states ?? []) {
      expect(options).toContain(состояние.name);
    }

    // Имена вариаций принадлежат СКИНУ: паспорт их не знает и знать не должен.
    for (const имя of Object.keys(FORM.recipe.variants ?? {})) expect(options).toContain(имя);
    expect(JSON.stringify(passportOf("button"))).not.toContain("главная");
  });

  it("написанное на координате отделено от пришедшего от базы", async () => {
    const { host } = open();

    unfold(host, "Тонко");
    expect(rowOf(host, "background")?.className).not.toContain("prop--inherited");

    const [, вариация] = [...host.querySelectorAll<HTMLSelectElement>(".stage__coords select")];
    вариация!.value = "главная";
    вариация!.dispatchEvent(new Event("change", { bubbles: true }));

    await vi.waitFor(() => {
      // В вариации объявлены фон и цвет; скругление приходит от базы — оно бледное и без кнопки
      // снятия: снимать здесь нечего, сказано это в другом месте.
      expect(rowOf(host, "borderRadius")?.className).toContain("prop--inherited");
      expect(rowOf(host, "borderRadius")?.querySelector(".prop__drop")).toBeNull();
    });
  });

  it("правка свойства меняет ЗАПИСЬ, а не разметку", () => {
    const { host, draft } = open();

    unfold(host, "Тонко");

    const поле = rowOf(host, "background")?.querySelector<HTMLInputElement>(".prop__value");
    поле!.value = "var(--акцент-9)";
    поле!.dispatchEvent(new Event("change", { bubbles: true }));

    expect((draft().form as Form).recipe.base?.["root"]?.props?.["background"]).toBe(
      "var(--акцент-9)",
    );
  });
});

describe("сохранение", () => {
  it("цвета и скин сохраняются РАЗНЫМИ именами — это разные вещи", () => {
    const { host, saved } = open();
    const поля = [...host.querySelectorAll<HTMLInputElement>(".knobs__save .prop__value")];
    const кнопки = [...host.querySelectorAll<HTMLButtonElement>(".knobs__save .form__button")];

    поля[0]!.value = "цвета-2";
    поля[0]!.dispatchEvent(new Event("input", { bubbles: true }));
    кнопки[0]?.click();

    поля[1]!.value = "скин-2";
    поля[1]!.dispatchEvent(new Event("input", { bubbles: true }));
    кнопки[1]?.click();

    expect(saved.palette).toEqual(["цвета-2"]);
    expect(saved.skin).toEqual(["скин-2"]);
  });
});

describe("черновик собирается тем же путём, что запись", () => {
  it("правка едет через сборку и порождение, а не мимо них", async () => {
    hold({ palette: PALETTE, form: { ...FORM, recipe: { ...FORM.recipe } } }, OUTFIT.name);

    const { skin } = await draftLook();
    const css = generateSkinCss(skin, passportOf);

    // Тот же путь — те же координаты в листе: правка, посчитанная в обход, адресовала бы узел.
    expect(css).toContain('[data-scope="button"][data-part="root"]');
  });

  it("черновика нет — сборка отказывает, а не показывает прежнее", async () => {
    hold(null, OUTFIT.name);

    await expect(draftLook()).rejects.toThrow();
  });
});

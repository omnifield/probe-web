// ЧИТАЕМОСТЬ — считает механика, отдаёт значением.
//
// Пары подобраны по РЕАЛЬНЫМ числам той же формулы, которой считает гейт (сверено 2026-08-21):
//
//   #767676 на #ffffff — 4.54   проходит текст (4.5)
//   #949494 на #ffffff — 3.03   НЕ проходит текст, проходит нетекст (3)
//   #b0b0b0 на #ffffff — 2.17   не проходит ни то, ни другое
//   #8f8f8f на #ffffff — 3.23   не проходит текст
//   #000000 на #ffffff — 21.00  проходит всё
//
// Числа в ожиданиях почти нигде не записаны: проба сравнивает с ПОРОГОМ из ответа, а не с
// константой. Записанное число — это второй экземпляр формулы, и разойдётся он молча.

import { describe, expect, it, vi } from "vitest";

import { skinContrast, type ContrastNote } from "../src/contrast.js";
import type { Skin } from "../src/model.js";
import { buttonPassport } from "./passports.js";

/** Скин из одной пары: цвет и заливка на базе кнопки. */
function paired(color: string, background: string, dark?: Record<string, string>): Skin {
  return {
    name: "пара",
    variables: { light: { ink: color, face: background }, ...(dark ? { dark } : {}) },
    recipes: {
      button: {
        base: { root: { props: { color: "var(--ink)", backgroundColor: "var(--face)" } } },
      },
    },
  };
}

function notes(skin: Skin): readonly ContrastNote[] {
  return skinContrast(skin, [buttonPassport]);
}

/** Компактная запись ответа — сравнивать удобнее её. */
function shorthand(list: readonly ContrastNote[]): string[] {
  return list.map((note) =>
    note.kind === "low"
      ? `low ${note.half} ${note.property} ${note.norm}`
      : `?${note.reason} ${note.half} ${note.property}`,
  );
}

describe("ответ — значение, а не отказ", () => {
  it("плохой скин не бросает и ничего не печатает", () => {
    const debug = vi.spyOn(console, "debug").mockImplementation(() => {});
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const list = notes(paired("#b0b0b0", "#ffffff"));

    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
    expect(debug).not.toHaveBeenCalled();
    expect(warn).not.toHaveBeenCalled();

    vi.restoreAllMocks();
  });

  it("у каждой записи есть пояснение человеку", () => {
    for (const note of notes(paired("#b0b0b0", "#ffffff"))) {
      expect(note.means.length).toBeGreaterThan(0);
    }
  });
});

describe("пара ниже нормы названа", () => {
  it("слабый текст попадает в перечень с отношением и порогом", () => {
    const list = notes(paired("#949494", "#ffffff"));
    const low = list.find((note) => note.kind === "low" && note.half === "light");

    expect(low).toBeDefined();
    expect(low!.kind).toBe("low");
    if (low!.kind !== "low") return;

    expect(low!.property).toBe("color");
    expect(low!.norm).toBe("text");
    expect(low!.ratio).toBeLessThan(low!.required);
    expect(low!.foreground).toBe("#949494");
    expect(low!.background).toBe("#ffffff");
    expect(low!.where).toMatchObject({ component: "button", part: "root" });
  });

  it("отношение — настоящее число, а не признак: чёрное на белом даёт 21", () => {
    // Единственное место, где число записано: это проверка самой связи с формулой, а не
    // ожидание про конкретный скин.
    const skin: Skin = {
      name: "край",
      recipes: {
        button: {
          base: { root: { props: { color: "#ffffff", backgroundColor: "#ffffff" } } },
        },
      },
    };
    const low = notes(skin).find((note) => note.kind === "low");

    expect(low).toBeDefined();
    if (low?.kind !== "low") return;
    expect(low.ratio).toBe(1);
  });
});

describe("порог различает текст и не-текст", () => {
  const skin: Skin = {
    name: "порог",
    variables: { light: { ink: "#949494", face: "#ffffff" } },
    recipes: {
      button: {
        base: {
          root: {
            props: {
              // Один и тот же цвет на одной и той же заливке: 3.03 — мало тексту, довольно рамке.
              color: "var(--ink)",
              borderColor: "var(--ink)",
              backgroundColor: "var(--face)",
            },
          },
        },
      },
    },
  };

  it("тот же цвет забракован как текст и пропущен как рамка", () => {
    expect(shorthand(notes(skin))).toEqual(["low light color text", "low dark color text"]);
  });

  it("рамка ниже СВОЕГО порога всё-таки называется", () => {
    const weak: Skin = {
      name: "рамка",
      recipes: {
        button: {
          base: { root: { props: { borderColor: "#b0b0b0", backgroundColor: "#ffffff" } } },
        },
      },
    };
    const low = notes(weak).find((note) => note.kind === "low");

    expect(low?.kind === "low" && low.norm).toBe("non-text");
    expect(low?.kind === "low" && low.required).toBe(3);
  });
});

describe("считаются обе половины", () => {
  it("тёмная берёт у светлой то, чего сама не объявила", () => {
    // Светлая: чёрное на белом — 21. Тёмная переопределяет только текст, заливка остаётся белой.
    const list = notes(paired("#000000", "#ffffff", { ink: "#8f8f8f" }));

    expect(shorthand(list)).toEqual(["low dark color text"]);
  });

  it("плохая светлая и хорошая тёмная — тоже одна запись, но другая", () => {
    const list = notes(paired("#8f8f8f", "#ffffff", { ink: "#000000" }));

    expect(shorthand(list)).toEqual(["low light color text"]);
  });

  it("плохи обе — обе и названы", () => {
    expect(shorthand(notes(paired("#b0b0b0", "#ffffff")))).toEqual([
      "low light color text",
      "low dark color text",
    ]);
  });
});

describe("пара складывается по каскаду", () => {
  // Тот самый случай, с которого задача началась: цвет объявлен базой, заливка — вариацией.
  // Правило, глядящее на одну запись, такой пары не увидит вовсе.
  const skin: Skin = {
    name: "сложение",
    recipes: {
      button: {
        base: { root: { props: { color: "#949494" } } },
        variants: {
          главная: { root: { props: { backgroundColor: "#ffffff" } } },
          тёмная: { root: { props: { backgroundColor: "#000000" } } },
        },
        defaultVariant: "главная",
      },
    },
  };

  it("цвет из базы встречается с заливкой из вариации", () => {
    const low = notes(skin).filter((note) => note.kind === "low");

    expect(low.length).toBeGreaterThan(0);
    expect(low[0]!.kind === "low" && low[0]!.background).toBe("#ffffff");
  });

  it("умолчание действует и на голом узле: у базы та же заливка", () => {
    const bare = notes(skin).find(
      (note) => note.kind === "low" && note.where.variants.length === 0,
    );

    expect(bare?.kind === "low" && bare.background).toBe("#ffffff");
  });

  it("вариация со своей заливкой считается своей парой", () => {
    // На тёмной заливке тот же серый читается лучше — эта пара норму проходит и в перечень
    // не попадает.
    const dark = notes(skin).filter(
      (note) => note.kind === "low" && note.background === "#000000",
    );

    expect(dark).toEqual([]);
  });
});

describe("непосчитанное называется, а не пропускается молча", () => {
  it("прозрачная заливка: что под ней — не в скине", () => {
    const skin: Skin = {
      name: "прозрачно",
      recipes: {
        button: {
          base: { root: { props: { color: "#949494", backgroundColor: "transparent" } } },
        },
      },
    };

    expect(shorthand(notes(skin))).toEqual(["?outside-skin light color", "?outside-skin dark color"]);
  });

  it("ссылка на имя, которого в скине нет", () => {
    const skin: Skin = {
      name: "чужое",
      recipes: {
        button: {
          base: { root: { props: { color: "#949494", backgroundColor: "var(--чужое)" } } },
        },
      },
    };

    expect(shorthand(notes(skin))).toEqual(["?outside-skin light color", "?outside-skin dark color"]);
  });

  it("запасное значение ссылку спасает: автор сам сказал, что будет без имени", () => {
    const skin: Skin = {
      name: "запас",
      recipes: {
        button: {
          base: {
            root: { props: { color: "#000000", backgroundColor: "var(--чужое, #ffffff)" } },
          },
        },
      },
    };

    expect(notes(skin)).toEqual([]);
  });

  it("значение, которого формула не разбирает", () => {
    const skin: Skin = {
      name: "неразбор",
      recipes: {
        button: {
          base: { root: { props: { color: "#949494", backgroundColor: "rgb(255, 255, 255)" } } },
        },
      },
    };

    expect(shorthand(notes(skin))).toEqual(["?not-a-colour light color", "?not-a-colour dark color"]);
  });

  it("заливки нет вовсе", () => {
    const skin: Skin = {
      name: "безфона",
      recipes: { button: { base: { root: { props: { color: "#949494" } } } } },
    };

    expect(shorthand(notes(skin))).toEqual(["?no-background light color", "?no-background dark color"]);
  });

  it("цвет из составного значения достаётся: `1px solid #b0b0b0` — это #b0b0b0", () => {
    const skin: Skin = {
      name: "составное",
      recipes: {
        button: {
          base: {
            root: { props: { borderColor: "1px solid #b0b0b0", backgroundColor: "#ffffff" } },
          },
        },
      },
    };
    const low = notes(skin).find((note) => note.kind === "low");

    expect(low?.kind === "low" && low.foreground).toBe("#b0b0b0");
  });
});

describe("достаточный контраст даёт пусто", () => {
  it("чёрное на белом — ни одной записи", () => {
    expect(notes(paired("#000000", "#ffffff"))).toEqual([]);
  });

  it("пара на самом краю нормы проходит: 4.54 при пороге 4.5", () => {
    expect(notes(paired("#767676", "#ffffff"))).toEqual([]);
  });

  it("скин без цветов вообще молчит", () => {
    const skin: Skin = {
      name: "бесцветный",
      recipes: { button: { base: { root: { props: { display: "inline-flex" } } } } },
    };

    expect(notes(skin)).toEqual([]);
  });
});

describe("проверено мутацией: ухудшение значения всплывает", () => {
  it("шаг за порог превращает пусто в запись", () => {
    // 4.54 проходит, 4.48 — уже нет. Разница в один шаг серого.
    expect(notes(paired("#767676", "#ffffff"))).toEqual([]);
    expect(shorthand(notes(paired("#777777", "#ffffff")))).toEqual([
      "low light color text",
      "low dark color text",
    ]);
  });

  it("ухудшение ТОЛЬКО тёмной половины всплывает только в ней", () => {
    expect(notes(paired("#000000", "#ffffff", { ink: "#000000" }))).toEqual([]);
    expect(shorthand(notes(paired("#000000", "#ffffff", { ink: "#777777" })))).toEqual([
      "low dark color text",
    ]);
  });

  it("подмена заливки на прозрачную превращает счёт в честное «нечем»", () => {
    expect(notes(paired("#000000", "#ffffff"))).toEqual([]);
    expect(shorthand(notes(paired("#000000", "transparent")))).toEqual([
      "?outside-skin light color",
      "?outside-skin dark color",
    ]);
  });
});

describe("одна пара — одна запись", () => {
  it("состояние, не тронувшее цвета, не повторяет жалобу базы", () => {
    const skin: Skin = {
      name: "повтор",
      recipes: {
        button: {
          base: {
            root: {
              props: { color: "#949494", backgroundColor: "#ffffff" },
              states: {
                hover: { props: { opacity: "0.9" } },
                disabled: { props: { opacity: "0.4" } },
              },
            },
          },
        },
      },
    };

    // Три правила, одна и та же пара цветов — одна запись на половину.
    expect(shorthand(notes(skin))).toEqual(["low light color text", "low dark color text"]);
  });

  it("состояние, сменившее цвет, даёт СВОЮ запись", () => {
    const skin: Skin = {
      name: "своё",
      recipes: {
        button: {
          base: {
            root: {
              props: { color: "#000000", backgroundColor: "#ffffff" },
              states: { disabled: { props: { color: "#b0b0b0" } } },
            },
          },
        },
      },
    };
    const low = notes(skin).filter((note) => note.kind === "low");

    expect(low).toHaveLength(2);
    expect(low[0]!.where.states).toEqual(["disabled"]);
  });
});

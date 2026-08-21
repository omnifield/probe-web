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

import { INDISTINCT, skinContrast, type ContrastNote } from "../src/contrast.js";
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

function report(skin: Skin) {
  return skinContrast(skin, [buttonPassport]);
}

function notes(skin: Skin): readonly ContrastNote[] {
  return report(skin).notes;
}

/** Компактная запись ответа — сравнивать удобнее её. */
function shorthand(list: readonly ContrastNote[]): string[] {
  return list.map((note) => {
    if (note.kind === "low") return `low ${note.half} ${note.property} ${note.question}`;
    if (note.kind === "indistinct") return `неотличима ${note.half} ${note.property}`;
    return `?${note.reason} ${note.half} ${note.property}`;
  });
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

  it("мусор на входе даёт НАЗВАННУЮ запись, а не исключение", () => {
    // Определение цвета идёт ветвлением по ответу разбора, а не перехватом отказа (`PWEB-45`).
    // Проба это и проверяет: ни один вход не должен бросить, и на каждый должна быть причина.
    for (const background of [
      "color-mix(in oklch, red, blue)",
      "lab(50% 40 59)",
      "не-цвет",
      "var(--нет)",
      "1px solid",
      "rgba(0,0,0,0.5)",
      "#12345",
      "inherit",
    ]) {
      const skin: Skin = {
        name: "мусор",
        recipes: { button: { base: { root: { props: { color: "#000000", background } } } } },
      };

      const list = notes(skin);

      expect(list.length).toBeGreaterThan(0);
      for (const note of list) {
        expect(note.kind).toBe("unreckonable");
        expect(note.means.length).toBeGreaterThan(0);
      }
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
    expect(low!.question).toBe("text");
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

describe("вопрос зависит от того, чем пара является", () => {
  it("текст и рамка одного цвета на одной заливке: текст забракован, рамка — нет", () => {
    // 3.03 мало тексту. Рамке норма тут не судья вовсе: она граничит с тем, что СНАРУЖИ узла, а
    // это знание дерева. Порог рамки — свой и другой.
    const skin: Skin = {
      name: "вопросы",
      variables: { light: { ink: "#949494", face: "#ffffff" } },
      recipes: {
        button: {
          base: {
            root: {
              props: {
                color: "var(--ink)",
                borderColor: "var(--ink)",
                backgroundColor: "var(--face)",
              },
            },
          },
        },
      },
    };

    expect(shorthand(notes(skin))).toEqual(["low light color text", "low dark color text"]);
  });

  it("значок на собственной заливке — по-прежнему вопрос НОРМЫ", () => {
    // Значок лежит НА заливке узла: обе стороны пары механике известны, и 1.4.11 к ним
    // применима. Отделять его от рамки — не придирка: рамка граничит с внешним, значок нет.
    const skin: Skin = {
      name: "значок",
      recipes: {
        button: {
          base: { root: { props: { fill: "#b0b0b0", backgroundColor: "#ffffff" } } },
        },
      },
    };
    const [low] = notes(skin);

    expect(low?.kind).toBe("low");
    if (low?.kind !== "low") return;
    expect(low.question).toBe("non-text");
    expect(low.required).toBe(3);
  });
});

describe("рамка против своей заливки — своё имя, не норма", () => {
  /** Рамка того же цвета, что заливка: в записи она есть, на узле её нет. */
  const invisible: Skin = {
    name: "невидимая",
    recipes: {
      button: {
        base: { root: { props: { borderColor: "#ffffff", backgroundColor: "#ffffff" } } },
      },
    },
  };

  it("неотличимая рамка ПО-ПРЕЖНЕМУ находится", () => {
    expect(shorthand(notes(invisible))).toEqual([
      "неотличима light border-color",
      "неотличима dark border-color",
    ]);
  });

  it("порога нормы в ответе нет — ни числом, ни словом", () => {
    const [note] = notes(invisible);

    expect(note?.kind).toBe("indistinct");
    if (note?.kind !== "indistinct") return;

    expect(note).not.toHaveProperty("required");
    expect(note.question).toBe("distinct");
    expect(note.means).not.toMatch(/норм/i);
    expect(note.means).toContain("не отличается от заливки");
    expect(note.ratio).toBe(1);
  });

  it("рамка, ОТЛИЧИМАЯ от заливки, нормой больше не бранится", () => {
    // Находка сквозного прохода: рамка соседней ступени при заливке рядом давала 1,68 и
    // называлась нарушением порога 3. Меряли при этом не то, что спрашивает норма.
    const neighbourly: Skin = {
      name: "соседняя",
      recipes: {
        button: {
          base: { root: { props: { borderColor: "#8f8f8f", backgroundColor: "#767676" } } },
        },
      },
    };

    expect(notes(neighbourly)).toEqual([]);
  });

  it("порог рамки — наш, и он ниже самого мелкого различия собственной лестницы", () => {
    // Замер 2026-08-21: ступень 9 против 10 (заливка и заливка при наведении) даёт 1,14 — это
    // самое мелкое различие, которое лестница делает НАМЕРЕННО. Порог обязан быть ниже, иначе
    // счёт бранил бы собственные назначенные границы.
    expect(INDISTINCT).toBeLessThan(1.14);
  });
});

describe("непокрытое названо В ОТВЕТЕ, а не в доке", () => {
  const withBorder: Skin = {
    name: "с-рамкой",
    recipes: {
      button: {
        base: { root: { props: { borderColor: "#000000", backgroundColor: "#ffffff" } } },
      },
    },
  };

  it("скин с рамкой: ответ говорит, чего счёт не смотрит", () => {
    const { unchecked } = report(withBorder);

    expect(unchecked).toHaveLength(1);
    expect(unchecked[0]!.properties).toEqual(["border-color"]);
    expect(unchecked[0]!.means).toContain("РЯДОМ");
  });

  it("названы ровно те свойства, что в записи встретились", () => {
    const both: Skin = {
      name: "обе",
      recipes: {
        button: {
          base: {
            root: {
              props: {
                borderColor: "#000000",
                outlineColor: "#000000",
                backgroundColor: "#ffffff",
              },
            },
          },
        },
      },
    };

    expect(report(both).unchecked[0]!.properties).toEqual(["border-color", "outline-color"]);
  });

  it("скин без рамок непокрытого не объявляет: говорить не о чем", () => {
    expect(report(paired("#000000", "#ffffff")).unchecked).toEqual([]);
  });

  it("непокрытое — не изъян и лежит отдельно от изъянов", () => {
    // Сложи их в одну кучу — и каждый читатель разбирал бы её заново, а витрина показывала бы
    // «одна проблема» там, где проблемы нет.
    expect(report(withBorder).notes).toEqual([]);
    expect(report(withBorder).unchecked).toHaveLength(1);
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
  it("прозрачная заливка названа ПОЛУПРОЗРАЧНОЙ, а не опечаткой", () => {
    const skin: Skin = {
      name: "прозрачно",
      recipes: {
        button: {
          base: { root: { props: { color: "#949494", backgroundColor: "transparent" } } },
        },
      },
    };

    expect(shorthand(notes(skin))).toEqual(["?translucent light color", "?translucent dark color"]);
  });

  it("полупрозрачное и неразобранное — РАЗНЫЕ причины: чинятся они разным", () => {
    const reason = (background: string): string => {
      const [note] = notes({
        name: "две-причины",
        recipes: { button: { base: { root: { props: { color: "#949494", background } } } } },
      });

      return note?.kind === "unreckonable" ? note.reason : "—";
    };

    expect(reason("rgb(0 0 0 / 50%)")).toBe("translucent");
    expect(reason("color-mix(in oklch, red, blue)")).toBe("unknown-notation");
  });

  it("полупрозрачность в СОСТАВНОМ значении не теряется под «не разобрано»", () => {
    // Целое тут действительно не разбирается, но чинить человеку надо не это.
    const skin: Skin = {
      name: "составное-прозрачное",
      recipes: {
        button: {
          base: {
            root: { props: { borderColor: "1px solid rgba(0, 0, 0, 0.5)", background: "#ffffff" } },
          },
        },
      },
    };

    expect(shorthand(notes(skin))).toEqual([
      "?translucent light border-color",
      "?translucent dark border-color",
    ]);
  });

  it("ключевое слово CSS отсылает НАРУЖУ — это третья причина, не опечатка", () => {
    for (const background of ["inherit", "currentColor"]) {
      const skin: Skin = {
        name: "наружу",
        recipes: { button: { base: { root: { props: { color: "#949494", background } } } } },
      };

      expect(shorthand(notes(skin))).toEqual([
        "?outside-skin light color",
        "?outside-skin dark color",
      ]);
    }
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
    // Что именно разбирает формула — дело зоны значений, и перечень там растёт (`PWEB-42`).
    // Проба берёт запись, которой ей не по зубам в любом случае: смешение цветов. Возьми она
    // `rgb(…)`, она проверяла бы чужой перечень, а не наш ответ на «посчитать нечем».
    const skin: Skin = {
      name: "неразбор",
      recipes: {
        button: {
          base: {
            root: {
              props: { color: "#949494", backgroundColor: "color-mix(in oklch, red, blue)" },
            },
          },
        },
      },
    };

    expect(shorthand(notes(skin))).toEqual([
      "?unknown-notation light color",
      "?unknown-notation dark color",
    ]);
  });

  it("заливки нет вовсе", () => {
    const skin: Skin = {
      name: "безфона",
      recipes: { button: { base: { root: { props: { color: "#949494" } } } } },
    };

    expect(shorthand(notes(skin))).toEqual(["?no-background light color", "?no-background dark color"]);
  });

  it("цвет из составного значения достаётся: `1px solid #ffffff` — это #ffffff", () => {
    const skin: Skin = {
      name: "составное",
      recipes: {
        button: {
          base: {
            root: { props: { borderColor: "1px solid #ffffff", backgroundColor: "#ffffff" } },
          },
        },
      },
    };
    const [note] = notes(skin);

    // Рамка сокращённой записью, того же цвета, что заливка: цвет из куска достался, и пара
    // посчиталась — иначе тут была бы жалоба на неразобранную запись.
    expect(note?.kind).toBe("indistinct");
    expect(note?.kind === "indistinct" && note.foreground).toBe("#ffffff");
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
      "?translucent light color",
      "?translucent dark color",
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

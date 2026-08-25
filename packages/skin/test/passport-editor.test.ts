// Гейт того, что СРЕЗ РЕДАКТОРА решает сам: правило вложенности (`admits`, `PWEB-24`), место
// компонента в перечне (`GROUPS`/`groupOf`, `PWEB-34`) и рабочее дерево сборки — теперь списком
// (`PWEB-115`). Все три живут у редактора по одной причине — правило, написанное вторым читателем,
// разъезжается с написанным первым молча.
//
// Ниже сначала вложенность, затем группы, в конце — сборка.
//
// Родов три, и таблица подходимости несимметрична: значок — тоже компонент, компонент значком не
// становится. Несимметричность и делает правило работающим: будь она в обе стороны, «только текст
// или значок» не отвергало бы ничего.
//
// РАЗРЕЗАНО из `passport-form.test.ts` (`PWEB-115`): до разреза `admits`/`GROUPS`/`groupOf` и
// проверка сборки жили у формы целиком — вместе с рантаймом, который их не читает. Предмет проб
// не пересказан заново, только адрес: `admits` теперь спрашивает срез редактора части, а не саму
// часть, а сборка объявляется вторым доводом (`defineEditorInfo`), а не полем паспорта.

import { describe, expect, it } from "vitest";

import { createAnatomy, definePassport } from "../src/passport-form.js";
import {
  admits,
  defineEditorInfo,
  GROUPS,
  groupOf,
  type PassportAdmission,
  type PassportGenus,
} from "../src/passport-editor.js";

/** Срез редактора части с объявленным правилом вложенности — остального проба не трогает. */
function part(accepts?: readonly PassportAdmission[]): { accepts?: readonly PassportAdmission[] } {
  return { accepts };
}

/** Кандидат-содержимое названного рода. Своя часть кладётся вторым видом кандидата — по имени. */
const content = (genus: PassportGenus) => ({ kind: "content", genus }) as const;

describe("умолчание: часть, которая ничего не сказала", () => {
  const молчит = part();

  it.each<[string, PassportGenus]>([
    ["текст", "text"],
    ["значок", "icon"],
    ["любой компонент", "component"],
  ])("пускает %s — молчание это не запрет", (_, genus) => {
    // Ради этого свойства поле и необязательное. Стань умолчанием запрет — часть, которой поле
    // ещё не заполнили, перестала бы принимать содержимое, и паспорт соврал бы за неё.
    expect(admits(молчит, content(genus))).toBe(true);
  });

  it("пускает и свою часть", () => {
    expect(admits(молчит, { kind: "part", name: "item" })).toBe(true);
  });
});

describe("пустой перечень: место занято самим компонентом", () => {
  const занято = part([]);

  it("не пускает ничего — ни содержимого, ни своих частей", () => {
    // Прежнее `content: "none"`. Отличается от умолчания ровно тем, что сказано ЯВНО: пустой
    // перечень — объявленный запрет, отсутствие перечня — отсутствие объявления.
    expect(admits(занято, content("text"))).toBe(false);
    expect(admits(занято, content("component"))).toBe(false);
    expect(admits(занято, { kind: "part", name: "item" })).toBe(false);
  });
});

describe("род допустимого", () => {
  const кнопка = part([content("text"), content("icon")]);
  const раскладка = part([content("component")]);

  it("«только текст или значок» пускает текст и значок", () => {
    expect(admits(кнопка, content("text"))).toBe(true);
    expect(admits(кнопка, content("icon"))).toBe(true);
  });

  it("«только текст или значок» отвергает компонент", () => {
    expect(admits(кнопка, content("component"))).toBe(false);
  });

  it("«любой компонент» пускает и значок — значок это тоже компонент", () => {
    expect(admits(раскладка, content("icon"))).toBe(true);
    expect(admits(раскладка, content("component"))).toBe(true);
  });

  it("«любой компонент» текста не пускает — текст компонентом не является", () => {
    // Раскладке, которой нужен ещё и текст, придётся сказать это отдельно. Так честнее: узел с
    // текстом внутри и узел с компонентом внутри — разные вещи для того, кто их одевает.
    expect(admits(раскладка, content("text"))).toBe(false);
  });

  it("объявленный род не пускает содержимое ЧЕРЕЗ себя: место под значок компонентом не занять", () => {
    expect(admits(part([content("icon")]), content("component"))).toBe(false);
  });
});

describe("свои части и содержимое — один перечень", () => {
  // Второго механизма нет намеренно: часть компонента и есть вложенный компонент, увиденный с
  // другой стороны. Дерево одно, правило одно, перечень один.
  const составная = part([
    { kind: "part", name: "item" },
    content("text"),
  ]);

  it("пускает названную свою часть", () => {
    expect(admits(составная, { kind: "part", name: "item" })).toBe(true);
  });

  it("не пускает свою часть, которую не назвали", () => {
    expect(admits(составная, { kind: "part", name: "indicator" })).toBe(false);
  });

  it("разрешение на свою часть не разрешает содержимое, и наоборот", () => {
    expect(admits(составная, content("component"))).toBe(false);
    expect(admits(part([content("component")]), { kind: "part", name: "item" })).toBe(false);
  });
});

describe("группа — место компонента в перечне", () => {
  // Перечень групп закрыт и живёт у среза редактора, а не у пульта: заведи разделы витрина —
  // их заведёт и редактор, по-своему, и два перечня разойдутся. Проба стережёт обе стороны
  // закрытости — объявленное вне перечня не проходит, а неназванное не пропадает.
  const анатомия = createAnatomy("проба").parts("root");
  const паспорт = definePassport({
    anatomy: анатомия,
    root: "root",
    parts: [{ name: "root", states: [] }],
    variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
    settings: {},
  });

  const объявить = (group?: string) =>
    defineEditorInfo(паспорт, {
      package: "@проба/пакет",
      genus: "component",
      variantAxis: { means: "имя вариации" },
      parts: { root: { means: "часть для пробы" } },
      ...(group === undefined ? {} : { group: group as keyof typeof GROUPS }),
    });

  it("объявленная группа доезжает до среза редактора как есть", () => {
    expect(объявить("inputs").group).toBe("inputs");
    expect(groupOf(объявить("inputs"))).toBe("inputs");
  });

  it("группа вне перечня ОТВЕРГАЕТСЯ, и отказ называет допустимое", () => {
    // Типы закрывают перечень только для того, кто собирает типами; поставщик вправе приехать
    // и без них, поэтому отказ обязан быть machine-проверкой, а не соглашением.
    expect(() => объявить("мой-собственный-раздел")).toThrow(/не из перечня/);
    expect(() => объявить("мой-собственный-раздел")).toThrow(/actions/);
  });

  it("компонент без группы из перечня не исчезает — он в «прочем»", () => {
    const безГруппы = объявить();

    expect(безГруппы.group).toBeUndefined();
    expect(groupOf(безГруппы)).toBe("other");
    expect(GROUPS[groupOf(безГруппы)]).toBe("Прочее");
  });

  it("у каждой группы есть подпись — иначе её напишет каждый пульт по-своему", () => {
    const подписи = Object.values(GROUPS);

    expect(подписи.length).toBeGreaterThan(0);
    for (const подпись of подписи) expect(подпись.trim().length).toBeGreaterThan(0);
    // Подписи не повторяются: два раздела с одним именем в перечне неразличимы.
    expect(new Set(подписи).size).toBe(подписи.length);
  });

  it("запасная группа объявлена в самом перечне, а не рядом с ним", () => {
    // Иначе умолчание оказалось бы разделом, которого в перечне нет, и пульт показал бы его
    // без имени — либо придумал бы имя сам.
    expect(Object.keys(GROUPS)).toContain(groupOf(объявить()));
  });
});

// СБОРКА — теперь СПИСКОМ (`PWEB-115`), и то, что срез редактора отвергает при объявлении.
//
// Части здесь синтетические по той же причине, что и выше: проверяется ПРАВИЛО, а не гармошка.
// Отказ на объявлении, а не значение в отчёте, — потому что сборка, не собирающаяся по
// собственным правилам паспорта, не должна доехать до потребителя вовсе. Тем же приёмом отвергает
// несобранную карту `defineKitComponent`.
describe("срез редактора отвергает сборку, не сходящуюся с паспортом", () => {
  const анатомия = createAnatomy("проба").parts("root", "item");
  const паспорт = definePassport({
    anatomy: анатомия,
    root: "root",
    parts: [
      { name: "root", states: [] },
      { name: "item", states: [] },
    ],
    variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
    settings: {},
  });

  /** Срез редактора с подставленной сборкой. Всё остальное — минимум, лишь бы срез собрался. */
  const объявить = (assembly: unknown) =>
    defineEditorInfo(паспорт, {
      package: "@проба/пакет",
      genus: "component",
      variantAxis: { means: "имя вариации" },
      parts: {
        root: { means: "корень", accepts: [{ kind: "part", name: "item" }] },
        item: { means: "вложенная часть", accepts: [] },
      },
      assemblies: [assembly as never],
    });

  it("сходящаяся сборка объявляется молча", () => {
    expect(
      объявить({ means: "корень с частью", tree: { part: "root", children: [{ part: "item" }] } })
        .assemblies[0]?.means,
    ).toBe("корень с частью");
  });

  it("корень сборки — только корневая часть: иначе дерево не соберётся у потребителя", () => {
    expect(() => объявить({ means: "не с корня", tree: { part: "item" } })).toThrow(/item/);
  });

  it("часть мимо анатомии отвергается с её именем — адресовать её нечем", () => {
    expect(() =>
      объявить({ means: "выдуманная часть", tree: { part: "root", children: [{ part: "тень" }] } }),
    ).toThrow(/тень/);
  });

  it("недопустимое вложение отвергается ТЕМ ЖЕ правилом, которым его отвергнет редактор", () => {
    // `item` не пускает внутрь ничего (пустой перечень). Собери поставщик экземпляр, которого
    // редактор собрать не даст, — расхождение вскрылось бы у человека, а не здесь.
    expect(() =>
      объявить({
        means: "текст внутрь занятого места",
        tree: {
          part: "root",
          children: [{ part: "item", children: [{ genus: "text", value: "нельзя" }] }],
        },
      }),
    ).toThrow(/item/);
  });

  it("сборок объявляется СКОЛЬКО УГОДНО — список, а не одна запись", () => {
    const info = defineEditorInfo(паспорт, {
      package: "@проба/пакет",
      genus: "component",
      variantAxis: { means: "имя вариации" },
      parts: {
        root: { means: "корень", accepts: [{ kind: "part", name: "item" }] },
        item: { means: "вложенная часть", accepts: [] },
      },
      assemblies: [
        { means: "пустая", tree: { part: "root" } },
        { means: "с частью", tree: { part: "root", children: [{ part: "item" }] } },
      ],
    });

    expect(info.assemblies.map((assembly) => assembly.means)).toEqual(["пустая", "с частью"]);
  });

  it("сборок может не быть вовсе — компонент, который их ещё не объявил", () => {
    const info = defineEditorInfo(паспорт, {
      package: "@проба/пакет",
      genus: "component",
      variantAxis: { means: "имя вариации" },
      parts: {
        root: { means: "корень" },
        item: { means: "вложенная часть" },
      },
    });

    expect(info.assemblies).toEqual([]);
  });
});

describe("срез редактора сверяет части, состояния и переменные с рантаймом", () => {
  const анатомия = createAnatomy("проба-сверки").parts("root", "item");
  const паспорт = definePassport({
    anatomy: анатомия,
    root: "root",
    parts: [
      { name: "root", states: [{ name: "open", mark: { kind: "attribute", name: "data-state" } }] },
      { name: "item", states: [] },
    ],
    variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
    settings: {},
  });

  it("часть анатомии, забытая в срезе редактора, отвергается", () => {
    expect(() =>
      defineEditorInfo(паспорт, {
        package: "@проба/пакет",
        genus: "component",
        variantAxis: { means: "имя вариации" },
        parts: { root: { means: "корень" } } as never,
      }),
    ).toThrow(/item/);
  });

  it("часть, которой нет в анатомии, отвергается", () => {
    expect(() =>
      defineEditorInfo(паспорт, {
        package: "@проба/пакет",
        genus: "component",
        variantAxis: { means: "имя вариации" },
        parts: { root: { means: "корень" }, item: { means: "часть" }, тень: { means: "лишнее" } } as never,
      }),
    ).toThrow(/тень/);
  });

  it("состояние рантайма, забытое в срезе редактора, отвергается", () => {
    expect(() =>
      defineEditorInfo(паспорт, {
        package: "@проба/пакет",
        genus: "component",
        variantAxis: { means: "имя вариации" },
        parts: { root: { means: "корень" }, item: { means: "часть" } },
      }),
    ).toThrow(/open/);
  });

  it("состояние, названное в срезе редактора, но отсутствующее в рантайме, отвергается", () => {
    expect(() =>
      defineEditorInfo(паспорт, {
        package: "@проба/пакет",
        genus: "component",
        variantAxis: { means: "имя вариации" },
        parts: {
          root: { means: "корень", states: { open: { means: "раскрыто" }, closed: { means: "лишнее" } } },
          item: { means: "часть" },
        },
      }),
    ).toThrow(/closed/);
  });

  it("совпавшее объявление проходит и несёт означенное", () => {
    const info = defineEditorInfo(паспорт, {
      package: "@проба/пакет",
      genus: "component",
      variantAxis: { means: "имя вариации" },
      parts: {
        root: { means: "корень", states: { open: { means: "раскрыто" } } },
        item: { means: "часть" },
      },
    });

    expect(info.parts.root.states?.open?.means).toBe("раскрыто");
  });
});

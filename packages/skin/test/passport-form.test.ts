// Гейт того, что форма паспорта РЕШАЕТ сама: правило вложенности (`PWEB-24`), место компонента
// в перечне (`PWEB-34`) и годность состояния адресом вида (`PWEB-97`). Все три живут у формы по
// одной причине — правило, написанное вторым читателем, разъезжается с написанным первым молча.
//
// Ниже сначала вложенность, затем группы, в конце — приход признака.
//
// Пробы кнопки сторожат ОБЪЯВЛЕНИЕ — что записано в её паспорте и доезжает ли объявленное до
// живого узла. Здесь сторожится само правило: как читатель паспорта — редактор, механика сборки —
// превращает записанное в ответ «пускать или отвергнуть».
//
// Разделены они намеренно. Правило одно на всех поставщиков компонентов, и проверять его на
// единственном имеющемся компоненте значило бы проверять кнопку вместо правила: у кнопки одна
// часть, своих детей нет, а умолчание не встречается вовсе. Части здесь поэтому синтетические —
// они и есть предмет пробы.
//
// Родов три, и таблица подходимости несимметрична: значок — тоже компонент, компонент значком не
// становится. Несимметричность и делает правило работающим: будь она в обе стороны, «только текст
// или значок» не отвергало бы ничего.
//
// ПОРТИРОВАНО из `packages/ui/test/passport-form.test.ts` при переезде формы (`PWEB-110`,
// `PWEB-113`): файл проверял форму напрямую и не переехал вместе с ней — фикстуры `packages/skin`
// (`test/passports.ts`, `rules.test.ts`) используют форму КОСВЕННО, как материал для проб CSS и
// правил, а не как прямую проверку решений самой формы. Предмет и материал не пересказаны заново
// — перенесены как были; поменялся только путь до модуля и то, что `createAnatomy` теперь берётся
// оттуда же, откуда `definePassport` (реэкспорт, `PWEB-112`), а не вторым импортом того же пакета.

import { describe, expect, it } from "vitest";

import {
  addressesView,
  admits,
  createAnatomy,
  definePassport,
  GROUPS,
  groupOf,
  settingApplies,
  type PassportGenus,
  type PassportMark,
  type PassportPart,
  type PassportSetting,
  type PassportSettingName,
  type PassportState,
} from "../src/passport-form.js";

/** Часть с объявленным правилом. Состояния и назначение здесь ни при чём — их проба не трогает. */
function part(accepts?: PassportPart["accepts"]): PassportPart {
  return { name: "root", means: "часть для пробы", states: [], accepts };
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
  // Перечень групп закрыт и живёт у формы, а не у пульта: заведи разделы витрина — их заведёт
  // и редактор, по-своему, и два перечня разойдутся. Проба стережёт обе стороны закрытости —
  // объявленное вне перечня не проходит, а неназванное не пропадает.
  const анатомия = createAnatomy("проба").parts("root");
  const объявить = (group?: string) =>
    definePassport({
      anatomy: анатомия,
      package: "@проба/пакет",
      genus: "component",
      root: "root",
      parts: [{ name: "root", means: "часть для пробы", states: [] }],
      variantAxis: { means: "имя вариации", mark: { kind: "attribute", name: "data-variant" } },
      settings: {},
      ...(group === undefined ? {} : { group: group as keyof typeof GROUPS }),
    });

  it("объявленная группа доезжает до паспорта как есть", () => {
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

// БАЗОВАЯ СБОРКА и ПЕРЕМЕННЫЕ УЗЛА (`PWEB-89`) — то, что форма отвергает при объявлении.
//
// Части здесь синтетические по той же причине, что и выше: проверяется ПРАВИЛО, а не гармошка.
// Отказ на объявлении, а не значение в отчёте, — потому что сборка, не собирающаяся по
// собственным правилам паспорта, не должна доехать до потребителя вовсе. Тем же приёмом отвергает
// несобранную карту `defineKitComponent`.
describe("форма отвергает сборку, не сходящуюся с паспортом", () => {
  const анатомия = createAnatomy("проба").parts("root", "item");

  /** Объявление с подставленной сборкой. Всё остальное — минимум, лишь бы паспорт собрался. */
  const объявить = (assembly: unknown) =>
    definePassport({
      anatomy: анатомия,
      package: "@проба/пакет",
      genus: "component",
      root: "root",
      parts: [
        { name: "root", means: "корень", states: [], accepts: [{ kind: "part", name: "item" }] },
        { name: "item", means: "вложенная часть", states: [], accepts: [] },
      ],
      variantAxis: { means: "имя вариации", mark: { kind: "attribute", name: "data-variant" } },
      settings: {},
      assembly: assembly as never,
    });

  it("сходящаяся сборка объявляется молча", () => {
    expect(
      объявить({ means: "корень с частью", tree: { part: "root", children: [{ part: "item" }] } })
        .assembly?.means,
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
});

describe("форма отвергает переменную, не являющуюся кастом-свойством", () => {
  const анатомия = createAnatomy("проба-переменных").parts("root");

  const объявить = (variables: unknown) =>
    definePassport({
      anatomy: анатомия,
      package: "@проба/пакет",
      genus: "component",
      root: "root",
      parts: [{ name: "root", means: "корень", states: [], variables: variables as never }],
      variantAxis: { means: "имя вариации", mark: { kind: "attribute", name: "data-variant" } },
      settings: {},
    });

  it("имя с двумя дефисами проходит", () => {
    expect(
      объявить([{ name: "--height", means: "высота", setBy: "kit" }]).parts[0]?.variables?.length,
    ).toBe(1);
  });

  it("имя без дефисов отвергается: скин порождает из него `var(--…)` и получил бы мёртвое правило", () => {
    expect(() => объявить([{ name: "height", means: "высота", setBy: "kit" }])).toThrow(/height/);
  });
});

describe("форма отвергает настройку не из перечня", () => {
  const анатомия = createAnatomy("проба-настроек").parts("root");

  const объявить = (settings: unknown) =>
    definePassport({
      anatomy: анатомия,
      package: "@проба/пакет",
      genus: "component",
      root: "root",
      parts: [{ name: "root", means: "корень", states: [] }],
      variantAxis: { means: "имя вариации", mark: { kind: "attribute", name: "data-variant" } },
      settings: settings as never,
    });

  it("имя из перечня проходит", () => {
    expect(
      Object.keys(
        объявить({ multiple: { means: "несколько", values: { kind: "flag" }, byDefault: false } })
          .settings,
      ),
    ).toEqual(["multiple"]);
  });

  it("своё имя отвергается — иначе один пульт покажет настройку, а второй не покажет вовсе", () => {
    // Типы стерегут TypeScript-поставщика; эта проверка — любого, включая приехавшего сборкой
    // без типов. Ровно та же оговорка, что у перечня групп.
    expect(() =>
      объявить({ вертикально: { means: "своё имя", values: { kind: "flag" }, byDefault: false } }),
    ).toThrow(/вертикально/);
  });
});

// НАСТРОЙКА МОЖЕТ НЕСТИ `mark` — тем же типом, что состояние (`PassportState.mark`, `PWEB-104`).
//
// Поле необязательное: настройка меняет ПОВЕДЕНИЕ и не обязана иметь видимый след — `multiple` и
// `collapsible` у гармошки своего атрибута не имеют вовсе. Проба стережёт обе стороны: старый
// паспорт без поля собирается как прежде, а объявленный `mark` доезжает до паспорта без изменений.
describe("настройка может нести mark — как у состояния", () => {
  const анатомия = createAnatomy("проба-mark").parts("root");

  const объявить = (mark?: PassportMark) =>
    definePassport({
      anatomy: анатомия,
      package: "@проба/пакет",
      genus: "component",
      root: "root",
      parts: [{ name: "root", means: "корень", states: [] }],
      variantAxis: { means: "имя вариации", mark: { kind: "attribute", name: "data-variant" } },
      settings: {
        multiple: {
          means: "признак для пробы",
          values: { kind: "flag" },
          byDefault: false,
          ...(mark ? { mark } : {}),
        },
      },
    });

  it("настройка без mark собирается как прежде — поле необязательно", () => {
    expect(объявить().settings.multiple?.mark).toBeUndefined();
  });

  it("объявленный mark доезжает до паспорта как есть", () => {
    const mark: PassportMark = { kind: "attribute", name: "data-multiple" };

    expect(объявить(mark).settings.multiple?.mark).toEqual(mark);
  });
});

// ЗАВИСИМОСТЬ НАСТРОЙКИ ОТ ДРУГОЙ — `settingApplies` (`SKINED-7`).
//
// Правило одно на всех поставщиков, и проверяется оно поэтому НЕ на гармошке: у гармошки
// зависимость сегодня ровно одна («multiple» глушит «collapsible»), и проба на живом компоненте
// стерегла бы её собственный паспорт, а не правило. Имена настроек ниже — «плотность» и «цвет» —
// СВОИ, не из закрытого перечня SETTINGS и не пара «multiple»/«collapsible»: если бы функция читала
// эти имена в упор, а не данные `dependsOn`, она бы здесь просто не сработала. Годится это потому,
// что `settingApplies` принимает запись настроек значением, а не паспорт, — закрытый перечень
// стережёт объявление (`definePassport`), а не саму функцию.
describe("settingApplies: действует ли настройка при текущих значениях", () => {
  it("настройка без dependsOn действует всегда", () => {
    const настройки: Readonly<Record<string, PassportSetting>> = {
      сама: { means: "проба", values: { kind: "flag" }, byDefault: false },
    };

    expect(settingApplies(настройки, "сама", {})).toBe(true);
    expect(settingApplies(настройки, "сама", { сама: true })).toBe(true);
  });

  it("значение источника, названное явно, решает напрямую", () => {
    const настройки: Readonly<Record<string, PassportSetting>> = {
      плотность: {
        means: "проба-источник",
        values: { kind: "choice", options: [{ value: "высокая", means: "высокая" }] },
        byDefault: "низкая",
      },
      цвет: {
        means: "проба — глушится высокой плотностью",
        values: { kind: "flag" },
        byDefault: false,
        dependsOn: { on: "плотность" as PassportSettingName, redundantWhen: "высокая" },
      },
    };

    expect(settingApplies(настройки, "цвет", { плотность: "низкая" })).toBe(true);
    expect(settingApplies(настройки, "цвет", { плотность: "высокая" })).toBe(false);
  });

  it("источник, не названный в значениях, решает СВОИМ умолчанием — тем же доводом, что у byDefault", () => {
    const глушащееУмолчание: Readonly<Record<string, PassportSetting>> = {
      плотность: {
        means: "проба-источник",
        values: { kind: "choice", options: [{ value: "низкая", means: "низкая" }] },
        byDefault: "высокая",
      },
      цвет: {
        means: "проба",
        values: { kind: "flag" },
        byDefault: false,
        dependsOn: { on: "плотность" as PassportSettingName, redundantWhen: "высокая" },
      },
    };

    // Умолчание источника СОВПАДАЕТ с redundantWhen — «не выставлено» и «выставлено умолчанием»
    // здесь одно и то же положение, и настройка глушится молча, без единого явного значения.
    expect(settingApplies(глушащееУмолчание, "цвет", {})).toBe(false);
  });

  it("источник без явного значения, чьё умолчание НЕ совпадает с redundantWhen, оставляет настройку в действии", () => {
    const настройки: Readonly<Record<string, PassportSetting>> = {
      плотность: {
        means: "проба-источник",
        values: { kind: "choice", options: [{ value: "высокая", means: "высокая" }] },
        byDefault: "низкая",
      },
      цвет: {
        means: "проба",
        values: { kind: "flag" },
        byDefault: false,
        dependsOn: { on: "плотность" as PassportSettingName, redundantWhen: "высокая" },
      },
    };

    expect(settingApplies(настройки, "цвет", {})).toBe(true);
  });

  it("работает на ПОЛНОМ паспорте чужого компонента, не гармошки", () => {
    // Собранном через definePassport — доказано, что зависимость доезжает через объявление до
    // паспорта, а не только читается из руками собранной записи выше.
    const паспорт = definePassport({
      anatomy: createAnatomy("проба-зависимости").parts("root"),
      package: "@проба/пакет",
      genus: "component",
      root: "root",
      parts: [{ name: "root", means: "корень", states: [] }],
      variantAxis: { means: "имя вариации", mark: { kind: "attribute", name: "data-variant" } },
      settings: {
        orientation: {
          means: "положение",
          values: { kind: "choice", options: [{ value: "horizontal", means: "боком" }] },
          byDefault: "vertical",
        },
        multiple: {
          means: "проба",
          values: { kind: "flag" },
          byDefault: false,
          dependsOn: { on: "orientation", redundantWhen: "horizontal" },
        },
      },
    });

    expect(settingApplies(паспорт.settings, "multiple", { orientation: "vertical" })).toBe(true);
    expect(settingApplies(паспорт.settings, "multiple", { orientation: "horizontal" })).toBe(false);
  });

  it("объявление отвергает зависимость от настройки, которой у компонента нет", () => {
    // Названо, но отсутствует у ЭТОГО поставщика: `settingApplies` иначе читал бы `undefined`
    // вместо умолчания чужой настройки молча — отказ ловит это на объявлении, а не у потребителя.
    expect(() =>
      definePassport({
        anatomy: createAnatomy("проба-сироты").parts("root"),
        package: "@проба/пакет",
        genus: "component",
        root: "root",
        parts: [{ name: "root", means: "корень", states: [] }],
        variantAxis: { means: "имя вариации", mark: { kind: "attribute", name: "data-variant" } },
        settings: {
          collapsible: {
            means: "проба",
            values: { kind: "flag" },
            byDefault: false,
            dependsOn: { on: "multiple", redundantWhen: true },
          },
        },
      }),
    ).toThrow(/«collapsible».*«multiple»/);
  });
});

// ОБЯЗАТЕЛЬНОСТЬ НАСТРОЕК ДЕРЖИТ ТИП (`PWEB-92`).
//
// Пустая запись — УТВЕРЖДЕНИЕ «настроек у компонента нет», а не забывчивость. Пока поле было
// необязательным, паспорт без него собирался, и «настроек нет» становилось неотличимо от
// «поставщик не подумал»; отдельная проба на обязательность стерегла бы только своих поставщиков,
// а форма паспорта общая — по ней объявляется и продуктовый пакет со своей таблицей.
//
// Проверка сделана `@ts-expect-error`, и это НЕ комментарий, а машина: перестань объявление быть
// ошибкой типа — покраснеет сам `@ts-expect-error`, то есть `tsc` уронит прогон. Ослабь кто-нибудь
// поле обратно — узнаем здесь, а не у потребителя.
describe("настройки обязательны — и обязательность держит тип", () => {
  const анатомия = createAnatomy("проба-обязательности").parts("root");

  const общее = {
    anatomy: анатомия,
    package: "@проба/пакет",
    genus: "component",
    root: "root",
    parts: [{ name: "root", means: "корень", states: [] }],
    variantAxis: { means: "имя вариации", mark: { kind: "attribute", name: "data-variant" } },
  } as const;

  it("паспорт БЕЗ настроек не собирается: отказ типом и названный отказ на исполнении", () => {
    // @ts-expect-error — поле `settings` обязательно; умолчания у него нет намеренно, потому что
    // заполнение пустым за того, кто не объявил, и есть снимаемый разъезд.
    const без = () => definePassport(общее);

    // Вторая половина — про поставщика, приехавшего сборкой без TypeScript: он обязан получить
    // НАЗВАННЫЙ отказ, а не безымянный `TypeError` из первого обхода записи. Тот же довод, что у
    // закрытого перечня групп.
    expect(без).toThrow(/паспорт без настроек/);
  });

  it("паспорт С пустыми настройками собирается и несёт пустую запись", () => {
    expect(definePassport({ ...общее, settings: {} }).settings).toEqual({});
  });
});

// Годность состояния АДРЕСОМ ВИДА (`PWEB-97`).
//
// Правило одно на всех поставщиков, и проверяется оно поэтому на синтетических состояниях, а не на
// гармошке: у гармошки такое состояние сегодня ровно одно, и проба на ней сторожила бы её паспорт,
// а не правило. Читателей под вид уже несколько — мост, механика скина, редактор, — и весь смысл
// правила в том, что решают они одинаково.
describe("признак, которого может не быть, адресом вида не является", () => {
  const надёжное: PassportState = {
    name: "open",
    means: "раскрыто",
    mark: { kind: "attribute", name: "data-state", value: "open" },
  };

  const ненадёжное: PassportState = {
    ...надёжное,
    absentWhen: "раскрытие прошло без анимации — поставщик снимает признак целиком",
  };

  it("молчание — это «приезжает всегда»: состояние годится адресом", () => {
    // Умолчание обязано быть рабочим: объявляй каждый поставщик надёжность вслух, поле стало бы
    // обязательным ради одного исключения, а забытое — превращало бы обычное состояние в изгоя.
    expect(addressesView(надёжное)).toBe(true);
  });

  it("названное обстоятельство отбирает у состояния адрес вида", () => {
    expect(addressesView(ненадёжное)).toBe(false);
  });

  it("решает НАЛИЧИЕ поля, а не слова в нём — читателю разбирать текст нечем", () => {
    // Текст здесь человеку и редактору: он называет, КОГДА признака нет. Машина читает сам факт
    // объявления — иначе правило зависело бы от формулировки, и второй поставщик написал бы её
    // иначе, оставаясь зелёным.
    expect(addressesView({ ...надёжное, absentWhen: "что угодно" })).toBe(false);
  });

  it("состояние остаётся ЗАКОННЫМ — оно объявлено для движения, а не отменено", () => {
    // Ради этого поле и заведено. Отбрось паспорт такое состояние вовсе — движение не узнало бы о
    // нём ничего; отдай он его виду — правило скина применялось бы через раз.
    const паспорт = definePassport({
      anatomy: createAnatomy("проба-прихода").parts("root"),
      package: "@проба/пакет",
      genus: "component",
      root: "root",
      settings: {},
      parts: [{ name: "root", means: "корень", states: [ненадёжное] }],
      variantAxis: { means: "имя вариации", mark: { kind: "attribute", name: "data-variant" } },
    });

    const состояние = паспорт.parts[0].states[0];

    expect(состояние.name).toBe("open");
    expect(состояние.mark).toEqual(надёжное.mark);
    expect(состояние.absentWhen).toBe(ненадёжное.absentWhen);
  });
});

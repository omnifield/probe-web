// Гейт того, что форма паспорта РЕШАЕТ сама в СРЕЗЕ РАНТАЙМА: годность состояния адресом вида
// (`PWEB-97`), обязательность настроек (`PWEB-92`), зависимость настройки от другой (`SKINED-7`),
// отказ на переменной без кастом-свойства и на настройке не из перечня.
//
// Правило вложенности (`admits`, `PWEB-24`) и место компонента в перечне (`GROUPS`/`groupOf`,
// `PWEB-34`) отсюда УЕХАЛИ (`PWEB-115`) — они читают срез РЕДАКТОРА, а не рантайм, и живут теперь
// в `passport-editor.test.ts` вместе со сборкой, которая тем же ходом стала списком.
//
// ПОРТИРОВАНО из `packages/ui/test/passport-form.test.ts` при переезде формы (`PWEB-110`,
// `PWEB-113`), затем разрезано на срез рантайма и срез редактора (`PWEB-115`).

import { describe, expect, it } from "vitest";

import {
  addressesView,
  createAnatomy,
  definePassport,
  settingApplies,
  type PassportMark,
  type PassportSetting,
  type PassportSettingName,
  type PassportState,
} from "../src/passport-form.js";

describe("форма отвергает переменную, не являющуюся кастом-свойством", () => {
  const анатомия = createAnatomy("проба-переменных").parts("root");

  const объявить = (variables: unknown) =>
    definePassport({
      anatomy: анатомия,
      root: "root",
      parts: [{ name: "root", states: [], variables: variables as never }],
      variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
      settings: {},
    });

  it("имя с двумя дефисами проходит", () => {
    expect(объявить([{ name: "--height", setBy: "kit" }]).parts[0]?.variables?.length).toBe(1);
  });

  it("имя без дефисов отвергается: скин порождает из него `var(--…)` и получил бы мёртвое правило", () => {
    expect(() => объявить([{ name: "height", setBy: "kit" }])).toThrow(/height/);
  });
});

describe("форма отвергает настройку не из перечня", () => {
  const анатомия = createAnatomy("проба-настроек").parts("root");

  const объявить = (settings: unknown) =>
    definePassport({
      anatomy: анатомия,
      root: "root",
      parts: [{ name: "root", states: [] }],
      variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
      settings: settings as never,
    });

  it("имя из перечня проходит", () => {
    expect(
      Object.keys(объявить({ multiple: { values: { kind: "flag" }, byDefault: false } }).settings),
    ).toEqual(["multiple"]);
  });

  it("своё имя отвергается — иначе один пульт покажет настройку, а второй не покажет вовсе", () => {
    // Типы стерегут TypeScript-поставщика; эта проверка — любого, включая приехавшего сборкой
    // без типов. Ровно та же оговорка, что у перечня групп в срезе редактора.
    expect(() => объявить({ вертикально: { values: { kind: "flag" }, byDefault: false } })).toThrow(
      /вертикально/,
    );
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
      root: "root",
      parts: [{ name: "root", states: [] }],
      variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
      settings: {
        multiple: {
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
      сама: { values: { kind: "flag" }, byDefault: false },
    };

    expect(settingApplies(настройки, "сама", {})).toBe(true);
    expect(settingApplies(настройки, "сама", { сама: true })).toBe(true);
  });

  it("значение источника, названное явно, решает напрямую", () => {
    const настройки: Readonly<Record<string, PassportSetting>> = {
      плотность: {
        values: { kind: "choice", options: [{ value: "высокая" }] },
        byDefault: "низкая",
      },
      цвет: {
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
        values: { kind: "choice", options: [{ value: "низкая" }] },
        byDefault: "высокая",
      },
      цвет: {
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
        values: { kind: "choice", options: [{ value: "высокая" }] },
        byDefault: "низкая",
      },
      цвет: {
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
      root: "root",
      parts: [{ name: "root", states: [] }],
      variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
      settings: {
        orientation: {
          values: { kind: "choice", options: [{ value: "horizontal" }] },
          byDefault: "vertical",
        },
        multiple: {
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
        root: "root",
        parts: [{ name: "root", states: [] }],
        variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
        settings: {
          collapsible: {
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
    root: "root",
    parts: [{ name: "root", states: [] }],
    variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
  } as const;

  it("паспорт БЕЗ настроек не собирается: отказ типом и названный отказ на исполнении", () => {
    // @ts-expect-error — поле `settings` обязательно; умолчания у него нет намеренно, потому что
    // заполнение пустым за того, кто не объявил, и есть снимаемый разъезд.
    const без = () => definePassport(общее);

    // Вторая половина — про поставщика, приехавшего сборкой без TypeScript: он обязан получить
    // НАЗВАННЫЙ отказ, а не безымянный `TypeError` из первого обхода записи. Тот же довод, что у
    // закрытого перечня групп в срезе редактора.
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
      settings: {},
      root: "root",
      parts: [{ name: "root", states: [ненадёжное] }],
      variantAxis: { mark: { kind: "attribute", name: "data-variant" } },
    });

    const состояние = паспорт.parts[0].states[0];

    expect(состояние.name).toBe("open");
    expect(состояние.mark).toEqual(надёжное.mark);
    expect(состояние.absentWhen).toBe(ненадёжное.absentWhen);
  });
});

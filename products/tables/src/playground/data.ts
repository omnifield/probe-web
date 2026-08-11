// Данные площадки — локальные, вместо бэка. Заявки, у которых НАБОР ПОЛЕЙ РАЗНЫЙ: это и есть
// опорный кейс волны, ради него объекты здесь неровные намеренно.
//
// Отдельно разведены три состояния поля, потому что фильтр обязан их различать:
//   • поля нет вовсе          → `exists` = нет
//   • поле есть, но пустое    → `exists` = да, `filled` = нет
//   • поле есть и заполнено   → оба да
//
// Контакты лежат ВЛОЖЕННО (`contact.phone`, `contact.email`) — специально, чтобы площадка
// проверяла ссылку-путь, а не только плоские имена. У части строк нет самого `contact`, у
// части он есть, а телефона в нём нет: это разные вещи, и путь обязан их различать.

import type { Preset, Row, Template } from "../filters/index.js";
import type { ColumnSpec } from "../table/index.js";

/**
 * ОДИН словарь на отбор и на таблицу: ссылка-путь (JSON Pointer), подпись, ТИП и показ.
 *
 * Тип нужен обоим: фильтру — чтобы предложить операторы и разобрать введённое значение,
 * таблице — чтобы сравнить значения при сортировке. Формат нужен только таблице и на фильтр
 * не влияет: он про то, каким значение видит человек, а не про то, что в поле лежит.
 *
 * Второй словарь развёл бы фильтр и таблицу на первой правке, поэтому его здесь нет.
 */
export const COLUMNS: ColumnSpec[] = [
  { name: "/applicant", label: "заявитель", type: "text" },
  { name: "/agent", label: "агент", type: "text" },
  { name: "/passport", label: "паспорт", type: "text" },
  { name: "/snils", label: "СНИЛС", type: "text" },
  { name: "/inn", label: "ИНН", type: "text" },
  { name: "/contact/phone", label: "телефон", type: "text" },
  { name: "/contact/email", label: "почта", type: "text" },
  { name: "/amount", label: "сумма", type: "number", formatOptions: { fractionDigits: 0 } },
  { name: "/created", label: "заведена", type: "date" },
  { name: "/share", label: "доля одобрения", type: "number", format: "percent" },
  { name: "/score", label: "рейтинг", type: "number", format: "rating", formatOptions: { ratingMax: 5 } },
  { name: "/region", label: "регион", type: "text" },
  { name: "/status", label: "статус", type: "text" },
  { name: "/urgent", label: "срочная", type: "bool" },
  { name: "/comment", label: "комментарий", type: "text", sortable: false },
];

export const ROWS: Row[] = [
  {
    applicant: "Иванов И. И.",
    passport: "4510 123456",
    snils: "112-233-445 95",
    inn: "770123456789",
    contact: { phone: "+7 900 111-22-33" },
    amount: 850_000,
    created: "2026-07-14",
    share: 0.82,
    score: 4.5,
    region: "Москва",
    status: "в работе",
    urgent: false,
  },
  {
    applicant: "Петрова А. С.",
    passport: "4511 654321",
    snils: "",
    contact: { phone: "+7 901 222-33-44" },
    amount: 120_000,
    created: "2026-08-02",
    share: 0.31,
    score: 2,
    region: "Москва",
    status: "новая",
    urgent: true,
  },
  {
    applicant: "Сидоров П. К.",
    inn: "780987654321",
    contact: { email: "sidorov@example.ru" },
    amount: 1_400_000,
    created: "2026-06-30",
    score: 5,
    region: "Санкт-Петербург",
    status: "в работе",
    comment: "просит перезвонить после 18:00",
  },
  {
    agent: "ООО «Вектор»",
    inn: "504112233445",
    amount: 3_200_000,
    created: "2026-05-19",
    share: 0.64,
    region: "Московская обл.",
    status: "на проверке",
  },
  {
    applicant: "",
    agent: "ИП Кузнецов",
    passport: "4612 778899",
    contact: { phone: "+7 902 333-44-55", email: "" },
    amount: 75_000,
    created: "2026-08-08",
    share: 0.05,
    score: 1,
    region: "Тула",
    status: "новая",
    urgent: true,
  },
  {
    applicant: "Николаева О. В.",
    passport: "4513 010203",
    snils: "223-344-556 07",
    inn: "770223344556",
    contact: { email: "nikolaeva@example.ru" },
    amount: 640_000,
    created: "2026-07-01",
    share: 0.97,
    score: 4,
    region: "Москва",
    status: "одобрена",
    urgent: false,
  },
  {
    applicant: "Морозов Д. А.",
    snils: "334-455-667 18",
    contact: { phone: "" },
    amount: 45_000,
    created: "2026-04-11",
    region: "Казань",
    status: "отклонена",
    comment: "нет паспорта",
  },
  {
    applicant: "Алексеева Т. Н.",
    passport: "4514 445566",
    inn: "160334455667",
    amount: 210_000,
    created: "2026-08-05",
    region: "Казань",
    status: "в работе",
  },
  {
    agent: "ООО «Ремстрой»",
    contact: { email: "office@remstroy.example" },
    amount: 5_800_000,
    created: "2026-03-27",
    region: "Екатеринбург",
    status: "на проверке",
    comment: "юрлицо, пакет неполный",
  },
  {
    applicant: "Григорьев С. С.",
    passport: "4515 998877",
    snils: "445-566-778 29",
    inn: "660445566778",
    contact: { phone: "+7 903 444-55-66", email: "grigoriev@example.ru" },
    amount: 990_000,
    created: "2026-07-22",
    share: 0.73,
    score: 3.5,
    region: "Екатеринбург",
    status: "одобрена",
    urgent: false,
  },
  {
    applicant: "Захарова Л. П.",
    contact: { phone: "+7 904 555-66-77" },
    amount: 30_000,
    created: "2026-08-09",
    region: "Тула",
    status: "новая",
    urgent: true,
  },
  {
    applicant: "Ковалёв А. Ю.",
    passport: "4516 112233",
    inn: "770556677889",
    amount: 1_750_000,
    created: "2026-06-06",
    region: "Москва",
    status: "в работе",
    comment: "",
  },
  {
    agent: "ИП Соколова",
    snils: "556-677-889 30",
    inn: "504667788990",
    contact: { phone: "+7 905 666-77-88" },
    amount: 420_000,
    created: "2026-07-30",
    region: "Московская обл.",
    status: "одобрена",
  },
  {
    applicant: "Тарасов В. В.",
    contact: { email: "" },
    amount: 88_000,
    created: "2026-05-03",
    region: "Санкт-Петербург",
    status: "отклонена",
  },
  {
    applicant: "Белова Н. И.",
    passport: "4517 334455",
    snils: "667-788-990 41",
    contact: { phone: "+7 906 777-88-99", email: "belova@example.ru" },
    amount: 2_100_000,
    created: "2026-08-01",
    share: 0.48,
    score: 3,
    region: "Санкт-Петербург",
    status: "на проверке",
    urgent: true,
  },
  {
    agent: "ООО «Апрель»",
    inn: "770778899001",
    amount: 760_000,
    created: "2026-06-18",
    score: 2.5,
    region: "Москва",
    status: "новая",
    comment: "запросить учредительные",
  },
];

/**
 * Пресеты — готовые сборки. Применяются одной кнопкой и ничего не спрашивают.
 */
export const PRESETS: Preset[] = [
  {
    id: "no-docs",
    label: "Без документов",
    hint: "ни паспорта, ни СНИЛС, ни ИНН",
    state: {
      version: 1,
      conditions: [
        {
          id: "preset-no-docs-1",
          kind: "presence",
          quantifier: "none",
          mode: "exists",
          fields: ["/passport", "/snils", "/inn"],
        },
      ],
      logic: { mode: "all" },
    },
  },
  {
    id: "full-package",
    label: "Полный пакет физлица",
    hint: "паспорт, СНИЛС и ИНН — все заполнены",
    state: {
      version: 1,
      conditions: [
        {
          id: "preset-full-1",
          kind: "presence",
          quantifier: "all",
          mode: "filled",
          fields: ["/passport", "/snils", "/inn"],
        },
      ],
      logic: { mode: "all" },
    },
  },
  {
    id: "big-in-progress",
    label: "Крупные в работе",
    hint: "сумма больше 500 000 и статус «в работе»",
    state: {
      version: 1,
      conditions: [
        { id: "preset-big-1", kind: "compare", field: "/amount", operator: "gt", value: "500000" },
        { id: "preset-big-2", kind: "compare", field: "/status", operator: "eq", value: "в работе" },
      ],
      logic: { mode: "all" },
    },
  },
  {
    id: "capitals",
    label: "Обе столицы",
    hint: "регион — одно из двух значений: одним условием, а не двумя и формулой",
    state: {
      version: 1,
      conditions: [
        {
          id: "preset-capitals-1",
          kind: "in",
          field: "/region",
          values: ["Москва", "Санкт-Петербург"],
        },
      ],
      logic: { mode: "all" },
    },
  },
  {
    id: "summer-window",
    label: "Заведены летом",
    hint: "диапазон дат, границы включительно",
    state: {
      version: 1,
      conditions: [
        {
          id: "preset-summer-1",
          kind: "between",
          field: "/created",
          from: "2026-06-01",
          to: "2026-08-31",
        },
      ],
      logic: { mode: "all" },
    },
  },
];

/**
 * Шаблоны — заготовки с дырками. Сначала спрашивают значения, потом применяются.
 *
 * Третий — дословно опорный кейс волны: «есть какое-то поле из трёх И имя заявителя».
 */
export const TEMPLATES: Template[] = [
  {
    id: "any-of-fields",
    label: "Есть любое из полей",
    hint: "выбрать набор полей, достаточно одного",
    params: [{ key: "fields", label: "какие поля", kind: "fields" }],
    state: {
      version: 1,
      conditions: [
        {
          id: "tpl-any-1",
          kind: "presence",
          quantifier: "any",
          mode: "exists",
          fields: ["{{fields}}"],
        },
      ],
      logic: { mode: "all" },
    },
  },
  {
    id: "applicant-contains",
    label: "Заявитель содержит",
    hint: "поиск по имени заявителя",
    params: [{ key: "name", label: "часть имени", kind: "text" }],
    state: {
      version: 1,
      conditions: [
        {
          id: "tpl-applicant-1",
          kind: "compare",
          field: "/applicant",
          operator: "contains",
          value: "{{name}}",
        },
      ],
      logic: { mode: "all" },
    },
  },
  {
    id: "any-of-fields-and-applicant",
    label: "Любое из полей и заполнен заявитель",
    hint: "опорный кейс: набор полей на выбор плюс обязательный заявитель",
    params: [{ key: "fields", label: "любое из полей", kind: "fields" }],
    state: {
      version: 1,
      conditions: [
        {
          id: "tpl-case-1",
          kind: "presence",
          quantifier: "any",
          mode: "exists",
          fields: ["{{fields}}"],
        },
        {
          id: "tpl-case-2",
          kind: "presence",
          quantifier: "all",
          mode: "filled",
          fields: ["/applicant"],
        },
      ],
      // Логика — ДЕРЕВО по `id`, а не строка с номерами: клон шаблона выдаёт условиям новые
      // идентификаторы и переписывает ссылки, поэтому формула переживает подстановку.
      logic: {
        mode: "formula",
        expr: { t: "and", a: { t: "ref", id: "tpl-case-1" }, b: { t: "ref", id: "tpl-case-2" } },
      },
    },
  },
];

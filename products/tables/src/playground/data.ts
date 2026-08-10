// Данные площадки — локальные, вместо бэка. Заявки, у которых НАБОР ПОЛЕЙ РАЗНЫЙ: это и есть
// опорный кейс волны, ради него объекты здесь неровные намеренно.
//
// Отдельно разведены три состояния поля, потому что фильтр обязан их различать:
//   • поля нет вовсе          → `exists` = нет
//   • поле есть, но пустое    → `exists` = да, `filled` = нет
//   • поле есть и заполнено   → оба да

import type { FieldOption, Preset, Row, Template } from "../filters/index.js";

export const FIELDS: FieldOption[] = [
  { name: "applicant", label: "заявитель" },
  { name: "agent", label: "агент" },
  { name: "passport", label: "паспорт" },
  { name: "snils", label: "СНИЛС" },
  { name: "inn", label: "ИНН" },
  { name: "phone", label: "телефон" },
  { name: "email", label: "почта" },
  { name: "amount", label: "сумма" },
  { name: "region", label: "регион" },
  { name: "status", label: "статус" },
  { name: "comment", label: "комментарий" },
];

export const ROWS: Row[] = [
  {
    applicant: "Иванов И. И.",
    passport: "4510 123456",
    snils: "112-233-445 95",
    inn: "770123456789",
    phone: "+7 900 111-22-33",
    amount: 850_000,
    region: "Москва",
    status: "в работе",
  },
  {
    applicant: "Петрова А. С.",
    passport: "4511 654321",
    snils: "",
    phone: "+7 901 222-33-44",
    amount: 120_000,
    region: "Москва",
    status: "новая",
  },
  {
    applicant: "Сидоров П. К.",
    inn: "780987654321",
    email: "sidorov@example.ru",
    amount: 1_400_000,
    region: "Санкт-Петербург",
    status: "в работе",
    comment: "просит перезвонить после 18:00",
  },
  {
    agent: "ООО «Вектор»",
    inn: "504112233445",
    amount: 3_200_000,
    region: "Московская обл.",
    status: "на проверке",
  },
  {
    applicant: "",
    agent: "ИП Кузнецов",
    passport: "4612 778899",
    phone: "+7 902 333-44-55",
    amount: 75_000,
    region: "Тула",
    status: "новая",
  },
  {
    applicant: "Николаева О. В.",
    passport: "4513 010203",
    snils: "223-344-556 07",
    inn: "770223344556",
    email: "nikolaeva@example.ru",
    amount: 640_000,
    region: "Москва",
    status: "одобрена",
  },
  {
    applicant: "Морозов Д. А.",
    snils: "334-455-667 18",
    phone: "",
    amount: 45_000,
    region: "Казань",
    status: "отклонена",
    comment: "нет паспорта",
  },
  {
    applicant: "Алексеева Т. Н.",
    passport: "4514 445566",
    inn: "160334455667",
    amount: 210_000,
    region: "Казань",
    status: "в работе",
  },
  {
    agent: "ООО «Ремстрой»",
    email: "office@remstroy.example",
    amount: 5_800_000,
    region: "Екатеринбург",
    status: "на проверке",
    comment: "юрлицо, пакет неполный",
  },
  {
    applicant: "Григорьев С. С.",
    passport: "4515 998877",
    snils: "445-566-778 29",
    inn: "660445566778",
    phone: "+7 903 444-55-66",
    email: "grigoriev@example.ru",
    amount: 990_000,
    region: "Екатеринбург",
    status: "одобрена",
  },
  {
    applicant: "Захарова Л. П.",
    phone: "+7 904 555-66-77",
    amount: 30_000,
    region: "Тула",
    status: "новая",
  },
  {
    applicant: "Ковалёв А. Ю.",
    passport: "4516 112233",
    inn: "770556677889",
    amount: 1_750_000,
    region: "Москва",
    status: "в работе",
    comment: "",
  },
  {
    agent: "ИП Соколова",
    snils: "556-677-889 30",
    inn: "504667788990",
    phone: "+7 905 666-77-88",
    amount: 420_000,
    region: "Московская обл.",
    status: "одобрена",
  },
  {
    applicant: "Тарасов В. В.",
    email: "",
    amount: 88_000,
    region: "Санкт-Петербург",
    status: "отклонена",
  },
  {
    applicant: "Белова Н. И.",
    passport: "4517 334455",
    snils: "667-788-990 41",
    phone: "+7 906 777-88-99",
    email: "belova@example.ru",
    amount: 2_100_000,
    region: "Санкт-Петербург",
    status: "на проверке",
  },
  {
    agent: "ООО «Апрель»",
    inn: "770778899001",
    amount: 760_000,
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
      conditions: [
        {
          id: "preset-no-docs-1",
          kind: "presence",
          quantifier: "none",
          mode: "exists",
          fields: ["passport", "snils", "inn"],
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
      conditions: [
        {
          id: "preset-full-1",
          kind: "presence",
          quantifier: "all",
          mode: "filled",
          fields: ["passport", "snils", "inn"],
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
      conditions: [
        { id: "preset-big-1", kind: "value", field: "amount", operator: "gt", value: "500000" },
        { id: "preset-big-2", kind: "value", field: "status", operator: "eq", value: "в работе" },
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
      conditions: [
        {
          id: "tpl-applicant-1",
          kind: "value",
          field: "applicant",
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
          fields: ["applicant"],
        },
      ],
      logic: { mode: "formula", text: "1 И 2" },
    },
  },
];

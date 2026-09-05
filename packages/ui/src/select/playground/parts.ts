// `as const`, не `Readonly<Record<SelectPart, PassportPartEditorInfo<SelectPart>>>` — явная
// аннотация расширяет ключи `states` и значения `accepts`'s `kind: "component"` до голого
// `string` ещё до того, как их увидит `defineEditorInfo` (поймано живьём на `parts.ts` аккордеона:
// опечатка в имени состояния собралась чисто при такой аннотации, поймала её только runtime-
// проверка `defineEditorInfo`, на шаг позже, чем могла бы). Проверка `defineEditorInfo` всё равно
// ловит неверный/пропущенный ключ в любом случае; `as const` дополнительно даёт поймать это `tsc`
// прямо на месте объявления.
export const parts = {
  root: {
    means: "селект целиком — подпись, контрол и плавающий список вместе",
    states: {
      invalid: { means: "селект невалиден по правилам валидации формы" },
      readonly: { means: "значение видно, выбрать другое нельзя" },
    },
    accepts: [
      { kind: "component", name: "label" },
      { kind: "component", name: "control" },
      { kind: "component", name: "positioner" },
    ],
  },
  label: {
    means: "собственная подпись селекта",
    states: {
      disabled: { means: "селект отключён" },
      invalid: { means: "селект невалиден по правилам валидации формы" },
      readonly: { means: "значение видно, выбрать другое нельзя" },
      required: { means: "выбор обязателен для отправки формы" },
    },
    accepts: [{ kind: "content", genus: "text" }],
  },
  control: {
    means: "оборачивает триггер и его индикаторы — видимая рамка, в которой сидит триггер",
    states: {
      open: { means: "список открыт" },
      closed: { means: "список закрыт" },
      focus: { means: "фокус на триггере (зеркалится сюда — сам контрол фокус принять не может)" },
      disabled: { means: "селект отключён" },
      invalid: { means: "селект невалиден по правилам валидации формы" },
    },
    accepts: [
      { kind: "component", name: "trigger" },
      { kind: "component", name: "clearTrigger" },
      { kind: "component", name: "indicator" },
    ],
  },
  trigger: {
    means: "кнопка, открывающая и закрывающая список",
    states: {
      open: { means: "список открыт" },
      closed: { means: "список закрыт" },
      disabled: { means: "селект отключён — триггер не реагирует" },
      invalid: { means: "селект невалиден по правилам валидации формы" },
      readonly: { means: "значение видно, выбрать другое нельзя" },
      placeholder: { means: "значение ещё не выбрано — показан текст плейсхолдера" },
      hover: { means: "указатель наведён на триггер" },
      "focus-visible": { means: "фокус пришёл с клавиатуры — нужна обводка; при клике мышью это шум" },
      active: { means: "триггер нажат и удерживается" },
    },
    // ValueText — единственное, что реально лежит внутри триггера в композиции Ark; ClearTrigger
    // и Indicator — соседние дети control'а, не триггера.
    accepts: [{ kind: "component", name: "valueText" }],
  },
  valueText: {
    means: "показывает выбранное значение(я), либо плейсхолдер, если ничего не выбрано",
    states: {
      disabled: { means: "селект отключён" },
      invalid: { means: "селект невалиден по правилам валидации формы" },
      focus: { means: "фокус на триггере (зеркалится сюда же, что и на control)" },
    },
    // Занята собственным вычисленным текстом кита — потребитель сюда ничего не кладёт.
    accepts: [],
  },
  clearTrigger: {
    means: "кнопка, сбрасывающая текущий выбор",
    states: {
      invalid: { means: "селект невалиден по правилам валидации формы" },
      disabled: { means: "селект отключён — клик по кнопке ничего не делает" },
      hover: { means: "указатель наведён на кнопку" },
      "focus-visible": { means: "фокус пришёл с клавиатуры — нужна обводка; при клике мышью это шум" },
      active: { means: "кнопка нажата и удерживается" },
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  indicator: {
    means: "индикатор открыт/закрыт — стрелку кладёт потребитель",
    states: {
      open: { means: "список открыт" },
      closed: { means: "список закрыт" },
      disabled: { means: "селект отключён" },
      invalid: { means: "селект невалиден по правилам валидации формы" },
      readonly: { means: "значение видно, выбрать другое нельзя" },
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  positioner: {
    means: "позиционирует плавающий список относительно триггера",
    variables: {
      "--reference-width": { means: "измеренная ширина триггера — список может под неё подстроиться" },
      "--reference-height": { means: "измеренная высота триггера" },
      "--available-width": { means: "место, оставшееся до края области просмотра, по ширине" },
      "--available-height": { means: "место, оставшееся до края области просмотра, по высоте — ограничивает длинный список" },
    },
    accepts: [{ kind: "component", name: "content" }],
  },
  content: {
    means: "сам плавающий список — здесь живут пункты, сгруппированные или нет",
    states: {
      open: { means: "список открыт" },
      closed: { means: "список закрыт" },
    },
    accepts: [
      { kind: "component", name: "list" },
      { kind: "component", name: "itemGroup" },
      { kind: "component", name: "item" },
    ],
  },
  list: {
    means: "внутренняя область списка внутри content — необязательная альтернатива вложению пунктов прямо в него",
    accepts: [
      { kind: "component", name: "itemGroup" },
      { kind: "component", name: "item" },
    ],
  },
  itemGroup: {
    means: "группирует связанные пункты под одной подписью",
    states: {
      disabled: { means: "селект отключён" },
    },
    accepts: [
      { kind: "component", name: "itemGroupLabel" },
      { kind: "component", name: "item" },
    ],
  },
  itemGroupLabel: {
    means: "подпись группы пунктов",
    accepts: [{ kind: "content", genus: "text" }],
  },
  item: {
    means: "один выбираемый пункт",
    states: {
      checked: { means: "пункт выбран" },
      unchecked: { means: "пункт не выбран" },
      highlighted: { means: "пункт подсвечен — клавиатура или указатель перешли на него, но ещё не выбрали" },
      disabled: { means: "пункт нельзя выбрать" },
    },
    accepts: [
      { kind: "component", name: "itemText" },
      { kind: "component", name: "itemIndicator" },
    ],
  },
  itemText: {
    means: "видимая подпись пункта",
    states: {
      checked: { means: "пункт выбран" },
      unchecked: { means: "пункт не выбран" },
      highlighted: { means: "пункт подсвечен — клавиатура или указатель перешли на него, но ещё не выбрали" },
      disabled: { means: "пункт нельзя выбрать" },
    },
    accepts: [{ kind: "content", genus: "text" }],
  },
  itemIndicator: {
    means: "указатель выбранного пункта — галочку кладёт потребитель",
    states: {
      checked: { means: "пункт выбран" },
      unchecked: { means: "пункт не выбран" },
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
} as const;

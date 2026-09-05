export const parts = {
  root: {
    means: "весь набор разделов — один узел, оборачивающий каждый раздел",
    accepts: [{ kind: "component", name: "item" }],
  },
  item: {
    means: "один раздел — кнопка вместе со своим содержимым",
    states: {
      open: { means: "раздел раскрыт — его содержимое видно" },
      disabled: { means: "раздел отключён — его нельзя раскрыть" },
      focus: { means: "фокус стоит на кнопке этого раздела" },
    },
    accepts: [
      { kind: "component", name: "control" },
      { kind: "component", name: "content" },
    ],
  },
  control: {
    means: "кнопка раздела — раскрывает и закрывает его",
    states: {
      open: { means: "раздел раскрыт — его содержимое видно" },
      focus: { means: "фокус стоит на кнопке этого раздела" },
      disabled: {
        means: "кнопка отключена — клик по ней не раскрывает раздел",
      },
      hover: { means: "указатель наведён на кнопку" },
      "focus-visible": {
        means:
          "фокус пришёл с клавиатуры — нужна обводка; при клике мышью это было бы шумом",
      },
      active: { means: "кнопка нажата и удерживается" },
    },
    accepts: [
      { kind: "component", name: "controlIndicator" },
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
    ],
  },
  controlIndicator: {
    means: "индикатор раскрытия — стрелку кладёт потребитель",
    states: {
      open: { means: "раздел раскрыт — его содержимое видно" },
      disabled: { means: "раздел отключён — его нельзя раскрыть" },
      focus: { means: "фокус стоит на кнопке этого раздела" },
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
      { kind: "component" },
    ],
  },
  content: {
    means: "содержимое раздела — область, которая раскрывается",
    states: {
      open: { means: "раздел раскрыт — его содержимое видно" },
      closed: {
        means:
          "раздел закрыт — содержимое скрыто, но узел остаётся в разметке",
      },
      disabled: { means: "раздел отключён — его нельзя раскрыть" },
      focus: { means: "фокус стоит на кнопке этого раздела" },
    },
    variables: {
      "--height": { means: "измеренная высота раскрытого содержимого" },
      "--width": {
        means:
          "измеренная ширина раскрытого содержимого — нужна горизонтальной гармошке",
      },
    },
    accepts: [
      { kind: "content", genus: "text" },
      { kind: "content", genus: "icon" },
      { kind: "component" },
    ],
  },
} as const;

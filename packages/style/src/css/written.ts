export const RESET_PROOF = { property: "box-sizing", value: "border-box" } as const;

export const WRITTEN_BASE = String.raw`/* СБРОС, и больше в этом файле нет ничего. Снимаем решения браузера, своих не вносим:
   ни одного кастом-свойства, ни одного значения, ни одного запасного варианта. */
*,
::before,
::after {
  ${RESET_PROOF.property}: ${RESET_PROOF.value};
}

body {
  margin: 0;
}

/* Нативный вид кнопки перебивает то, что рисует скин, — appearance: auto стоит поверх
   background: transparent и красит свой сплошной фон (PWEB-122, живой Chromium). Только
   кнопки: input/select/textarea того же дефекта не показали — родного вида, который скин
   красит напрямую, у них в ките сегодня нет ни одного, проверять нечего. */
button,
[type="button"],
[type="reset"],
[type="submit"] {
  appearance: none;
}
`;

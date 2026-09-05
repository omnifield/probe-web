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

/* appearance: none на кнопках — снимает нативный вид, которым браузер иначе рисует поверх
   фона, поставленного скином. */
button,
[type="button"],
[type="reset"],
[type="submit"] {
  appearance: none;
}
`;

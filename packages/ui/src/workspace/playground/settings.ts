// EDITOR-ONLY per-setting text for the workspace — read by `./index.ts`'s `defineEditorInfo` call
// (`PWEB-161`). Same physical shape as every other component's `playground/settings.ts`.

export const settings = {
  outlined: {
    means:
      "тонкий шов между занятыми слотами плюс свой фон у каждого — включай, когда блоки одного цвета " +
      "и без него сливаются друг с другом; выключай, когда блок сам задаёт фон или содержимое и " +
      "разделение лишнее",
  },
};

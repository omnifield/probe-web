// EDITOR-ONLY per-setting text for the workspace — read by `./index.ts`'s `defineEditorInfo` call
// (`PWEB-161`). Same physical shape as every other component's `playground/settings.ts`.

import type { PassportSettingEditorInfo } from "@omnifield/probe-web-skin/editor";

export const settings: Readonly<Record<string, PassportSettingEditorInfo>> = {
  outlined: {
    means:
      "рамка вокруг каждого занятого слота — включай, когда блоки одного цвета и без неё сливаются друг с другом; " +
      "выключай, когда блок сам задаёт фон или содержимое и обводка лишняя",
  },
};

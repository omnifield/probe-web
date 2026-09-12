import { createComponentInfo } from "@web-core/ui/component-info";
import type { PresetKind, PresetsClient } from "@web-core/skin/presets";

import { queryClient } from "#/shared/api/query-client";

import { presets } from "./client";

// `createComponentInfo` (packages/ui) зовёт `presets.list("form")`/`list("outfit")` на каждую смену
// компонента без своего кэша — заход на уже виденный компонент бил по сети заново. Оборачиваем
// `list` в `queryClient.fetchQuery`, ключ `[kind]` — тот же, что уже готов инвалидировать
// `invalidateFor` под `save_preset` (`entities/chat/model/store.ts`), просто раньше инвалидировать
// было нечего.
const cachedPresets: PresetsClient = {
  ...presets,
  list: <K extends PresetKind>(kind: K) =>
    queryClient.fetchQuery({
      queryKey: [kind],
      queryFn: () => presets.list(kind),
      staleTime: Infinity,
    }),
};

export const componentInfo = createComponentInfo({ presets: cachedPresets });

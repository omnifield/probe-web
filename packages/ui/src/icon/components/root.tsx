import { createResource, Show, splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { traceLife } from "../../shared/utils/trace.js";
import { anatomyParts } from "../entity/anatomy.js";
import { catalog, type IconName } from "../entity/catalog.js";
import type { IconLoader, ResolvedIcon } from "../entity/model.js";

export interface IconProps {
  /** Имя из СЛОВАРЯ КИТА (`entity/catalog.ts`), а не любое имя `lucide`. Нет нужного — заведи. */
  readonly name: IconName;
}

// Резолв идёт по словарю с ЛИТЕРАЛЬНЫМИ пакетными специферами — ни `import.meta.glob`, ни
// шаблонной строки в `import()`. Обе прежние реализации ломались за пределами того прогона,
// который их проверял: шаблонная строка проходила `vitest` и падала в живом браузере, глоб
// проходил дев-сервер и уезжал в `dist` нераскрытым, давая пустую карту у потребителя. Разбор
// обоих — `../FAQ.md`, разбор выбора словаря — в шапке `entity/catalog.ts`.
// Проверка на месте, хотя тип `name` — union: до компонента имя доезжает и ДАННЫМИ (`entity/io.ts`
// держит `z.string()`, сборку скина пишет редактор), а там типа нет — есть строка.
const loaders: Readonly<Record<string, IconLoader | undefined>> = catalog;

async function resolveIcon(name: string): Promise<ResolvedIcon> {
  const load = loaders[name];
  if (!load) throw new Error(`unknown icon "${name}"`);

  const mod = await load();
  return mod.default;
}

export function Icon(props: IconProps) {
  traceLife("ui.icon");

  const [local] = splitProps(dropAddress(props), ["name"]);
  const [resolved] = createResource(() => local.name, resolveIcon);

  return (
    <Show when={resolved()}>
      {(Loaded) => <Dynamic component={Loaded()} {...anatomyParts.root.attrs} />}
    </Show>
  );
}

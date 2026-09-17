import { createResource, Show, splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";

import { dropAddress } from "../../shared/utils/slot-chain.js";
import { useKitLife } from "../../shared/utils/skin-life.js";
import { passport } from "../entity/passport.js";
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

// Кэш РАЗРЕШЁННЫХ иконок поперёк всех `<Icon>` на странице — не только браузерного кэша модуля.
// Без него каждое ПЕРЕМОНТИРОВАНИЕ уже показанной иконки (аккордеон открылся заново, тоггл
// переключился — `Show` в ark-ui размонтирует старую ветку и монтирует новую) заводит свежий
// `createResource`, который стартует `pending`, даже когда `import()` мгновенно берёт всё из
// своего кэша. Ресурс без СВОЕЙ границы `<Suspense>` всплывает до ближайшей чужой — а у TanStack
// Router она на весь matched route (`Match.js`), поэтому мигает вся страница ради одной иконки,
// которая уже была на экране секунду назад.
const loaded = new Map<string, ResolvedIcon>();

async function resolveIcon(name: string): Promise<ResolvedIcon> {
  const cached = loaded.get(name);
  if (cached) return cached;

  const load = loaders[name];
  if (!load) throw new Error(`unknown icon "${name}"`);

  const mod = await load();
  loaded.set(name, mod.default);
  return mod.default;
}

export function Icon(props: IconProps) {
  useKitLife(passport, props);

  const [local] = splitProps(dropAddress(props), ["name"]);
  // `initialValue` из уже тёплого кэша держит ресурс "resolved" с первого кадра — Solid не считает
  // его pending при перемонтировании и не подвешивает чужой `<Suspense>` ради данных, которые уже
  // есть. Для холодной иконки (первый показ где-либо на странице) `initialValue` пуст, и разовый
  // pending — ожидаемый, единственный поход за сетевым чанком.
  const [resolved] = createResource(() => local.name, resolveIcon, {
    initialValue: loaded.get(local.name),
  });

  return (
    <Show when={resolved()}>
      {(Loaded) => <Dynamic component={Loaded()} {...anatomyParts.root.attrs} />}
    </Show>
  );
}

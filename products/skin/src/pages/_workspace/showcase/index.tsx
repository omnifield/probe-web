// Витрина компонента — настоящий Accordion кита, отрисованный настоящим движком (`RenderTree` +
// сборка `base`), тем же флоу, что уже работает у `ComponentList` (PWEB-174/178). Ячейка —
// раздел на имя варианта, в контенте — превью показываемого компонента через слот
// (`widgets/component-preview/`): какой конкретно компонент показывать решает эта страница в
// рантайме (параметр маршрута), сборка кита об этом не знает и знать не обязана.
//
// Имена вариантов (PWEB-187 продолжение, 2026-08-29 — «убирай хардкод кнопки с витрины») —
// БОЛЬШЕ НЕ ЛИТЕРАЛ: `variantsOf` (`entities/outfit/model`) читает их из формы НАДЕТОГО наряда
// для ЛЮБОГО компонента, не только кнопки. Нет наряда, либо у наряда нет формы этого компонента,
// либо форма без единой вариации — законный пустой перечень, тогда показывается один раздел
// «по умолчанию» (то, что видно и без надетого скина вовсе).
import { RenderTree } from "@omnifield/probe-web-assembly";
import { createEffect, createMemo, createResource, Show } from "solid-js";

import { instanceOf } from "#/entities/component/model/instance.js";
import { REGISTRY } from "#/entities/component/model/registry.js";
import { variantsOf, wornSkin } from "#/entities/outfit/model/index.js";
import { previewStore } from "#/entities/preview/model/store.js";
import { ComponentPreview } from "#/widgets/component-preview/component-preview.jsx";

export function ComponentShowcasePage(props: { component: string }) {
  // Панель данных (`WorkspaceRightbar`) живёт ВНЕ `Outlet` — до параметра маршрута ей не
  // дотянуться иначе, чем через общий стор (`entities/preview`).
  createEffect(() => previewStore.trigger.shown({ component: props.component }));

  // Источник несёт И компонент, И имя надетого наряда: `variantsOf` читает надетое изнутри, а
  // `createResource` не подписывается на сигналы, прочитанные ВНУТРИ функции-получателя — не
  // назови мы наряд явным источником, смена скина посреди показа не перечитала бы вариации.
  const [found] = createResource(
    () => [props.component, wornSkin()?.name] as const,
    ([component]) => variantsOf(component),
  );
  // Пусто — законное состояние (наряда нет, или у него нет формы/вариаций для компонента), не
  // повод показать пусто: один раздел «по умолчанию» — тот же вид, что и без надетого скина.
  const variants = () => {
    const value = found();
    return value === undefined || value.length === 0 ? ["по умолчанию"] : value;
  };

  const data = () => ({
    sections: variants().map((variant) => ({ id: variant, title: variant })),
  });

  const tree = createMemo(() =>
    instanceOf(
      "accordion",
      // Тот же скин, что и у аккордеона списка компонентов (`ComponentList`, `pages/_workspace/
      // index.tsx`, `variant="контурная"`) — постановка user, 2026-08-29: витрина не должна
      // выглядеть другим компонентом. Открытость — тем же приёмом, что и там: все разделы на
      // старте, каждый переключается независимо.
      {
        "data-variant": "контурная",
        multiple: true,
        collapsible: true,
        defaultValue: data().sections.map((section) => section.id),
      },
      "base",
      data(),
    ),
  );

  return (
    // `defaultValue` неконтролируем (Ark): применяется ОДИН раз при монтаже узла. Рисовать
    // дерево, пока подбор вариантов ещё в пути, значило бы смонтировать аккордеон на временный
    // список и не раскрыть по-настоящему пришедшие позже разделы — ждём резолва целиком.
    <Show when={!found.loading}>
      <RenderTree
        tree={tree()}
        registry={REGISTRY}
        data={data()}
        slots={{
          "accordion.itemContent": {
            render: (resolved) => (
              <ComponentPreview
                component={props.component}
                variant={resolved.variant as string}
              />
            ),
            placement: "replace",
          },
        }}
      />
    </Show>
  );
}

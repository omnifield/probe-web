// ВТОРОЙ ПОСТАВЩИК КОМПОНЕНТОВ — `@probe-web/diagrams`, рядом с `@omnifield/probe-web-ui`.
//
// Реестр витрины ДО этого файла читал ровно один источник — `KIT`/`passportOf`/`editorInfoOf`
// импортировались прямо из кита в каждом месте, которому они нужны (`registry.ts` и ещё
// несколько файлов `entities`/`pages`). Хук на «второй поставщик» был назван заранее (крючок
// «нейтральный дом форме паспорта», страница «Роадмап», сработал 2026-08-25: форма паспорта
// живёт в `packages/skin`, а не в ките, — именно для того, чтобы продуктовый пакет со своей
// анатомией мог объявляться той же формой) — `diagrams` и есть тот случай.
//
// ОДНО МЕСТО СЛИЯНИЯ, а не правка в каждом читателе по отдельности: раньше `passportOf`
// импортировался напрямую из кита в доброй дюжине файлов, и учить их всех «сходить ещё и в
// diagrams» по одному значило бы повторить один и тот же обход столько же раз, со столькими же
// шансами забыть файл. Здесь — ровно та точка, которую весь остальной код зовёт, не зная, что
// источников стало два.
//
// ПОРЯДОК ПОИСКА: кит, затем diagrams. Совпадения имени быть не должно (сверено ниже, на
// исполнении, не на авось) — оба поставщика называют разные вещи, но столкновение — молчаливая
// потеря половины компонентов, поэтому падаем явно, а не берём первого попавшегося.

import { KIT as UI_KIT, type KitComponent } from "@omnifield/probe-web-ui";
import {
  editorInfoOf as uiEditorInfoOf,
  passportOf as uiPassportOf,
  type ComponentPassport,
  type PassportEditorInfo,
} from "@omnifield/probe-web-ui/passport";
import { KIT as DIAGRAMS_KIT } from "@probe-web/diagrams";
import { editorInfoOf as diagramsEditorInfoOf, passportOf as diagramsPassportOf } from "@probe-web/diagrams/passport";

const overlap = Object.keys(UI_KIT).filter((name) => Object.hasOwn(DIAGRAMS_KIT, name));

if (overlap.length > 0) {
  throw new Error(
    `реестр витрины: имя компонента совпало у двух поставщиков — ${overlap.join(", ")}. ` +
      "решить надо явным переименованием у одного из них, не молчаливым приоритетом.",
  );
}

/** Компоненты обоих поставщиков вместе — киту и `diagrams` предстоит расти дальше независимо. */
export const KIT: Readonly<Record<string, KitComponent>> = { ...UI_KIT, ...DIAGRAMS_KIT };

/** Паспорт по имени компонента — ищет у кита, затем у `diagrams`. */
export function passportOf(component: string): ComponentPassport | undefined {
  return uiPassportOf(component) ?? diagramsPassportOf(component);
}

/** Срез редактора по имени компонента — тем же порядком поиска, что `passportOf`. */
export function editorInfoOf(component: string): PassportEditorInfo | undefined {
  return uiEditorInfoOf(component) ?? diagramsEditorInfoOf(component);
}

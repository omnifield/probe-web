// ФОРМА КОМПОНЕНТА — части, состояния и адрес, снятые с паспорта (`PWEB-31`).
//
// Тонкий слой чтения, а не своя модель: всё здесь — прямой снимок того, что уже объявил паспорт,
// без домысливания. Отдельным файлом, потому что читает его не только показ случаев (`cases.ts`),
// но и правка (`pages/editor/ui/fine.tsx`, `pages/editor/ui/screen.tsx`) — общее место чтения не
// должно прятаться внутри файла, названного по другому предмету. Отсюда же и слой: обеими
// страницами читается — значит `entities`, а не в куче одной из них.

import type { PassportAssembly, PassportMark, PassportState } from "@omnifield/probe-web-ui/passport";

import { editorInfoOf, passportOf } from "./providers.js";

/** Адрес узла части в дереве образца: корневая часть и компонент целиком — одно место. */
export function addressOfPart(component: string, part: string): string {
  return passportOf(component)?.root === part ? component : `${component}.${part}`;
}

/** Состояния части — из паспорта. Часть без добавки состояний не объявляла: перечень пуст. */
export function statesOfPart(component: string, part: string): readonly PassportState[] {
  return passportOf(component)?.parts.find((item) => item.name === part)?.states ?? [];
}

/**
 * СОСТОЯНИЯ КОМПОНЕНТА — по всем частям, склеенные по имени.
 *
 * Смотрящему принадлежит компонент, а не его части: «раскрыт» у гармошки объявлен на пункте, на
 * указателе и на кнопке раздела, но состояние это ОДНО. Показывать его трижды значило бы обещать
 * три разных вида там, где вид один.
 *
 * @param component адрес компонента в реестре
 */
export function statesOfComponent(component: string): readonly PassportState[] {
  const collected = new Map<string, PassportState>();

  for (const part of partsOf(component)) {
    for (const state of statesOfPart(component, part)) {
      if (!collected.has(state.name)) collected.set(state.name, state);
    }
  }

  return [...collected.values()];
}

/** Части компонента — из анатомии: она источник, добавка паспорта лишь приписка к ней. */
export function partsOf(component: string): readonly string[] {
  return passportOf(component)?.anatomy.keys() ?? [];
}

/**
 * Совпадают ли метки ПО РАЗМЕТКЕ, а не по тому, что у состояний одно имя: тот же вид атрибута,
 * то же имя, то же значение (для атрибута со значением).
 */
function sameMark(a: PassportMark, b: PassportMark): boolean {
  if (a.kind !== b.kind || a.name !== b.name) return false;
  return a.kind === "attribute" && b.kind === "attribute" ? a.value === b.value : true;
}

/**
 * ВСЕ части, на которых состояние с данной меткой действительно стоит.
 *
 * Кит нередко зеркалит ОДНО состояние сразу на несколько узлов одним и тем же признаком — чекбокс
 * кладёт `data-state="checked"` на `root`/`control`/`indicator`/`label` разом, гармошка так же
 * зеркалит «раскрыт» на пункт/кнопку/указатель (общий объект `PassportState` тому доказательство:
 * `packages/ui/src/checkbox/entity/passport.ts`, `.../accordion/entity/passport.ts`). Витрина,
 * ставя признак только на ОДНУ часть, вид, привязанный к другой, попросту не покажет — не потому,
 * что рецепт неверен, а потому что показ соврал о разметке.
 *
 * Сверяем МЕТКУ, а не имя состояния: у одного имени бывают и разные метки на разных частях
 * (гармошка: `disabled` — атрибут на `item`, но псевдокласс `:disabled` на `itemTrigger`), и
 * зеркалить в таком случае нечего — это два разных признака под одним человеческим словом.
 *
 * @param component адрес компонента в реестре
 * @param mark метка, с которой сверяем
 */
export function partsWithMark(component: string, mark: PassportMark): readonly string[] {
  return partsOf(component).filter((part) =>
    statesOfPart(component, part).some((state) => sameMark(state.mark, mark)),
  );
}

/** Корневая часть компонента — с неё начинается дерево, на неё смотрят по умолчанию. */
export function rootPartOf(component: string): string {
  return passportOf(component)?.root ?? "";
}

/**
 * Сборки компонента — из среза редактора. Пустой перечень — законный ответ: показ падает не с
 * пустым списком, а с образцом из анатомии (`instanceOf`, `instance.ts`).
 */
export function assembliesOf(component: string): readonly PassportAssembly[] {
  return editorInfoOf(component)?.assemblies ?? [];
}

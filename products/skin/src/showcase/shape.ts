// ФОРМА КОМПОНЕНТА — части, состояния и адрес, снятые с паспорта (`PWEB-31`).
//
// Тонкий слой чтения, а не своя модель: всё здесь — прямой снимок того, что уже объявил паспорт,
// без домысливания. Отдельным файлом, потому что читает его не только показ случаев (`cases.ts`),
// но и правка (`../editor/fine.tsx`, `../editor/screen.tsx`) — общее место чтения не должно
// прятаться внутри файла, названного по другому предмету.

import { passportOf, type PassportState } from "@omnifield/probe-web-ui/passport";

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

/** Корневая часть компонента — с неё начинается дерево, на неё смотрят по умолчанию. */
export function rootPartOf(component: string): string {
  return passportOf(component)?.root ?? "";
}

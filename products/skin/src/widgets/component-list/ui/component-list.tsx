// СПИСОК КОМПОНЕНТОВ — первый виджет (FSD), `PWEB-163`. Перечень разделов кита, каждый раздел —
// ячейка аккордеона; было плоским списком без сворачивания (`pages/showcase/ui/rail.tsx`,
// `PWEB-162` переезд из `app/rail.tsx`) — аккордеон уже есть в ките (`packages/ui/src/accordion`),
// городить своё сворачивание рядом смысла нет.
//
// ВСЕ РАЗДЕЛЫ ОТКРЫТЫ ПО УМОЛЧАНИЮ (`multiple` + `defaultValue` — все `group`) — то же поведение,
// что было у плоского списка (всё видно сразу), плюс теперь лишнее можно свернуть руками.
//
// СОБРАНЫ ИЗ НАСТОЯЩЕГО КИТА, ОДЕТОГО ТЕМ ЖЕ НАРЯДОМ, ЧТО И ПОКАЗ (решение user 2026-08-27, тот
// же приём, что был у `Rail`): подложка — `Surface` (вариация `raised`), пункт раздела —
// настоящая `Button`. Своих классов и своих цветов здесь нет — не осталось ни одного узла, за
// который не отвечал бы паспорт.
//
// ТЕКУЩИЙ ПУНКТ — ЧЕРЕЗ `data-pressed`, А НЕ СВОЙ КЛАСС (тот же приём, что был у `Rail`): у
// кнопки уже есть состояние `pressed` с готовым видом в наряде, вместо изобретения второго
// признака рядом мы просто ставим тот, что уже есть.

import {
  Accordion,
  AccordionItem,
  AccordionItemContent,
  AccordionItemIndicator,
  AccordionItemTrigger,
  Button,
  Flow,
  Surface,
} from "@omnifield/probe-web-ui";
import { For } from "solid-js";

/** Раздел перечня: устойчивый ключ (`group`, закрытый словарь), подпись и адреса компонентов. */
export interface ComponentGroup {
  readonly group: string;
  readonly title: string;
  readonly components: readonly string[];
}

export function ComponentList(props: {
  sections: readonly ComponentGroup[];
  current: string;
  onSelect: (component: string) => void;
}) {
  return (
    <Surface as="aside" data-variant="raised">
      <header>
        <b>Витрина</b>
        <p>перечень — из реестра паспортов</p>
      </header>

      <nav>
        <Accordion multiple defaultValue={props.sections.map((section) => section.group)}>
          <For each={props.sections}>
            {(section) => (
              <AccordionItem value={section.group}>
                <h3>
                  <AccordionItemTrigger>
                    {section.title}
                    <AccordionItemIndicator>▾</AccordionItemIndicator>
                  </AccordionItemTrigger>
                </h3>

                <AccordionItemContent>
                  <Flow data-variant="column">
                    <For each={section.components}>
                      {(component) => (
                        <Button
                          data-variant="tertiary"
                          data-pressed={component === props.current ? "" : undefined}
                          aria-current={component === props.current ? "true" : undefined}
                          onClick={() => props.onSelect(component)}
                        >
                          {component}
                        </Button>
                      )}
                    </For>
                  </Flow>
                </AccordionItemContent>
              </AccordionItem>
            )}
          </For>
        </Accordion>
      </nav>
    </Surface>
  );
}

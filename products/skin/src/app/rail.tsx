// РЕЛЬСЫ — перечень компонентов слева, отдельным модулем от каркаса (`app.tsx`).
//
// СОБРАНЫ ИЗ НАСТОЯЩЕГО КИТА, ОДЕТОГО ТЕМ ЖЕ НАРЯДОМ, ЧТО И ПОКАЗ (решение user 2026-08-27):
// подложка — `Surface` (вариация `raised`, та же, что одевает любую приподнятую панель кита),
// список — `Flow` (вариация `column`: направление — вид, а не проп, потоку самому мнения о нём
// взять неоткуда), пункт — настоящая `Button`. Своих классов и своих цветов здесь нет вовсе —
// не осталось ни одного узла, за который не отвечал бы паспорт.
//
// ТЕКУЩИЙ ПУНКТ — ЧЕРЕЗ `data-pressed`, А НЕ СВОЙ КЛАСС. У кнопки уже есть состояние
// `pressed` (`data-pressed`, `entity/passport.ts`) с готовым видом в наряде (рамка + жирнее).
// Выбранный пункт списка — тот же смысл, что «нажатая кнопка», и вместо изобретения второго
// признака рядом мы просто ставим тот, что уже есть.

import { Button, Flow, Surface } from "@omnifield/probe-web-ui";
import { For } from "solid-js";

/** Раздел перечня: подпись плюс адреса компонентов внутри него. */
export interface RailSection {
  readonly title: string;
  readonly components: readonly string[];
}

export function Rail(props: {
  sections: readonly RailSection[];
  current: string;
  onSelect: (component: string) => void;
}) {
  return (
    <Surface as="aside" data-variant="raised">
      <header>
        <b>Витрина</b>
        <p>перечень — из реестра паспортов</p>
      </header>

      <Flow as="nav" data-variant="column">
        <For each={props.sections}>
          {(section) => (
            <>
              <b>{section.title}</b>
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
            </>
          )}
        </For>
      </Flow>
    </Surface>
  );
}

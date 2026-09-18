import { Field, FieldTextarea, Flow, FlowItem, Icon } from "@web-core/ui";
import { layoutGroup, layoutSelf } from "@web-core/skin";

import { Button } from "../../features/edit-value/index.js";

/** Тело свежесозданной группы — юзер ещё не выбрал явно, будет она схемой или ручным набором.
 *  Два действия рядом, не селектор: вставить raw (сваггер) — группа детектится как схема, нажать
 *  «Добавить ручку вручную» — как юзер. Само распознавание формата (свагер 2.0 или нет) —
 *  забота `entities/openapi` дальше по пайплайну, не этого экрана. */
export function EmptyGroupEditor(props: { onLoadSchema: (raw: string) => void; onAddManual: () => void }) {
  return (
    <Flow data-variant="column-center">
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Field>
          <FieldTextarea placeholder="Вставить схему бэка (сваггер)" onInput={(event) => {
            const raw = event.currentTarget.value;
            if (raw.trim() !== "") props.onLoadSchema(raw);
          }} />
        </Field>
      </FlowItem>
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Flow style={layoutGroup({ align: "center" })}>
          <Button data-variant="tertiary" onClick={props.onAddManual} aria-label="Добавить ручку вручную">
            <Icon name="plus" /> Добавить ручку вручную
          </Button>
        </Flow>
      </FlowItem>
    </Flow>
  );
}

import type { FieldRule } from "@web-core/io";
import { Flow, FlowItem, Typography } from "@web-core/ui";
import { layoutGroup, layoutSelf } from "@web-core/skin";
import { createEffect, createMemo, createSignal, For } from "solid-js";

import { applyMapping, describeVariant } from "../../entities/mapping/index.js";
import { FieldPicker } from "./field-picker.js";
import type { MappingChange } from "./types.js";

/** Мод 4 — сведение: А (сырые данные ИЛИ схема) → Б (сырые данные ИЛИ схема), на каждое поле Б
 *  юзер выбирает путь А. Живой, как мод 1 (`onChange` на каждый пик, не по кнопке, в отличие от
 *  мода 2) — у каждого поля Б ровно один источник, `steps`/`onFail` не настраиваются (v1). */
export function Mapping(props: { a: unknown; b: unknown; onChange: (change: MappingChange) => void }) {
  const fieldsA = createMemo(() => describeVariant(props.a));
  const fieldsB = createMemo(() => describeVariant(props.b));
  const [picks, setPicks] = createSignal<Record<string, string>>({});

  const rules = createMemo<readonly FieldRule[]>(() =>
    Object.entries(picks()).map(([target, from]) => ({ target, from })),
  );

  createEffect(() => {
    props.onChange({ rules: rules(), result: applyMapping(props.a, rules()) });
  });

  function setPick(target: string, from: string | undefined) {
    setPicks((prev) => {
      const next = { ...prev };
      if (from === undefined) delete next[target];
      else next[target] = from;
      return next;
    });
  }

  return (
    <Flow data-variant="column-center">
      <For each={fieldsB()}>
        {(field) => (
          <FlowItem style={layoutSelf({ align: "stretch" })}>
            <Flow
              style={{
                ...layoutGroup({ justify: "space-between", align: "center" }),
                ...layoutSelf({ align: "stretch" }),
              }}
            >
              <Typography>
                {field.path} ({field.type})
              </Typography>
              <FieldPicker
                fields={fieldsA()}
                value={picks()[field.path]}
                onChange={(from) => setPick(field.path, from)}
              />
            </Flow>
          </FlowItem>
        )}
      </For>
    </Flow>
  );
}

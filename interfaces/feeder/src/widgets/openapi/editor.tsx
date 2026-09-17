import { Field, FieldInput, FieldSelect, Flow, FlowItem, Icon, Surface, Typography } from "@web-core/ui";
import { layoutGroup, layoutSelf } from "@web-core/skin";
import { createSignal, For, Show } from "solid-js";

import type { OpenapiEndpoint } from "../../entities/openapi/index.js";
import { Button } from "../../features/edit-value/index.js";
import type { InvokeResult } from "../../features/invoke-endpoint/index.js";
import { ManualGroupEditor } from "./manual-group.js";
import { SchemaGroupView } from "./schema-group.js";
import type { ManualGroup, OpenapiGroup, OpenapiInvocation, SchemaGroup } from "./types.js";

type NewGroupKind = OpenapiGroup["kind"];

function blankGroup(kind: NewGroupKind, name: string): OpenapiGroup {
  const id = crypto.randomUUID();
  return kind === "schema" ? { id, name, kind, raw: "" } : { id, name, kind, endpoints: [] };
}

/** Полный вид мода 2 — экран редактора: не один плоский список ручек, а список ГРУПП, каждая
 *  подписана юзером и остаётся своим источником (см. FAQ.md, «Группы»). Группа-схема (`raw`) —
 *  read-only распознавание, группа-юзер — редактируемые дескрипторы через `Tree`. `onChange`
 *  стреляет на вызов ручки в ЛЮБОЙ группе (как и раньше — не на правку поля), несёт
 *  `{ endpoint, value, response }`. */
export function OpenapiEditor(props: {
  groups: readonly OpenapiGroup[];
  onGroupsChange: (groups: readonly OpenapiGroup[]) => void;
  onChange: (invocation: OpenapiInvocation) => void;
}) {
  const [newName, setNewName] = createSignal("");
  const [newKind, setNewKind] = createSignal<NewGroupKind>("schema");

  function addGroup() {
    if (newName().trim() === "") return;
    props.onGroupsChange([...props.groups, blankGroup(newKind(), newName().trim())]);
    setNewName("");
  }

  function removeGroup(id: string) {
    props.onGroupsChange(props.groups.filter((group) => group.id !== id));
  }

  function updateEndpoints(group: ManualGroup, endpoints: ManualGroup["endpoints"]) {
    props.onGroupsChange(props.groups.map((candidate) => (candidate.id === group.id ? { ...group, endpoints } : candidate)));
  }

  function invoke(endpoint: OpenapiEndpoint, value: unknown, response: InvokeResult) {
    props.onChange({ endpoint, value, response });
  }

  return (
    <Flow data-variant="column-center">
      <For each={props.groups}>
        {(group) => (
          <FlowItem style={layoutSelf({ align: "stretch" })}>
            <Surface>
              <Flow data-variant="column-center">
                <FlowItem style={layoutSelf({ align: "stretch" })}>
                  <Flow style={{ ...layoutGroup({ justify: "space-between", align: "center" }), ...layoutSelf({ align: "stretch" }) }}>
                    <Typography>
                      {group.name} ({group.kind === "schema" ? "схема" : "юзер"})
                    </Typography>
                    <Button data-variant="error-quiet" onClick={() => removeGroup(group.id)} aria-label="Убрать группу">
                      <Icon name="trash" />
                    </Button>
                  </Flow>
                </FlowItem>
                <FlowItem style={layoutSelf({ align: "stretch" })}>
                  <Show
                    when={group.kind === "schema" ? (group as SchemaGroup) : undefined}
                    fallback={<ManualGroupEditor endpoints={(group as ManualGroup).endpoints} onEndpointsChange={(endpoints) => updateEndpoints(group as ManualGroup, endpoints)} onInvoke={invoke} />}
                  >
                    {(schemaGroup) => <SchemaGroupView raw={schemaGroup().raw} onInvoke={invoke} />}
                  </Show>
                </FlowItem>
              </Flow>
            </Surface>
          </FlowItem>
        )}
      </For>
      <FlowItem style={layoutSelf({ align: "stretch" })}>
        <Flow style={layoutGroup({ align: "center" })}>
          <Field>
            <FieldInput placeholder="Название группы" value={newName()} onInput={(event) => setNewName(event.currentTarget.value)} />
          </Field>
          <Field>
            <FieldSelect value={newKind()} onChange={(event) => setNewKind(event.currentTarget.value as NewGroupKind)}>
              <option value="schema">Схема (сваггер)</option>
              <option value="manual">Юзер (вручную)</option>
            </FieldSelect>
          </Field>
          <Button onClick={addGroup}>Добавить группу</Button>
        </Flow>
      </FlowItem>
    </Flow>
  );
}

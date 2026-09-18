import { Field, FieldInput, Flow, FlowItem, Icon, Surface, Typography } from "@web-core/ui";
import { layoutGroup, layoutSelf } from "@web-core/skin";
import { createSignal, For, Match, Switch } from "solid-js";

import { HTTP_METHODS, type OpenapiEndpoint } from "../../entities/openapi/index.js";
import { Button } from "../../features/edit-value/index.js";
import type { InvokeResult } from "../../features/invoke-endpoint/index.js";
import { EmptyGroupEditor } from "./empty-group.js";
import { ManualGroupEditor } from "./manual-group.js";
import { SchemaGroupEditor } from "./schema-group-editor.js";
import { openapiGroupKind, type OpenapiGroup, type OpenapiInvocation } from "./types.js";

function blankGroup(name: string): OpenapiGroup {
  return { id: crypto.randomUUID(), name, raw: "", endpoints: [] };
}

/** Полный вид мода 2 — экран редактора: не один плоский список ручек, а список ГРУПП, каждая
 *  подписана юзером и остаётся своим источником (см. FAQ.md, «Группы»). Группа не хранит вид
 *  отдельным флагом — `openapiGroupKind` выводит его из текущих `raw`/`endpoints` на каждый рендер,
 *  так что «убрал последнюю ручку» / «стёр raw» сами возвращают группу в нейтральное состояние, без
 *  отдельной обработки. `onChange` стреляет на вызов ручки в ЛЮБОЙ группе (не на правку поля), несёт
 *  `{ endpoint, value, response }`. */
export function OpenapiEditor(props: {
  groups: readonly OpenapiGroup[];
  onGroupsChange: (groups: readonly OpenapiGroup[]) => void;
  onChange: (invocation: OpenapiInvocation) => void;
}) {
  const [newName, setNewName] = createSignal("");

  function addGroup() {
    if (newName().trim() === "") return;
    props.onGroupsChange([...props.groups, blankGroup(newName().trim())]);
    setNewName("");
  }

  function removeGroup(id: string) {
    props.onGroupsChange(props.groups.filter((group) => group.id !== id));
  }

  function replaceGroup(id: string, next: OpenapiGroup) {
    props.onGroupsChange(props.groups.map((candidate) => (candidate.id === id ? next : candidate)));
  }

  function updateRaw(group: OpenapiGroup, raw: string) {
    replaceGroup(group.id, { ...group, raw });
  }

  function addManual(group: OpenapiGroup) {
    replaceGroup(group.id, { ...group, endpoints: [{ method: HTTP_METHODS[0]!, url: "", params: [] }] });
  }

  function updateEndpoints(group: OpenapiGroup, endpoints: OpenapiGroup["endpoints"]) {
    replaceGroup(group.id, { ...group, endpoints });
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
                    <Typography>{group.name}</Typography>
                    <Button data-variant="error-quiet" onClick={() => removeGroup(group.id)} aria-label="Убрать группу">
                      <Icon name="trash" />
                    </Button>
                  </Flow>
                </FlowItem>
                <FlowItem style={layoutSelf({ align: "stretch" })}>
                  <Switch>
                    <Match when={openapiGroupKind(group) === "empty"}>
                      <EmptyGroupEditor onLoadSchema={(raw) => updateRaw(group, raw)} onAddManual={() => addManual(group)} />
                    </Match>
                    <Match when={openapiGroupKind(group) === "schema"}>
                      <SchemaGroupEditor raw={group.raw} onRawChange={(raw) => updateRaw(group, raw)} onInvoke={invoke} />
                    </Match>
                    <Match when={openapiGroupKind(group) === "manual"}>
                      <ManualGroupEditor endpoints={group.endpoints} onEndpointsChange={(endpoints) => updateEndpoints(group, endpoints)} onInvoke={invoke} />
                    </Match>
                  </Switch>
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
          <Button onClick={addGroup}>Добавить группу</Button>
        </Flow>
      </FlowItem>
    </Flow>
  );
}

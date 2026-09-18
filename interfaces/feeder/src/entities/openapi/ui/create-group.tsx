import { Field, FieldInput, Flow } from "@web-core/ui";
import { layoutGroup } from "@web-core/skin";
import { createSignal } from "solid-js";

import { groupsStore } from "../models/store";
import { Button } from "../../../shared/ui";

/** Форма завести новую группу — имя + айди схемы, пишет прямо в `groupsStore` (не наружу пропом,
 *  сама сущность владеет списком групп). */
export function CreateGroup() {
  const [name, setName] = createSignal("");
  const [schemaId, setSchemaId] = createSignal("");

  function submit() {
    if (name().trim() === "" || schemaId().trim() === "") return;
    groupsStore.actions.addGroup(name().trim(), schemaId().trim());
    setName("");
    setSchemaId("");
  }

  return (
    <Flow style={layoutGroup({ align: "center" })}>
      <Field>
        <FieldInput
          placeholder="Название группы"
          value={name()}
          onInput={(event) => setName(event.currentTarget.value)}
        />
      </Field>
      <Field>
        <FieldInput
          placeholder="Айди схемы"
          value={schemaId()}
          onInput={(event) => setSchemaId(event.currentTarget.value)}
        />
      </Field>
      <Button onClick={submit}>ADD</Button>
    </Flow>
  );
}

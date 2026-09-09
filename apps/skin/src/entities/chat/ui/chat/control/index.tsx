import { Button, Field, FieldInput, Flow, FlowItem } from "@web-core/ui";
import { createSignal, type JSX } from "solid-js";

import { sendMessage } from "../../../model";
import { layoutGroup, layoutSelf } from "@web-core/skin";
export function ChatControl() {
  const [text, setText] = createSignal("");

  const onSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = (event) => {
    event.preventDefault();
    if (!text().trim()) return;
    sendMessage("Вы", text());
    setText("");
  };

  return (
    <form onSubmit={onSubmit}>
      <Flow
        style={{
          ...layoutGroup({ justify: "space-between" }),
          ...layoutSelf({ align: "stretch" }),
        }}
      >
        <Field>
          <FieldInput
            value={text()}
            onInput={(event) => setText(event.currentTarget.value)}
            placeholder="Сообщение"
          />
        </Field>
        <Button type="submit">Отправить</Button>
      </Flow>
    </form>
  );
}

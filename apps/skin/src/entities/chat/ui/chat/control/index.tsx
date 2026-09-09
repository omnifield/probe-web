import { Button, Field, FieldInput, Flow } from "@web-core/ui";
import { layoutGroup, layoutSelf } from "@web-core/skin";
import { createSignal, type JSX } from "solid-js";

import { pending, sendMessage } from "../../../model";

export function ChatControl() {
  const [text, setText] = createSignal("");

  const onSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = (event) => {
    event.preventDefault();
    if (!text().trim() || pending()) return;
    void sendMessage("Вы", text());
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
            disabled={pending()}
          />
        </Field>
        <Button type="submit" disabled={pending()}>
          Отправить
        </Button>
      </Flow>
    </form>
  );
}

import { createSignal } from "solid-js";
import { Button, Field, FieldTextarea } from "@web-core/ui";
import type { TextPart } from "../../entities/conversation/model";

/** `isStreaming`/`onStop` — не про агента: кто-то (не важно кто) сейчас льёт ответ, и кнопка
 *  вместо сабмита останавливает его. Пустой `isStreaming` (человек↔человек без стрима) — кнопка
 *  всегда «отправить», как у любого обычного чата. Enter отправляет, Shift+Enter — перенос строки;
 *  во время стрима Enter не шлёт (не мешает продолжать печатать следующее сообщение), но и не
 *  отменяет стрим — это только явный клик по кнопке. */
export function Composer(props: {
  readonly onSend: (parts: readonly TextPart[]) => void;
  readonly isStreaming?: boolean;
  readonly onStop?: () => void;
}) {
  const [value, setValue] = createSignal("");
  let textarea: HTMLTextAreaElement | undefined;

  function grow() {
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  function send() {
    const text = value().trim();
    if (!text) return;
    props.onSend([{ type: "text", text }]);
    setValue("");
    grow();
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== "Enter" || event.shiftKey || props.isStreaming) return;
    event.preventDefault();
    send();
  }

  return (
    <Field>
      <FieldTextarea
        ref={textarea}
        value={value()}
        rows={1}
        onInput={(event) => {
          setValue(event.currentTarget.value);
          grow();
        }}
        onKeyDown={onKeyDown}
      />
      <Button type="button" onClick={() => (props.isStreaming ? props.onStop?.() : send())}>
        {props.isStreaming ? "стоп" : "отправить"}
      </Button>
    </Field>
  );
}

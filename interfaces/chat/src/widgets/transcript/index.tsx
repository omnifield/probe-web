import { createEffect, createSignal, For, onCleanup, onMount, Show } from "solid-js";
import { ScrollArea, ScrollAreaContent, ScrollAreaViewport } from "@web-core/ui";

import type { Message, Part } from "../../entities/conversation/model";
import { PartView } from "../message";

/** Stick-to-bottom: пока читатель внизу — список едет за новым сообщением; ушёл читать историю
 *  вверх — автоскролл не дёргает, вместо этого кнопка «новые сообщения». `IntersectionObserver`
 *  на sentinel-элементе в конце контента, `root` — сам viewport (не окно браузера, у нас свой
 *  `overflow: auto`) — рыночный паттерн, не наивное сравнение `scrollTop`/`scrollHeight` (ROADMAP,
 *  `chat-market-research`). */
export function Transcript(props: { readonly messages: readonly Message<Part>[] }) {
  let viewport: HTMLDivElement | undefined;
  let sentinel: HTMLDivElement | undefined;
  const [stickToBottom, setStickToBottom] = createSignal(true);

  onMount(() => {
    if (!viewport || !sentinel) return;
    const observer = new IntersectionObserver((entries) => setStickToBottom(entries[0].isIntersecting), {
      root: viewport,
    });
    observer.observe(sentinel);
    onCleanup(() => observer.disconnect());
  });

  function jumpToBottom() {
    sentinel?.scrollIntoView({ block: "end", behavior: "smooth" });
  }

  // Трек на любое изменение списка (новое сообщение, стрим дописал текст в существующее) —
  // прыгаем к низу ТОЛЬКО если читатель уже там был, историю читающему не мешаем.
  createEffect(() => {
    props.messages.length;
    if (stickToBottom()) sentinel?.scrollIntoView({ block: "end" });
  });

  return (
    <ScrollArea>
      <ScrollAreaViewport ref={viewport}>
        <ScrollAreaContent>
          <For each={props.messages}>
            {(message) => (
              <div data-participant={message.participantId}>
                <For each={message.parts}>{(part) => <PartView part={part} />}</For>
              </div>
            )}
          </For>
          <div ref={sentinel} style={{ height: "1px" }} />
        </ScrollAreaContent>
      </ScrollAreaViewport>
      <Show when={!stickToBottom()}>
        <button type="button" onClick={jumpToBottom}>
          новые сообщения ↓
        </button>
      </Show>
    </ScrollArea>
  );
}

// ЧАТИК — список сообщений (скролл) + форма отправки, целиком на компонентах кита. Пока мок:
// `sendMessage` дописывает в локальный список, реальный адрес назовут позже.
import {
  Avatar,
  AvatarFallback,
  Button,
  Field,
  FieldInput,
  Flow,
  FlowItem,
  ScrollAreaContent,
  ScrollAreaRootProvider,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
  Typography,
  useScrollArea,
} from "@web-core/ui";
import { cardVar } from "@web-core/skin";
import { createEffect, createSignal, For, untrack, type JSX } from "solid-js";

import { messages, sendMessage } from "../../model";

function initialsOf(author: string): string {
  return author.slice(0, 2).toUpperCase();
}

export function Chat() {
  const [text, setText] = createSignal("");

  // Машина заведена здесь (не через <ScrollArea> самим себе) — нужен доступ снаружи к
  // scrollToEdge, настоящему программному управлению прокруткой (RootProvider-приём, тот же,
  // каким Toc даёт себе доступ к своей машине).
  const scrollArea = useScrollArea();

  // Новое сообщение — вниз списка. Трекаем ТОЛЬКО messages() — scrollArea() сам реактивен
  // (пересчитывается на каждый тик скролла, context машины меняется на ходу анимации), и
  // прочитанный внутри эффекта БЕЗ untrack превращает его в свою же зависимость: скролл дёргает
  // context → эффект перезапускается → снова дёргает scrollToEdge → анимация никогда не
  // доезжает, дёргается на месте. untrack разрывает эту петлю — эффект реагирует только на
  // новые сообщения, а не на сам процесс скролла.
  createEffect(() => {
    messages();
    untrack(() =>
      scrollArea().scrollToEdge({ edge: "bottom", behavior: "smooth" }),
    );
  });

  const onSubmit: JSX.EventHandler<HTMLFormElement, SubmitEvent> = (event) => {
    event.preventDefault();
    if (!text().trim()) return;
    sendMessage("Вы", text());
    setText("");
  };

  return (
    <Flow data-variant="column-center" style={{ width: cardVar("card-md") }}>
      <FlowItem>
        <ScrollAreaRootProvider
          value={scrollArea}
          style={{ position: "relative", height: "20rem", overflow: "hidden" }}
        >
          <ScrollAreaViewport style={{ height: "100%" }}>
            <ScrollAreaContent>
              <Flow data-variant="column-center">
                <For each={messages()}>
                  {(message) => (
                    <FlowItem>
                      <Flow>
                        <Avatar>
                          <AvatarFallback>
                            {initialsOf(message.author)}
                          </AvatarFallback>
                        </Avatar>
                        <Typography>
                          <strong>{message.author}</strong> {message.text}
                        </Typography>
                      </Flow>
                    </FlowItem>
                  )}
                </For>
              </Flow>
            </ScrollAreaContent>
          </ScrollAreaViewport>
          <ScrollAreaScrollbar
            orientation="vertical"
            style={{
              position: "absolute",
              top: "0",
              right: "0",
              bottom: "0",
              width: "0.5rem",
            }}
          >
            <ScrollAreaThumb style={{ width: "100%" }} />
          </ScrollAreaScrollbar>
        </ScrollAreaRootProvider>
      </FlowItem>
      <FlowItem>
        <form onSubmit={onSubmit}>
          <Flow>
            <FlowItem>
              <Field>
                <FieldInput
                  value={text()}
                  onInput={(event) => setText(event.currentTarget.value)}
                  placeholder="Сообщение"
                />
              </Field>
            </FlowItem>
            <FlowItem>
              <Button type="submit">Отправить</Button>
            </FlowItem>
          </Flow>
        </form>
      </FlowItem>
    </Flow>
  );
}

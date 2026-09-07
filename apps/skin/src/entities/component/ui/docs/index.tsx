// ДОКИ КОМПОНЕНТА — модалка с тем, что компонент заявляет о себе сам (means сборок, род, группа):
// то же самое, что паспорт/срез редактора уже несут, просто читаемым текстом, не JSON. Кнопка,
// открывающая модалку, — `DialogTrigger` кита, отдельной обёртки под неё не заводим.
import { Dialog, DialogContent, DialogControl } from "@web-core/ui";
import { For, Show } from "solid-js";

import { componentHandle } from "../../model/handle";

export function Docs() {
  const component = componentHandle();

  return (
    <Dialog>
      <DialogControl>Docdwadawdwds</DialogControl>

      <DialogContent>
        цв
        {/* <Show
        when={component.info()}
        fallback={<DialogDescription>Компонент не выбран.</DialogDescription>}
      >
        {(info) => (
          <>
            <DialogTitle>{info().component}</DialogTitle>
            <DialogDescription>
              {info().editorInfo?.genus ?? "—"} ·{" "}
              {info().editorInfo?.group ?? "—"}
            </DialogDescription>
            <For each={info().editorInfo?.assemblies ?? []}>
              {(assembly) => (
                <p>
                  <strong>{assembly.name}</strong> — {assembly.means}
                </p>
              )}
            </For>
          </>
        )}
      </Show>
      <DialogCloseTrigger>✕</DialogCloseTrigger> */}
      </DialogContent>
    </Dialog>
  );
}

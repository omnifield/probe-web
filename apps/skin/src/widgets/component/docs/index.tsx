import { Dialog, DialogContent, DialogControl } from "@web-core/ui";
import { cardVar } from "@web-core/skin";
import { Show } from "solid-js";

export function Docs(props: { url?: string }) {
  // lazyMount/unmountOnExit — без них Ark держит DialogContent (значит и iframe) в DOM даже
  // закрытым: url меняется на КАЖДУЮ смену компонента в дереве, и айфрейм грузил чужую страницу
  // заново на каждый клик, даже когда модалку никто не открывал.
  return (
    <Dialog lazyMount unmountOnExit>
      <DialogControl style={{ width: "100%" }}>DOCS</DialogControl>
      <DialogContent style={{ width: cardVar("card-xxxl") }}>
        <Show when={props.url} fallback={<p>URL не задан.</p>}>
          {(url) => (
            <iframe
              src={url()}
              style={{ width: "100%", height: "100%", border: "none" }}
            />
          )}
        </Show>
      </DialogContent>
    </Dialog>
  );
}

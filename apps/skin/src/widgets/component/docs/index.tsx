import { Dialog, DialogContent, DialogControl } from "@web-core/ui";
import { cardVar } from "@web-core/skin";
import { Show } from "solid-js";

export function Docs(props: { url?: string }) {
  return (
    <Dialog>
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

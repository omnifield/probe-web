import { registerPart } from "../../entities/conversation/part-registry";
import type { TextPart } from "../../entities/conversation/model";
import { useBufferedText } from "./buffered-text";

function TextPartView(props: { readonly part: TextPart }) {
  const text = useBufferedText(() => props.part.text);
  return <span style={{ "white-space": "pre-wrap", "overflow-wrap": "break-word" }}>{text()}</span>;
}

export function registerTextPart(): void {
  registerPart<TextPart>("text", TextPartView);
}

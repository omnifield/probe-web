import type { CompositionElement } from "@web-core/assembly";
import { Renderer } from "#/shared/ui/renderer";
import testModule from "./test-module.json";

export function PlaygroundPage() {
  return <Renderer composition={testModule as CompositionElement} />;
}

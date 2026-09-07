import { Button } from "@web-core/ui";
import { createEffect } from "solid-js";
import { Surface } from "@web-core/ui";
import { componentHandle } from "#/entities/component";

export function Input() {
  const component = componentHandle();

  createEffect(() => {
    if (!component.ready()) return;
    component.generate();
  });

  return (
    <Surface>
      <Button onClick={component.generate} disabled={!component.ready()}>
        GENERATE FAKE DATA
      </Button>
    </Surface>
  );
}

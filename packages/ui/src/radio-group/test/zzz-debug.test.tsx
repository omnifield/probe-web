import { render } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { RadioGroup, RadioGroupItem, RadioGroupItemControl, RadioGroupItemText } from "../components/index.js";

let dispose: (() => void) | undefined;

afterEach(() => {
  dispose?.();
  dispose = undefined;
  document.body.innerHTML = "";
});

describe("debug: per-item disabled override", () => {
  it("one disabled item among enabled siblings", () => {
    const host = document.createElement("div");
    document.body.append(host);

    dispose = render(
      () => (
        <RadioGroup defaultValue="standard">
          <RadioGroupItem value="standard">
            <RadioGroupItemControl />
            <RadioGroupItemText>Standard</RadioGroupItemText>
          </RadioGroupItem>
          <RadioGroupItem value="express" disabled>
            <RadioGroupItemControl />
            <RadioGroupItemText>Express</RadioGroupItemText>
          </RadioGroupItem>
        </RadioGroup>
      ),
      host,
    );

    const items = host.querySelectorAll('[data-scope="radio-group"][data-part="item"]');
    console.log("item0 disabled?", items[0]!.getAttribute("data-disabled"));
    console.log("item1 disabled?", items[1]!.getAttribute("data-disabled"));
  });
});

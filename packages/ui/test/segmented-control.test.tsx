import { For, createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  SegmentedControl,
  SegmentedControlIndicator,
  SegmentedControlItem,
  SegmentedControlItemControl,
  SegmentedControlItemInput,
  SegmentedControlItemLabel,
  SegmentedControlLabel,
  SegmentedControlTrack,
} from "../src/segmented-control.jsx";
import { ToggleGroup, ToggleGroupItem } from "../src/toggle-group.jsx";
import { cleanup, mount, one, press } from "./dom.jsx";

afterEach(cleanup);

const MODES = ["список", "плитки"];

/** Режим показа — сборка, та же что в доке компонента. */
function Mode(props: { value?: string; onChange?: (value: string) => void }) {
  return (
    <SegmentedControl value={props.value} onChange={props.onChange}>
      <SegmentedControlLabel>Показывать</SegmentedControlLabel>
      <SegmentedControlTrack>
        <SegmentedControlIndicator />
        <For each={MODES}>
          {(mode) => (
            <SegmentedControlItem value={mode}>
              <SegmentedControlItemInput />
              <SegmentedControlItemControl>
                <SegmentedControlItemLabel>{mode}</SegmentedControlItemLabel>
              </SegmentedControlItemControl>
            </SegmentedControlItem>
          )}
        </For>
      </SegmentedControlTrack>
    </SegmentedControl>
  );
}

describe("SegmentedControl — это ВЫБОР, а не ряд кнопок", () => {
  it("корень объявлен группой выбора, внутри настоящие `radio`", () => {
    // Собрать то же самое из `Toggle` было бы враньём для вспомогательной техники: она
    // прочитала бы независимые кнопки вместо одного значения из нескольких.
    const host = mount(() => <Mode value="список" />);

    expect(one(host, "[data-slot='segmented-control']").getAttribute("role")).toBe("radiogroup");
    expect(one<HTMLInputElement>(host, "[data-slot='segmented-control-item-input']").type).toBe(
      "radio",
    );
  });

  it("подпись группы связана с корнем", () => {
    const host = mount(() => <Mode value="список" />);

    expect(one(host, "[data-slot='segmented-control']").getAttribute("aria-labelledby")).toContain(
      one(host, "[data-slot='segmented-control-label']").id,
    );
  });

  it("выбор зовёт `onChange` со значением", () => {
    const onChange = vi.fn();
    const host = mount(() => <Mode value="список" onChange={onChange} />);

    press(host.querySelectorAll("[data-slot='segmented-control-item-input']")[1]);

    expect(onChange).toHaveBeenCalledWith("плитки");
  });

  it("активность приезжает атрибутом данных на вариант", () => {
    const [value, setValue] = createSignal("список");
    const host = mount(() => <Mode value={value()} />);
    const selected = () =>
      [...host.querySelectorAll("[data-slot='segmented-control-item']")].find((node) =>
        node.hasAttribute("data-checked"),
      )?.textContent;

    expect(selected()).toBe("список");

    setValue("плитки");

    expect(selected()).toBe("плитки");
  });

  it("класса нет ни у одной части", () => {
    const host = mount(() => <Mode value="список" />);

    for (const node of host.querySelectorAll("[data-slot^='segmented-control']")) {
      expect(node.hasAttribute("class")).toBe(false);
    }
  });

  it("дорожка — НАША часть: она обнимает варианты и полоску, и в ней нет подписи", () => {
    // Ради этого она и заведена: полоску kobalte двигает от `offsetLeft` выбранного варианта,
    // то есть от ближайшего позиционированного предка. Корень на эту роль не годится — в него
    // входит подпись группы, и полоска уезжает вниз ровно на её высоту.
    const host = mount(() => <Mode value="список" />);
    const track = one(host, "[data-slot='segmented-control-track']");

    expect(track.contains(one(host, "[data-slot='segmented-control-indicator']"))).toBe(true);
    expect(track.contains(one(host, "[data-slot='segmented-control-item']"))).toBe(true);
    expect(track.contains(one(host, "[data-slot='segmented-control-label']"))).toBe(false);

    // И она пустая по виду: ни класса, ни стиля — позиционирует её оформление.
    expect(track.hasAttribute("class")).toBe(false);
    expect(track.hasAttribute("style")).toBe(false);
  });
});

describe("ToggleGroup — это НАЖАТЫЕ КНОПКИ, а не выбор", () => {
  it("корень — группа, кнопки объявляют нажатость через `aria-pressed`", () => {
    // Разница с `SegmentedControl` не косметическая: здесь нет значения, нет формы, а нажатых
    // может быть несколько. Подменить одно другим значит соврать.
    const host = mount(() => (
      <ToggleGroup multiple value={["bold"]}>
        <ToggleGroupItem value="bold">Ж</ToggleGroupItem>
        <ToggleGroupItem value="italic">К</ToggleGroupItem>
      </ToggleGroup>
    ));

    expect(one(host, "[data-slot='toggle-group']").getAttribute("role")).toBe("group");

    const [bold, italic] = host.querySelectorAll("[data-slot='toggle-group-item']");
    expect(bold.tagName).toBe("BUTTON");
    expect(bold.getAttribute("aria-pressed")).toBe("true");
    expect(italic.getAttribute("aria-pressed")).toBe("false");
    expect(host.querySelector("input")).toBeNull();
  });

  it("`multiple` позволяет нажать несколько — у выбора так нельзя", () => {
    const onChange = vi.fn();
    const host = mount(() => (
      <ToggleGroup multiple value={["bold"]} onChange={onChange}>
        <ToggleGroupItem value="bold">Ж</ToggleGroupItem>
        <ToggleGroupItem value="italic">К</ToggleGroupItem>
      </ToggleGroup>
    ));

    press(host.querySelectorAll("[data-slot='toggle-group-item']")[1]);

    expect(onChange).toHaveBeenCalledWith(["bold", "italic"]);
  });

  it("нажатость приезжает атрибутом данных, класса нет", () => {
    const host = mount(() => (
      <ToggleGroup value="bold">
        <ToggleGroupItem value="bold">Ж</ToggleGroupItem>
      </ToggleGroup>
    ));

    const item = one(host, "[data-slot='toggle-group-item']");
    expect(item.hasAttribute("data-pressed")).toBe(true);
    expect(item.hasAttribute("class")).toBe(false);
  });
});

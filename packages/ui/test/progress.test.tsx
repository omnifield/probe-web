import { createSignal } from "solid-js";
import { afterEach, describe, expect, it } from "vitest";

import {
  Progress,
  ProgressFill,
  ProgressLabel,
  ProgressTrack,
  ProgressValueLabel,
} from "../src/progress.jsx";
import { Skeleton } from "../src/skeleton.jsx";
import { cleanup, mount, one } from "./dom.jsx";

afterEach(cleanup);

/** Загрузка файлов — сборка, та же что в доке компонента. */
function Upload(props: { value?: number; indeterminate?: boolean }) {
  return (
    <Progress value={props.value} minValue={0} maxValue={30} indeterminate={props.indeterminate}>
      <ProgressLabel>Загрузка</ProgressLabel>
      <ProgressValueLabel />
      <ProgressTrack>
        <ProgressFill />
      </ProgressTrack>
    </Progress>
  );
}

describe("Progress", () => {
  it("корень объявлен полосой и знает свою долю", () => {
    const host = mount(() => <Upload value={12} />);
    const root = one(host, "[data-slot='progress']");

    expect(root.getAttribute("role")).toBe("progressbar");
    expect(root.getAttribute("aria-valuenow")).toBe("12");
    expect(root.getAttribute("aria-valuemax")).toBe("30");
  });

  it("подпись связана с полосой, значение показано текстом", () => {
    const host = mount(() => <Upload value={15} />);

    expect(one(host, "[data-slot='progress']").getAttribute("aria-labelledby")).toContain(
      one(host, "[data-slot='progress-label']").id,
    );
    // По умолчанию проценты: 15 из 30 — половина.
    expect(one(host, "[data-slot='progress-value-label']").textContent).toContain("50");
  });

  it("`indeterminate` — это НЕ ноль процентов", () => {
    // Разные утверждения: «доля неизвестна» и «начали и ничего не сделали». Вспомогательная
    // техника читает их по-разному, поэтому значения в разметке при неопределённости нет.
    const host = mount(() => <Upload indeterminate />);
    const root = one(host, "[data-slot='progress']");

    expect(root.hasAttribute("aria-valuenow")).toBe(false);
    expect(root.hasAttribute("data-indeterminate")).toBe(true);
  });

  it("долю kobalte отдаёт переменной CSS, а не инлайновой шириной", () => {
    // Так оформление вправе выразить долю чем угодно: шириной, `transform` или маской.
    const [value, setValue] = createSignal(3);
    const host = mount(() => <Upload value={value()} />);
    const fill = one(host, "[data-slot='progress-fill']");

    expect(fill.getAttribute("style")).toContain("--kb-progress-fill-width");

    setValue(30);

    expect(fill.getAttribute("style")).toContain("100%");
  });

  it("класса нет ни у одной части", () => {
    const host = mount(() => <Upload value={12} />);

    for (const node of host.querySelectorAll("[data-slot^='progress']")) {
      expect(node.hasAttribute("class")).toBe(false);
    }
  });
});

describe("Skeleton", () => {
  it("оборачивает содержимое, а не заменяет его размером из головы", () => {
    const host = mount(() => (
      <Skeleton visible={false}>
        <p>Текст статьи</p>
      </Skeleton>
    ));

    expect(host.children.length).toBe(1);
    expect(one(host, "[data-slot='skeleton']").textContent).toBe("Текст статьи");
  });

  it("состояние объявлено атрибутом данных — по нему и рисуют мерцание", () => {
    const [loading, setLoading] = createSignal(true);
    const host = mount(() => <Skeleton visible={loading()}>содержимое</Skeleton>);
    const node = one(host, "[data-slot='skeleton']");

    expect(node.hasAttribute("data-visible")).toBe(true);

    setLoading(false);

    expect(node.hasAttribute("data-visible")).toBe(false);
  });

  it("своего мерцания не привозит: ни класса, ни анимации по умолчанию", () => {
    const host = mount(() => <Skeleton visible>содержимое</Skeleton>);
    const node = one(host, "[data-slot='skeleton']");

    expect(node.hasAttribute("class")).toBe(false);
    expect(node.getAttribute("style") ?? "").not.toMatch(/animation|background|color/);
  });

  it("служебный стиль — только размер, и он приходит пропами kobalte", () => {
    // `width: 100%; height: auto` ставит kobalte из своих пропов размера. Это не оформление:
    // ни цвета, ни фона, ни скругления там нет, а сами значения потребитель меняет теми же
    // пропами. Проба держит границу — появится в этой строке что-то про вид, прогон покраснеет.
    const host = mount(() => <Skeleton visible>содержимое</Skeleton>);

    expect(one(host, "[data-slot='skeleton']").getAttribute("style")).toBe(
      "width: 100%; height: auto;",
    );
  });
});

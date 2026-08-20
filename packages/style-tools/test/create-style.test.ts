import { cva } from "class-variance-authority";
import { createRoot, createSignal } from "solid-js";
import { describe, expect, it } from "vitest";

import { createStyle } from "../src/create-style.js";

const button = cva("inline-flex p-2", {
  variants: {
    size: { sm: "text-sm", lg: "text-lg p-4" },
    tone: { plain: "bg-white", danger: "bg-red-500" },
  },
  defaultVariants: { size: "sm", tone: "plain" },
});

describe("createStyle", () => {
  it("варианты попадают в класс, дефолты применяются", () => {
    createRoot((dispose) => {
      const cls = createStyle(button, {});
      expect(cls()).toBe("inline-flex p-2 text-sm bg-white");
      dispose();
    });
  });

  it("выбранный вариант перебивает базу по конфликтующей утилите", () => {
    createRoot((dispose) => {
      const cls = createStyle(button, { size: "lg" });
      // база даёт `p-2`, вариант `lg` — `p-4`; в атрибуте обязан остаться один.
      expect(cls()).toBe("inline-flex text-lg p-4 bg-white");
      dispose();
    });
  });

  it("проп `class` идёт последним и переопределяет вариант", () => {
    createRoot((dispose) => {
      const cls = createStyle(button, { tone: "danger", class: "bg-blue-500" });
      expect(cls()).toBe("inline-flex p-2 text-sm bg-blue-500");
      dispose();
    });
  });

  it("`class` не удваивается: в вариант-функцию он не уходит", () => {
    createRoot((dispose) => {
      const cls = createStyle(button, { class: "custom-marker" });
      expect(cls().match(/custom-marker/g)).toHaveLength(1);
      dispose();
    });
  });

  it("реактивность: смена варианта пересчитывает класс", () => {
    createRoot((dispose) => {
      const [size, setSize] = createSignal<"sm" | "lg">("sm");
      const cls = createStyle(button, {
        get size() {
          return size();
        },
      });

      expect(cls()).toContain("text-sm");
      setSize("lg");
      expect(cls()).toContain("text-lg");
      expect(cls()).not.toContain("text-sm");
      dispose();
    });
  });

  it("реактивность доходит и до пропа `class`", () => {
    createRoot((dispose) => {
      const [extra, setExtra] = createSignal("opacity-50");
      const cls = createStyle(button, {
        get class() {
          return extra();
        },
      });

      expect(cls()).toContain("opacity-50");
      setExtra("opacity-100");
      expect(cls()).toContain("opacity-100");
      expect(cls()).not.toContain("opacity-50");
      dispose();
    });
  });

  it("принимает рукописную вариант-функцию, не только `cva()`", () => {
    createRoot((dispose) => {
      const cls = createStyle((props: { wide?: boolean }) => (props.wide ? "w-full" : "w-fit"), {
        wide: true,
      });
      expect(cls()).toBe("w-full");
      dispose();
    });
  });
});

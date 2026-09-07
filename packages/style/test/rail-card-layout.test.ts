import { describe, expect, it } from "vitest";

import { AXES, axisOf } from "../src/engine/axes.js";
import { DERIVED_SCALES, DERIVED_TOKENS } from "../src/engine/dimension.js";

describe("rail/card/layout — шкалы ширины композиции", () => {
  it.each(["rail", "card", "layout"] as const)("%s объявлена в DERIVED_SCALES с плотностью и сеткой", (seed) => {
    const scale = DERIVED_SCALES.find((entry) => entry.seed === seed);

    expect(scale).toBeDefined();
    expect(scale!.density).toBe(true);
    expect(scale!.snap).toBe(true);
    expect(scale!.steps.length).toBeGreaterThan(0);
  });

  it.each(["rail-sm", "rail-md", "rail-lg", "card-sm", "card-md", "card-lg", "layout-sm", "layout-md", "layout-lg"])(
    "ступень %s попадает в DERIVED_TOKENS",
    (name) => {
      expect(DERIVED_TOKENS).toContain(name);
    },
  );

  it.each(["rail", "card", "layout"] as const)("%s объявлена в AXES той же единицей, что column/space (rem)", (seed) => {
    const axis = axisOf(seed);

    expect(axis).toBeDefined();
    expect(axis!.unit).toBe("rem");
    expect(axis!.continuous).toBe(true);
  });

  it("каждый seed DERIVED_SCALES с density имеет ось в AXES — фактор плотности иначе некому проверить", () => {
    for (const scale of DERIVED_SCALES) {
      if (!scale.density) continue;
      expect(AXES.some((axis) => axis.token === scale.seed), `нет оси для «${scale.seed}»`).toBe(true);
    }
  });
});

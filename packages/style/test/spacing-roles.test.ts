import { describe, expect, it } from "vitest";

import { DERIVED_SCALES, SPACE_ROLES, type SpaceRole } from "../src/engine/dimension.js";

const SPACE_STEP_NAMES = new Set(
  DERIVED_SCALES.find((scale) => scale.seed === "space")!.steps.map((step) => step.name),
);

describe("SPACE_ROLES", () => {
  it("каждая роль называет ступень, которая реально существует у шкалы space", () => {
    for (const [role, entry] of Object.entries(SPACE_ROLES)) {
      expect(SPACE_STEP_NAMES.has(entry.step), `роль «${role}» → «${entry.step}»`).toBe(true);
    }
  });

  it("перечень ролей непуст и у каждой роли есть означение для человека", () => {
    const roles = Object.keys(SPACE_ROLES) as SpaceRole[];
    expect(roles.length).toBeGreaterThan(0);

    for (const role of roles) {
      expect(SPACE_ROLES[role].means.length, `роль «${role}» без means`).toBeGreaterThan(0);
    }
  });
});

import { describe, expect, it } from "vitest";

import { getComponentPassportTool, listComponentsTool } from "../../src/tools/components.js";

describe("listComponentsTool", () => {
  it("отдаёт непустой перечень имён кита", async () => {
    const result = await listComponentsTool.handler({});
    const content = result.content as { type: string; text: string }[];
    const payload = JSON.parse(content[0]!.text) as { components: string[] };
    expect(payload.components.length).toBeGreaterThan(0);
    expect(payload.components).toContain("button");
  });
});

describe("getComponentPassportTool", () => {
  it("отдаёт паспорт как есть — источник правды, не пересборку", async () => {
    const result = await getComponentPassportTool.handler({ component: "button" });
    expect(result.isError).toBeFalsy();
    const content = result.content as { type: string; text: string }[];
    const passport = JSON.parse(content[0]!.text) as { component: string };
    expect(passport.component).toBe("button");
  });

  it("отказывает по делу на неизвестном компоненте, а не падает", async () => {
    const result = await getComponentPassportTool.handler({ component: "no-such-component" });
    expect(result.isError).toBe(true);
  });
});

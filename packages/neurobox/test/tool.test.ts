import { describe, expect, it } from "vitest";
import { z } from "@web-core/io";
import { accessOf, toolDefinition } from "../src/tool/index.js";

describe("toolDefinition", () => {
  it("embeds access into the vendor's metadata field", () => {
    const def = toolDefinition({
      name: "list_components",
      description: "перечень компонентов скина",
      access: "read",
      inputSchema: z.object({ group: z.string().optional() }),
    });

    expect(def.metadata).toEqual({ access: "read" });
  });

  it("keeps access reachable through .server(execute)", async () => {
    const def = toolDefinition({
      name: "save_preset",
      description: "сохраняет пресет",
      access: "write",
      inputSchema: z.object({ name: z.string() }),
      outputSchema: z.object({ ok: z.boolean() }),
    });

    const serverTool = def.server(async () => ({ ok: true }));

    expect(accessOf(serverTool)).toBe("write");
    await expect(serverTool.execute!({ name: "x" }, undefined as never)).resolves.toEqual({ ok: true });
  });

  it("keeps access reachable through .client(execute)", () => {
    const def = toolDefinition({
      name: "delete_all",
      description: "необратимо",
      access: "destructive",
    });

    const clientTool = def.client();

    expect(accessOf(clientTool)).toBe("destructive");
  });
});

describe("accessOf", () => {
  it("reads back exactly what toolDefinition() wrote, for all three access levels", () => {
    for (const access of ["read", "write", "destructive"] as const) {
      const def = toolDefinition({ name: `t-${access}`, description: "x", access });
      expect(accessOf(def)).toBe(access);
    }
  });

  it("throws instead of silently passing a tool with no access through", () => {
    expect(() => accessOf({ metadata: {} })).toThrow(/access/);
    expect(() => accessOf({})).toThrow(/access/);
  });

  it("throws on an invalid access value, not just a missing one", () => {
    expect(() => accessOf({ metadata: { access: "delete-everything" } })).toThrow(/access/);
  });
});

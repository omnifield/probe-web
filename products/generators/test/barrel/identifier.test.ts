import { describe, expect, it } from "vitest";

import { identifierFromEntryName } from "../../src/barrel/identifier.js";

describe("identifierFromEntryName", () => {
  it("passes through a single-word name unchanged", () => {
    expect(identifierFromEntryName("button")).toBe("button");
  });

  it("camel-cases each hyphen boundary", () => {
    expect(identifierFromEntryName("radio-group")).toBe("radioGroup");
    expect(identifierFromEntryName("date-picker")).toBe("datePicker");
  });

  it("appends the given suffix after camel-casing", () => {
    expect(identifierFromEntryName("radio-group", "Passport")).toBe("radioGroupPassport");
  });

  it("handles more than one hyphen", () => {
    expect(identifierFromEntryName("toggle-group-item", "Kit")).toBe("toggleGroupItemKit");
  });
});

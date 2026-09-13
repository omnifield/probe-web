import { describe, expect, it } from "vitest";
import { neuroboxUrl, resolveAccessHeaders } from "../src/engine/access.js";

describe("neuroboxUrl", () => {
  it("joins segments with a leading baseUrl", () => {
    expect(neuroboxUrl("https://box.example", "api", "agent")).toBe("https://box.example/api/agent");
  });

  it("defaults an absent baseUrl to a relative path", () => {
    expect(neuroboxUrl(undefined, "api", "health")).toBe("/api/health");
  });

  it("encodes each segment, so a threadId cannot inject an extra path segment", () => {
    expect(neuroboxUrl("https://box.example", "api", "agent", "sneaky/../../other", "cancel")).toBe(
      "https://box.example/api/agent/sneaky%2F..%2F..%2Fother/cancel",
    );
  });

  it("encodes spaces and cyrillic thread ids", () => {
    expect(neuroboxUrl(undefined, "api", "agent", "сеанс работы 42", "spent")).toBe(
      "/api/agent/%D1%81%D0%B5%D0%B0%D0%BD%D1%81%20%D1%80%D0%B0%D0%B1%D0%BE%D1%82%D1%8B%2042/spent",
    );
  });
});

describe("resolveAccessHeaders", () => {
  it("resolves plain strings and (async) getters alike", async () => {
    const headers = await resolveAccessHeaders({
      token: "secret",
      userLogin: async () => "egor",
    });
    expect(headers).toEqual({ Authorization: "Bearer secret", "X-User-Login": "egor" });
  });
});

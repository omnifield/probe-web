import { describe, expect, it } from "vitest";

import { extractMarkedRegion, mergeMarkedRegions } from "../../src/preserve/regions.js";

const markers = { start: "<!-- user:start -->", end: "<!-- user:end -->" };

describe("extractMarkedRegion", () => {
  it("returns the marker pair and everything between them", () => {
    const content = "before\n<!-- user:start -->\nhand-written note\n<!-- user:end -->\nafter";

    expect(extractMarkedRegion(content, markers)).toBe("<!-- user:start -->\nhand-written note\n<!-- user:end -->");
  });

  it("returns undefined when the markers are not both present", () => {
    expect(extractMarkedRegion("no markers here at all", markers)).toBeUndefined();
    expect(extractMarkedRegion("<!-- user:start -->only the opening one", markers)).toBeUndefined();
  });
});

describe("mergeMarkedRegions", () => {
  it("keeps the fresh render's own placeholder when there is no existing file yet", () => {
    const fresh = "# Title\n\n<!-- user:start -->\n_placeholder_\n<!-- user:end -->\n";

    expect(mergeMarkedRegions(fresh, undefined, markers)).toBe(fresh);
  });

  it("keeps the fresh render's placeholder when the existing file has no matching markers", () => {
    const fresh = "# Title\n\n<!-- user:start -->\n_placeholder_\n<!-- user:end -->\n";
    const existing = "# Title (old, from before the markers existed)\n\nsome old body text";

    expect(mergeMarkedRegions(fresh, existing, markers)).toBe(fresh);
  });

  it("splices the human's actual text into the fresh render's markers", () => {
    const fresh = "# Title\n\nauto content changed\n\n<!-- user:start -->\n_placeholder_\n<!-- user:end -->\n";
    const existing = "# Title\n\nauto content OLD\n\n<!-- user:start -->\nWatch out: this state's mark can be missing.\n<!-- user:end -->\n";

    expect(mergeMarkedRegions(fresh, existing, markers)).toBe(
      "# Title\n\nauto content changed\n\n<!-- user:start -->\nWatch out: this state's mark can be missing.\n<!-- user:end -->\n",
    );
  });

  it("leaves content outside the markers alone even when it differs from the existing file", () => {
    const fresh = "everything here regenerates\n<!-- user:start -->\nnew placeholder\n<!-- user:end -->\nstill regenerates";
    const existing = "old auto text\n<!-- user:start -->\nkept note\n<!-- user:end -->\nold trailing text";

    const merged = mergeMarkedRegions(fresh, existing, markers);

    expect(merged).toBe("everything here regenerates\n<!-- user:start -->\nkept note\n<!-- user:end -->\nstill regenerates");
  });
});

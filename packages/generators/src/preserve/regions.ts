/** The start/end markers that bracket a hand-written region inside a generated file. */
export interface MarkedRegionMarkers {
  readonly start: string;
  readonly end: string;
}

function escapeForRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function regionPattern(markers: MarkedRegionMarkers): RegExp {
  return new RegExp(`${escapeForRegExp(markers.start)}[\\s\\S]*?${escapeForRegExp(markers.end)}`);
}

/**
 * Pulls out the marker pair and everything between them, or `undefined` if
 * `content` does not contain both markers (a file generated before the
 * markers existed, or one where they were renamed).
 */
export function extractMarkedRegion(content: string, markers: MarkedRegionMarkers): string | undefined {
  return content.match(regionPattern(markers))?.[0];
}

/**
 * Splices a hand-written region from a PREVIOUS version of a generated file
 * into a FRESH render of it — the mechanism behind "this block survives
 * regeneration": the template always renders its own placeholder text
 * between the markers, and this function replaces that placeholder with
 * whatever a human actually wrote there, read from the file being
 * overwritten.
 *
 * `existingContent` is `undefined` for a component that has no file yet
 * (first generation ever) — `freshContent`'s own placeholder is kept as is.
 * Same if `existingContent` exists but the markers are not found in it
 * (nothing to preserve, not an error): a renamed or newly-added marker pair
 * has nothing yet to carry over.
 *
 * Supports exactly ONE marked region per file. A second pair of markers is
 * not a documented capability of this function — callers needing several
 * independent regions should give each its own distinct marker pair and
 * call this once per pair.
 */
export function mergeMarkedRegions(freshContent: string, existingContent: string | undefined, markers: MarkedRegionMarkers): string {
  if (existingContent === undefined) return freshContent;

  const existingRegion = extractMarkedRegion(existingContent, markers);
  if (existingRegion === undefined) return freshContent;

  return freshContent.replace(regionPattern(markers), existingRegion);
}

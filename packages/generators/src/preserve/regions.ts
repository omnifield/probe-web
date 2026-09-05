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

export function extractMarkedRegion(content: string, markers: MarkedRegionMarkers): string | undefined {
  return content.match(regionPattern(markers))?.[0];
}

export function mergeMarkedRegions(freshContent: string, existingContent: string | undefined, markers: MarkedRegionMarkers): string {
  if (existingContent === undefined) return freshContent;

  const existingRegion = extractMarkedRegion(existingContent, markers);
  if (existingRegion === undefined) return freshContent;

  return freshContent.replace(regionPattern(markers), existingRegion);
}

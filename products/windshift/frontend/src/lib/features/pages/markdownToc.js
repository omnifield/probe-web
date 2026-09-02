/** Parse ATX headings into stable hash-link entries, ignoring fenced code.
 * Malformed lines are skipped, including after an unterminated fence. */
export function parseMarkdownHeadings(source) {
  if (!source) return [];
  const lines = source.split('\n');
  const out = [];
  let inFence = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Both ``` and ~~~ delimit fenced code.
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m) continue;

    const level = m[1].length;
    const text = m[2].trim();
    if (!text) continue;
    out.push({
      level,
      text,
      slug: slugify(text),
      line: i,
    });
  }
  return out;
}

/** Slugify a heading to match the editor's rendered-DOM lookup.
 * Uses Unicode letter/number classes (not [a-z0-9]) so headings in Cyrillic
 * or any other non-Latin script still produce a usable, non-empty slug
 * instead of collapsing to ''. NFKD + combining-mark stripping still runs
 * first so accented Latin ("café") normalizes to plain ASCII as before. */
export function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

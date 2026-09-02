import { t } from '../stores/i18n.svelte.js';

// GitHub-style blockquote alerts: `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`,
// `> [!WARNING]`, `> [!CAUTION]`. This is a GitHub-invented convention, not
// part of CommonMark/GFM, so Milkdown parses it as a perfectly ordinary
// blockquote whose first line is the literal text "[!IMPORTANT]". This module
// runs after render (same pattern as code-highlight.js) to find that marker,
// strip it, and turn the blockquote into a labeled, colored callout.

const ALERT_TYPES = ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION'];
const MARKER_RE = new RegExp(`^\\s*\\[!(${ALERT_TYPES.join('|')})\\]\\s*`, 'i');

const ALERT_META = {
  note: {
    labelKey: 'editors.alertNote',
    icon: '<circle cx="10" cy="10" r="7.25"/><line x1="10" y1="9" x2="10" y2="13.5"/><circle cx="10" cy="6.5" r="0.9" fill="currentColor" stroke="none"/>',
  },
  tip: {
    labelKey: 'editors.alertTip',
    icon: '<path d="M10 2.5a5.5 5.5 0 0 0-3 10.1c.5.35.8.9.8 1.5v.4h4.4v-.4c0-.6.3-1.15.8-1.5A5.5 5.5 0 0 0 10 2.5Z"/><line x1="8" y1="17.5" x2="12" y2="17.5"/><line x1="8.5" y1="15.5" x2="11.5" y2="15.5"/>',
  },
  important: {
    labelKey: 'editors.alertImportant',
    icon: '<path d="M3 4.5h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8l-3.2 2.8a.5.5 0 0 1-.8-.4V14.5H3a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z"/><line x1="10" y1="7.5" x2="10" y2="10.5"/><circle cx="10" cy="12.3" r="0.9" fill="currentColor" stroke="none"/>',
  },
  warning: {
    labelKey: 'editors.alertWarning',
    icon: '<path d="M10 3.2 18 16.5H2L10 3.2Z" stroke-linejoin="round"/><line x1="10" y1="8.5" x2="10" y2="12"/><circle cx="10" cy="14.2" r="0.9" fill="currentColor" stroke="none"/>',
  },
  caution: {
    labelKey: 'editors.alertCaution',
    icon: '<polygon points="6.5,2.5 13.5,2.5 17.5,6.5 17.5,13.5 13.5,17.5 6.5,17.5 2.5,13.5 2.5,6.5" stroke-linejoin="round"/><line x1="10" y1="7" x2="10" y2="11"/><circle cx="10" cy="13.3" r="0.9" fill="currentColor" stroke="none"/>',
  },
};

/** Strip the `[!TYPE]` marker from the blockquote's first paragraph, and
 * drop a now-redundant leading line break so the callout body doesn't open
 * with a blank line. Returns false (leaves the DOM untouched) when the
 * first paragraph doesn't start with a recognized marker. */
function stripMarker(firstParagraph) {
  const first = firstParagraph.childNodes[0];
  if (!first || first.nodeType !== Node.TEXT_NODE) return null;
  const match = MARKER_RE.exec(first.nodeValue);
  if (!match) return null;

  const remainder = first.nodeValue.slice(match[0].length);
  if (remainder === '') {
    first.remove();
    const next = firstParagraph.childNodes[0];
    if (next && next.nodeName === 'BR') next.remove();
  } else {
    first.nodeValue = remainder;
  }
  return match[1].toLowerCase();
}

/** Turn recognized `> [!TYPE]` blockquotes under root into styled callouts.
 * Idempotent — already-processed blockquotes (data-alert set) are skipped,
 * so repeated calls on the same content are cheap. */
export function applyGithubAlerts(root) {
  if (!root) return;
  const blockquotes = root.querySelectorAll('blockquote:not([data-alert])');

  for (const blockquote of blockquotes) {
    const firstParagraph = blockquote.querySelector(':scope > p');
    if (!firstParagraph) continue;

    const type = stripMarker(firstParagraph);
    if (!type) continue;

    const meta = ALERT_META[type];
    blockquote.dataset.alert = type;

    const title = document.createElement('div');
    title.className = 'gfm-alert-title';
    title.innerHTML =
      `<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">${meta.icon}</svg>` +
      `<span>${t(meta.labelKey)}</span>`;
    blockquote.insertBefore(title, firstParagraph);
  }
}

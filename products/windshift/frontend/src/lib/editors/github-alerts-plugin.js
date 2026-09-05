// Milkdown/ProseMirror plugin for GitHub-style blockquote alerts:
// `> [!NOTE]`, `> [!TIP]`, `> [!IMPORTANT]`, `> [!WARNING]`, `> [!CAUTION]`.
//
// This is a GitHub-invented convention, not part of CommonMark/GFM, so the
// parser sees an ordinary blockquote whose first line is the literal text
// "[!IMPORTANT]". Decorations (not a raw DOM post-process) are the only way
// to style that without fighting the live, editable ProseMirror view: they
// live in ProseMirror's own render pipeline and get recomputed on every
// transaction, so they render identically whether the page is in Read or
// Edit mode and never get clobbered by the editor's own DOM diffing — see
// milkdown-mention-mark.js for the same technique applied to @mentions.
import { Plugin, PluginKey } from '@milkdown/kit/prose/state';
import { Decoration, DecorationSet } from '@milkdown/kit/prose/view';
import { $prose } from '@milkdown/kit/utils';
import { t } from '../stores/i18n.svelte.js';

const ALERT_TYPES = ['NOTE', 'TIP', 'IMPORTANT', 'WARNING', 'CAUTION'];
const MARKER_RE = new RegExp(`^\\[!(${ALERT_TYPES.join('|')})\\]\\s*`, 'i');

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

function renderAlertTitle(type) {
  const meta = ALERT_META[type];
  const el = document.createElement('span');
  el.className = 'gfm-alert-title';
  el.contentEditable = 'false';
  el.innerHTML =
    `<svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round">${meta.icon}</svg>` +
    `<span>${t(meta.labelKey)}</span>`;
  return el;
}

function createAlertDecorations(doc) {
  const decorations = [];

  doc.descendants((node, pos) => {
    if (node.type.name !== 'blockquote') return;
    const paragraph = node.firstChild;
    if (!paragraph || paragraph.type.name !== 'paragraph') return;
    const firstChild = paragraph.firstChild;
    if (!firstChild || !firstChild.isText) return;

    const match = MARKER_RE.exec(firstChild.text);
    if (!match) return;

    const type = match[1].toLowerCase();
    const paragraphStart = pos + 2; // + blockquote open + paragraph open
    const markerEnd = paragraphStart + match[0].length;

    decorations.push(
      Decoration.node(pos, pos + node.nodeSize, { class: 'gfm-alert', 'data-alert': type })
    );
    decorations.push(
      Decoration.inline(paragraphStart, markerEnd, { class: 'gfm-alert-marker-hidden' })
    );
    decorations.push(
      Decoration.widget(paragraphStart, () => renderAlertTitle(type), {
        side: -1,
        key: `gfm-alert-title-${type}`,
      })
    );
  });

  return DecorationSet.create(doc, decorations);
}

const githubAlertsPluginKey = new PluginKey('github-alerts');

export const githubAlertsPlugin = $prose(() => {
  return new Plugin({
    key: githubAlertsPluginKey,
    state: {
      init(_, { doc }) {
        return createAlertDecorations(doc);
      },
      apply(tr, old) {
        return tr.docChanged ? createAlertDecorations(tr.doc) : old;
      },
    },
    props: {
      decorations(state) {
        return this.getState(state);
      },
    },
  });
});

// EDITOR-ONLY setting prose for the toggle group — read by `./index.ts`'s `defineEditorInfo`
// call. Same physical shape as the tabs'/accordion's own `playground/settings.ts`.

export const settings = {
  orientation: {
    means: "which way the buttons lay out — also drives keyboard navigation (arrow keys)",
    options: {
      horizontal: { means: "buttons in a row — the default" },
      vertical: { means: "buttons in a column" },
    },
  },
  multiple: {
    means: "whether several buttons can stay pressed at once, instead of just one",
  },
};

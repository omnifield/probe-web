// EDITOR-ONLY setting prose for the listbox — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as the splitter's/accordion's own `playground/settings.ts`: `orientation`
// is the one name from the closed `SETTINGS` vocabulary that intersects the listbox's own props
// (`../entity/passport.ts`) — same name, same mark (`data-orientation`), though NOT reaching
// every part here (see the passport's own comment).

export const settings = {
  orientation: {
    means: "which axis items are laid out on and navigated with the keyboard",
    options: {
      vertical: { means: "top to bottom" },
      horizontal: { means: "left to right" },
    },
  },
};

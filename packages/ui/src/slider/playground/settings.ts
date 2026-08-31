// TEMPLATE — structure prepared, prose NOT written here.
//
// EDITOR-ONLY setting prose for the slider — read by `./index.ts`'s `defineEditorInfo` call. Same
// physical shape as the tabs'/radio-group's own `playground/settings.ts`: `orientation` is the
// one name from the closed `SETTINGS` vocabulary that intersects the slider's own props
// (`../entity/passport.ts`) — same name, same mark (`data-orientation`), default `"horizontal"`.

export const settings = {
  orientation: {
    means: "TODO",
    options: {
      horizontal: { means: "TODO" },
      vertical: { means: "TODO" },
    },
  },
};

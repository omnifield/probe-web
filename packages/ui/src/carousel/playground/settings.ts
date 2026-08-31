// EDITOR-ONLY setting prose for the carousel — read by `./index.ts`'s `defineEditorInfo` call.
// Same physical shape as the accordion's/tabs' own `playground/settings.ts`: `orientation` is
// the one name from the closed `SETTINGS` vocabulary that intersects the carousel's own props
// (`../entity/passport.ts`) — same name, same mark (`data-orientation`).

export const settings = {
  orientation: {
    means: "which axis the slides scroll on — also flips which way prevTrigger/nextTrigger point",
    options: {
      horizontal: { means: "slides scroll left/right" },
      vertical: { means: "slides scroll up/down" },
    },
  },
};

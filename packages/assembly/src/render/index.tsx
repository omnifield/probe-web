// см. README.md / FAQ.md — тонкий реэкспорт публичной поверхности `./render`, по тому же
// образцу, что `src/index.ts` держит для `engine/`. Сама отрисовка разложена по темам:
// `render-tree.tsx` (RenderTree — провайдер/Suspense/checkTree), `render-node.tsx` (RenderNode —
// сборка одного узла), `content-of.tsx` (дети узла — самая тонкая часть, разбор в докблоке
// файла), `composition.ts`/`self-assembly-branch.ts` (ЧЕМ рисовать узел), `props.ts`
// (пропы/события/bind из данных), `content-value.ts` (значение content-узла), `edit-overlay.tsx`
// (украшение путей отрисовки), `takes-content.ts` (структурный вопрос реестра), `defaults.tsx`
// (запасные виды), `types.ts` (проп-контракты).

export type { SlotEntry, SlotPlacement } from "./types.js";
export type { FallbackProps, ErrorFallbackProps, EditOverlayProps, RenderTreeProps } from "./types.js";
export { RenderTree } from "./render-tree.js";

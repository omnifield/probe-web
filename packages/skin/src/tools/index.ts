// Операции этого пакета над своими понятиями (Palette/Form/Outfit/Skin) — двояко: голой функцией
// (реэкспорт как есть, для прямого вызова) и `toolDefinition()`-обёрткой рядом (контракт для того,
// кто решит открыть операцию агенту — не решается здесь, `packages/neurobox/ROADMAP.yaml`'s
// `app-zone-tool-registry`). Ни один `toolDefinition()` не зовёт `.server(execute)` сам — это тоже
// дело того, кто регистрирует: связать контракт с реальным `PassportLookup`/реестром компонентов
// приложения, которого у голой функции пакета нет и не должно быть.
//
// `lookup`/`passports`/`editorInfo` НЕ входят в `inputSchema`: `PassportAnatomy` несёт функции
// (`keys()`/`build()`), это знание живого реестра компонентов приложения — инфраструктура вызова
// (аналог второго параметра `execute(input, context)` у `@tanstack/ai`), не значение, которое агент
// выбирает за один вызов. Разбор — FAQ.md.

import { z } from "@web-core/io";
import { toolDefinition } from "@web-core/neurobox/tool";
import type { ToolDefinition } from "@tanstack/ai";
import {
  AssembledSchema,
  LookPartsSchema,
  OutfitFlawSchema,
  OutfitSchema,
  SkinGapSchema,
  SkinSchema,
  ValueVocabularySchema,
} from "./schemas.js";

export { assemble, checkOutfit } from "../engine/look/index.js";
export { generateSkinCss } from "../engine/generate/index.js";
export { skinGaps } from "../engine/coverage/index.js";

// Схемы вынесены в именованные константы, а не подставлены литералом в `toolDefinition({...})`:
// без `typeof`-ссылки на них компилятор не может назвать инстанцированный `ToolDefinition<...>` в
// `.d.ts` (rollup-plugin-dts падает — тип живёт в чужом вложенном `node_modules/@tanstack/ai`,
// не в поднятом). Явная аннотация ниже — тот же обход, что уже есть у самого `toolDefinition()` в
// `@web-core/neurobox/tool`.
const OutfitPartsInput = z.object({ outfit: OutfitSchema, parts: LookPartsSchema });
const OutfitFlawsOutput = z.array(OutfitFlawSchema);
const GenerateSkinCssInput = z.object({ skin: SkinSchema, vocabulary: ValueVocabularySchema.optional() });
const SkinInput = z.object({ skin: SkinSchema });
const SkinGapsOutput = z.array(SkinGapSchema);

export const checkOutfitTool: ToolDefinition<typeof OutfitPartsInput, typeof OutfitFlawsOutput, "check_outfit"> =
  toolDefinition({
    name: "check_outfit",
    description: "проверяет наряд против палитры/форм: незакрытый словарь, неизвестные имена, коллизии keyframes",
    access: "read",
    inputSchema: OutfitPartsInput,
    outputSchema: OutfitFlawsOutput,
  });

export const assembleOutfitTool: ToolDefinition<typeof OutfitPartsInput, typeof AssembledSchema, "assemble_outfit"> =
  toolDefinition({
    name: "assemble_outfit",
    description: "собирает наряд (палитра+формы) в скин — значения на координатах компонентов",
    access: "read",
    inputSchema: OutfitPartsInput,
    outputSchema: AssembledSchema,
  });

export const generateSkinCssTool: ToolDefinition<typeof GenerateSkinCssInput, z.ZodString, "generate_skin_css"> =
  toolDefinition({
    name: "generate_skin_css",
    description: "печатает CSS собранного скина",
    access: "read",
    inputSchema: GenerateSkinCssInput,
    outputSchema: z.string(),
  });

export const skinGapsTool: ToolDefinition<typeof SkinInput, typeof SkinGapsOutput, "skin_gaps"> = toolDefinition({
  name: "skin_gaps",
  description: "покрытие координат скина значением — какие компонент/часть/состояние остались без стиля",
  access: "read",
  inputSchema: SkinInput,
  outputSchema: SkinGapsOutput,
});

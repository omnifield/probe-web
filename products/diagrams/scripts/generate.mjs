// ПОРОЖДЕНИЕ ВХОДОВ — тот же приём, что у `packages/ui/scripts/generate.mjs` (разбор — там же):
// два перечня, собираемых обходом папок компонентов, отдельным шагом до typecheck/сборки.
//
// ОТЛИЧИЕ ОТ КИТА: `defineKitComponent`/`KitComponent`/`kitOf` здесь не свои — берутся готовыми
// из `@omnifield/probe-web-ui` (тот же геттер частей подходит любому паспорту, hand-authored он
// или Ark-овый, — прецедент: кит уже так строит `table`, у которого тоже нет поставщика анатомии
// извне). Второй копии `kit-form.ts` в этом продукте нет и не будет.

import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(pkgRoot, "src");

function passportModuleOf(folder) {
  return `${folder}/entity/passport.js`;
}

function kitModuleOf(folder) {
  return `${folder}/components/kit.js`;
}

function editorInfoModuleOf(folder) {
  return `${folder}/playground/index.js`;
}

/** Папки компонентов, объявивших анатомию. */
function componentFolders() {
  return readdirSync(srcDir, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item) => item.name)
    .filter((name) => existsSync(join(srcDir, name, "entity", "passport.ts")))
    .sort();
}

function identifierOf(folder, suffix) {
  return `${folder.replace(/-(.)/g, (_, letter) => letter.toUpperCase())}${suffix}`;
}

function renderPassportEntry(folders) {
  const name = (folder) => identifierOf(folder, "Passport");
  const editorName = (folder) => identifierOf(folder, "EditorInfo");
  const imports = folders
    .map(
      (folder) =>
        `import { passport as ${name(folder)} } from "./${passportModuleOf(folder)}";\n` +
        `import { editorInfo as ${editorName(folder)} } from "./${editorInfoModuleOf(folder)}";`,
    )
    .join("\n");
  const entries = folders.map((folder) => `  [${name(folder)}.component]: ${name(folder)},`).join("\n");
  const editorEntries = folders
    .map((folder) => `  [${editorName(folder)}.component]: ${editorName(folder)},`)
    .join("\n");

  return `// ПОРОЖДЁН СБОРКОЙ (\`scripts/generate.mjs\`) — НЕ ПРАВИТЬ И НЕ КОММИТИТЬ.
//
// Перечень паспортов собирается обходом папок \`src/*\`: компонент объявляет себя в своей папке
// (\`entity/passport.ts\`) и попадает в поставку самим фактом объявления. Тот же приём, что у
// \`@omnifield/probe-web-ui/passport\` — форма паспорта общая для любого поставщика компонентов.

export type {
  ComponentPassport,
  PassportAnatomy,
  PassportLookup,
  PassportMark,
  PassportPart,
  PassportSetting,
  PassportSettingDependency,
  PassportSettingName,
  PassportSettingOption,
  PassportSettings,
  PassportSettingValues,
  PassportSpec,
  PassportState,
  PassportVariable,
  PassportVariantAxis,
  SkinAncestor,
  SkinCoordinate,
} from "@omnifield/probe-web-skin/model";
export {
  addressesView,
  coordinateOf,
  createAnatomy,
  defineSettings,
  definePassport,
  partOf,
  SETTINGS,
  settingApplies,
} from "@omnifield/probe-web-skin/model";
export type {
  BaseAssemblyContent,
  BaseAssemblyElement,
  BaseAssemblyNode,
  BaseAssemblyTree,
  ComponentGroup,
  PassportAdmission,
  PassportAssembly,
  PassportAssemblyContent,
  PassportAssemblyNode,
  PassportAssemblyPart,
  PassportComponentGenus,
  PassportEditorInfo,
  PassportEditorSpec,
  PassportGenus,
  PassportPartEditorInfo,
  PassportSettingEditorInfo,
  PassportSettingOptionEditorInfo,
  PassportStateEditorInfo,
  PassportVariableEditorInfo,
} from "@omnifield/probe-web-skin/editor";
export {
  admits,
  baseAssemblyOf,
  defineEditorInfo,
  GROUPS,
  groupOf,
  isAssemblyContent,
  isContentNode,
} from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { PassportEditorInfo } from "@omnifield/probe-web-skin/editor";
${imports}

/**
 * Паспорта продукта по имени компонента.
 *
 * Перечень, а не «сколько их»: компонент без паспорта здесь отсутствует ЧЕСТНО — его ещё не
 * построили, и молчаливая заглушка выглядела бы как объявленный контракт.
 */
export const PASSPORTS: Readonly<Record<string, ComponentPassport>> = {
${entries}
};

/**
 * Паспорт по имени компонента, либо \`undefined\` — если компонент его ещё не объявил.
 *
 * @param component имя компонента, оно же \`data-scope\` на каждом его узле
 */
export function passportOf(component: string): ComponentPassport | undefined {
  return PASSPORTS[component];
}

/** Срезы РЕДАКТОРА продукта по имени компонента — тем же ключом, что \`PASSPORTS\`. */
export const EDITOR_INFOS: Readonly<Record<string, PassportEditorInfo>> = {
${editorEntries}
};

/**
 * Срез редактора по имени компонента, либо \`undefined\` — если компонент его ещё не объявил.
 *
 * @param component имя компонента, оно же \`data-scope\` на каждом его узле
 */
export function editorInfoOf(component: string): PassportEditorInfo | undefined {
  return EDITOR_INFOS[component];
}
`;
}

function renderKitEntry(folders) {
  const name = (folder) => identifierOf(folder, "Kit");
  const imports = folders
    .map((folder) => `import { kit as ${name(folder)} } from "./${kitModuleOf(folder)}";`)
    .join("\n");
  const entries = folders.map((folder) => `  [${name(folder)}.passport.component]: ${name(folder)},`).join("\n");

  return `// ПОРОЖДЁН СБОРКОЙ (\`scripts/generate.mjs\`) — НЕ ПРАВИТЬ И НЕ КОММИТИТЬ.
//
// Перечень компонентов продукта собирается тем же обходом папок, что и перечень паспортов.
// \`defineKitComponent\`/\`KitComponent\`/\`kitOf\` НЕ свои — реэкспорт из \`@omnifield/probe-web-ui\`
// (\`scripts/generate.mjs\`, шапка): та же карта части-в-компонент годится любому паспорту.

export { defineKitComponent, type KitComponent, type PartComponent } from "@omnifield/probe-web-ui";
import type { KitComponent } from "@omnifield/probe-web-ui";
${imports}

/**
 * Компоненты продукта по имени: паспорт вместе с картой его частей.
 *
 * Ключ — то же имя, которым компонент подписан на каждом своём узле (\`data-scope\`), и то же,
 * которым он лежит в \`PASSPORTS\`.
 */
export const KIT: Readonly<Record<string, KitComponent>> = {
${entries}
};

/**
 * Компонент продукта по имени, либо \`undefined\` — если такого продукт не отдаёт.
 *
 * @param component имя компонента, оно же \`data-scope\` на каждом его узле
 */
export function kitOf(component: string): KitComponent | undefined {
  return KIT[component];
}
`;
}

const folders = componentFolders();

if (folders.length === 0) {
  throw new Error("в `src/` нет ни одной папки компонента с анатомией — подпуть паспорта пуст");
}

const withoutMap = folders.filter((folder) => !existsSync(join(srcDir, folder, "components", "kit.ts")));

if (withoutMap.length > 0) {
  throw new Error(`паспорт есть, карты нет — папки без карты частей: ${withoutMap.join(", ")}`);
}

writeFileSync(join(srcDir, "passport.ts"), renderPassportEntry(folders), "utf8");
writeFileSync(join(srcDir, "kit.ts"), renderKitEntry(folders), "utf8");

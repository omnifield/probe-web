// ПОРОЖДЕНИЕ ВХОДОВ — два перечня, собираемых обходом папок компонентов.
//
// ## Почему это отдельный шаг, а не часть сборки
//
// Порождённые входы нужны РАНЬШЕ сборки: на них смотрят и проверка типов, и пробы. Пока их
// требовала одна лишь сборка, отсутствие файла никому не мешало; с картой (`PWEB-84`) на
// порождённый вход ссылается корневой `src/index.ts`, и `tsc` без него не разрешает модуль.
//
// Развилка была между «typecheck зовёт полную сборку» и «порождение выносится в свой шаг».
// Взято второе: сборка — это три прохода esbuild плюс отдельный `tsc` деклараций, а порождение —
// два обхода каталога и две записи. Гнать первое ради второго значит платить сборкой за каждую
// проверку типов.
//
// ## Перечни ведутся обходом, а не файлом
//
// Файл, в который дописывает строку каждый новый компонент, — это общий владелец и очередь из
// овнеров; именно из таких файлов вырастает круг «один правит — ломается у второго». Забыл
// вписать — паспорт молча не уехал бы в поставку, и узнал бы об этом скин, а не мы.
//
// Компонент считается объявившим себя, если в его папке лежит `<имя>.anatomy.ts` с экспортом
// `passport`. Ни списка, ни порядка руками: порядок — алфавитный, чтобы порождённые файлы не
// менялись от порядка чтения каталога.
//
// Обход ОДИН на оба перечня. Два обхода со своими фильтрами разъехались бы на первой же папке,
// попавшей под один и не попавшей под второй, — и разъехались бы молча.

import { existsSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(pkgRoot, "src");

/** Папки компонентов, объявивших анатомию. */
function componentFolders() {
  return readdirSync(srcDir, { withFileTypes: true })
    .filter((item) => item.isDirectory())
    .map((item) => item.name)
    .filter((name) => existsSync(join(srcDir, name, `${name}.anatomy.ts`)))
    .sort();
}

/** Имя папки → имя переменной: `number-field` + `Passport` → `numberFieldPassport`. */
function identifierOf(folder, suffix) {
  return `${folder.replace(/-(.)/g, (_, letter) => letter.toUpperCase())}${suffix}`;
}

/** Собирает исходник подпути `./passport` — вход, который читают скин и редактор. */
function renderPassportEntry(folders) {
  const name = (folder) => identifierOf(folder, "Passport");
  const editorName = (folder) => identifierOf(folder, "EditorInfo");
  const imports = folders
    .map(
      (folder) =>
        `import { passport as ${name(folder)}, editorInfo as ${editorName(folder)} } from "./${folder}/${folder}.anatomy.js";`,
    )
    .join("\n");
  const entries = folders
    .map((folder) => `  [${name(folder)}.component]: ${name(folder)},`)
    .join("\n");
  const editorEntries = folders
    .map((folder) => `  [${editorName(folder)}.component]: ${editorName(folder)},`)
    .join("\n");

  return `// ПОРОЖДЁН СБОРКОЙ (\`scripts/generate.mjs\`) — НЕ ПРАВИТЬ И НЕ КОММИТИТЬ.
//
// Перечень паспортов собирается обходом папок \`src/*/<имя>.anatomy.ts\`: компонент объявляет
// себя в своей папке, и попадает в поставку самим фактом объявления. Руками этот файл не
// ведётся — иначе он стал бы тем самым общим файлом, который правят все.
//
// ФОРМА ПАСПОРТА (\`PWEB-110\`, \`PWEB-111\`) переехала в \`@omnifield/probe-web-skin\` — она общая
// для любого поставщика компонентов, а не привилегия этого кита. Реэкспорт ниже ПОИМЁННЫЙ, а не
// \`export *\`: подпути несут и чужое (рецепты, палитру, словарь скина), а
// \`@omnifield/probe-web-ui/passport\` обязан остаться тем же набором имён, что был до переезда
// (жёсткое условие \`PWEB-110\`/\`PWEB-111\` — \`packages/assembly\` ходит сюда и не вправе
// почувствовать перенос).
//
// ДВА ИСТОЧНИКА, не один (\`PWEB-115\`, \`PWEB-118\`): форма паспорта сама разрезана на срез
// РАНТАЙМА (\`/model\` — то, что читают \`generateSkinCss\`/\`checkOutfit\`/\`assemble\`) и срез
// РЕДАКТОРА (\`/editor\` — \`means\`, род, группа, пакет, правило вложенности, сборки). Этот
// подпуть остаётся ОДНИМ плоским входом, как и был, — держатель реестра (кит) не обязан знать
// про чужую границу тайм-шейкинга у форм; кто у НАС не сошлётся на редакторские имена, тот их и
// не утащит в свой бандл — тем же \`sideEffects: false\`, которым разрезана сама форма.
//
// \`PASSPORTS\`/\`passportOf\` остаются здесь — это факт про ЭТОТ кит (какие компоненты у него
// есть), а не про форму, и переезду не подлежат (\`PWEB-26\`, \`PWEB-110\`).
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
// Срез РЕДАКТОРА — \`means\`, род, группа, правило вложенности, сборки. Не рантайм кита, но
// \`@omnifield/probe-web-ui/passport\` держал их всегда одним входом, и держит дальше (см. шапку).
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
// Реэкспорт (\`export ... from\`) не заводит локальное имя — \`ComponentPassport\`/\`PassportEditorInfo\`
// ниже нужны САМ файлу, для \`PASSPORTS\`/\`passportOf\`/\`EDITOR_INFOS\`/\`editorInfoOf\`, и берутся
// отдельным \`import type\`.
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
import type { PassportEditorInfo } from "@omnifield/probe-web-skin/editor";
${imports}

/**
 * Паспорта пакета по имени компонента.
 *
 * Перечень, а не «сколько их»: число устаревает при добавлении каждого следующего паспорта, а
 * форма чтения — нет. Компонент без паспорта здесь отсутствует ЧЕСТНО: его ещё не одевали, и
 * молчаливая заглушка выглядела бы как объявленный контракт.
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

/**
 * Срезы РЕДАКТОРА пакета по имени компонента (\`PWEB-115\`, \`PWEB-118\`) — тем же ключом, что
 * \`PASSPORTS\`, и тем же доводом: перечень, не число, обходом папок, а не рукой.
 */
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

/**
 * Собирает перечень компонентов кита — паспорт вместе с картой его частей (`PWEB-84`).
 *
 * Ключ снимается с ПАСПОРТА (`kit.passport.component`), а не с имени папки: имя компонента живёт
 * в анатомии, и второе его начертание разъехалось бы с первым молча — ровно так же, как в
 * перечне паспортов.
 */
function renderKitEntry(folders) {
  const name = (folder) => identifierOf(folder, "Kit");
  const imports = folders
    .map((folder) => `import { kit as ${name(folder)} } from "./${folder}/${folder}.kit.js";`)
    .join("\n");
  const entries = folders
    .map((folder) => `  [${name(folder)}.passport.component]: ${name(folder)},`)
    .join("\n");

  return `// ПОРОЖДЁН СБОРКОЙ (\`scripts/generate.mjs\`) — НЕ ПРАВИТЬ И НЕ КОММИТИТЬ.
//
// Перечень компонентов кита собирается тем же обходом папок, что и перечень паспортов: компонент
// объявляет себя в своей папке и попадает в поставку самим фактом объявления.

import type { KitComponent } from "./kit-form.js";
${imports}

export * from "./kit-form.js";

/**
 * Компоненты кита по имени: паспорт вместе с картой его частей.
 *
 * Ключ — то же имя, которым компонент подписан на каждом своём узле (\`data-scope\`), и то же,
 * которым он лежит в \`PASSPORTS\`: оба перечня снимают его с паспорта, а не пишут рядом ещё раз.
 */
export const KIT: Readonly<Record<string, KitComponent>> = {
${entries}
};

/**
 * Компонент кита по имени, либо \`undefined\` — если такого кит не отдаёт.
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

// Объявил анатомию — обязан назвать, чем её части рисуются. Молчаливого пропуска здесь нет:
// компонент без карты уехал бы в поставку паспортом, который нечем отрисовать, и узнал бы об этом
// потребитель — на неодетом узле, а не на нашем прогоне.
const withoutMap = folders.filter((folder) => !existsSync(join(srcDir, folder, `${folder}.kit.ts`)));

if (withoutMap.length > 0) {
  throw new Error(`паспорт есть, карты нет — папки без \`<имя>.kit.ts\`: ${withoutMap.join(", ")}`);
}

writeFileSync(join(srcDir, "passport.ts"), renderPassportEntry(folders), "utf8");
writeFileSync(join(srcDir, "kit.ts"), renderKitEntry(folders), "utf8");

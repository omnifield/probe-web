import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { defineBiomeConfig } from "../dist/biome/index.js";

// Biome читает только статический JSON — `defineBiomeConfig()` не может быть тем, что
// потребитель импортирует, как `defineConfig()` у `./eslint`. Этот шаг материализует канон в
// реальный артефакт, на который потребитель ссылается через `extends` в своём `biome.json`.
const outPath = fileURLToPath(new URL("../dist/biome/biome.json", import.meta.url));
writeFileSync(outPath, `${JSON.stringify(defineBiomeConfig(), null, 2)}\n`);

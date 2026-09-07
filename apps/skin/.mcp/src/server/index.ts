import { createServer } from "@web-core/mcp/transport";
import { registerTools } from "../tools";

const transport = process.env["SKIN_MCP_TRANSPORT"] === "http" ? "http" : "stdio";
const port = Number(process.env["PORT"] ?? 3000);
const host = process.env["SKIN_MCP_HOST"];

const instructions = [
  "Словарь: Palette — цвета/шкалы (краски). Form — рецепт ОДНОГО компонента, какие CSS-свойства",
  "у каких частей/состояний/вариантов (это и есть скин). Outfit — палитра + список форм вместе",
  "(тема целиком). Assembly — структурное дерево (что из чего собрано), про устройство, не про",
  "цвет. Tag — метка на наряде или на значении варианта формы, несёт смысл (например \"status\"),",
  "не просто ярлык — используйте для поиска примеров, не только для группировки.",
  "Прежде чем писать form с нуля — найдите готовый пример: list_components даёт footprint/group",
  "каждого компонента, у компонента с тем же footprint/group почти наверняка уже есть форма в",
  "теме-эталоне omnifield-*. get_preset({kind:\"form\", name:\"omnifield-<похожий>\"}) — копируйте",
  "СТРУКТУРУ (какие части/состояния тронуты), не значения.",
  "Разведка: list_components (что есть) → get_passport (части/состояния/настройки/io-схема",
  "конкретного компонента) — до того, как писать палитру/форму/сборку.",
  "Проверка ДО сохранения: check_palette/check_form/check_assembly/check_outfit — каждая отдаёт",
  "отчёт с флавами. Флавы в ответе (ok:false внутри данных, isError всё равно false) — это",
  "нормальный результат проверки, не отказ инструмента: значит проверяемое невалидно, а не что",
  "ручка сломалась. Реальный отказ инструмента (isError:true) — только для неизвестного имени",
  "компонента/пресета или сломанной формы входа.",
  "assemble_preview — собрать наряд и увидеть CSS-текст плюс покрытие (gaps), без сохранения;",
  "тот же принцип: флавы наряда — часть ответа, не isError.",
  "save_preset — сохранить ТОЛЬКО после того, как соответствующий check_* прошёл (сама ручка",
  "тоже проверяет перед записью и откажет тем же отчётом при флавах).",
].join(" ");

const server = createServer({ name: "web-core-skin", version: "0.0.0", transport, host, instructions, registerTools });

await server.listen(port);

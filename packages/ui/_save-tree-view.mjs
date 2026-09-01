import { importModule } from "@probe-web/generators/extract";
import { join } from "node:path";

const { form: proofForm } = await importModule(join(process.cwd(), "src/tree-view/playground/recipe.ts"));
const form = { ...proofForm, name: "omnifield-tree-view" };
console.log("form.name:", form.name, "component:", form.component);

const validatePath = "/workspaces/probe-web/products/skin/.mcp/src/validate.js";
const storePath = "/workspaces/probe-web/products/skin/.mcp/src/store.js";
const { checkForm } = await import(validatePath);
const store = await import(storePath);

const result = await checkForm(form, "omnifield-palette");
if (!result.ok) {
  console.log("REFUSING", JSON.stringify(result, null, 2));
  process.exit(1);
}
console.log("check_form ok:true — saving");
const saved = await store.replace("form", form.name, form, "Омнифилд — дерево");
console.log("saved:", JSON.stringify(saved));

// Cleanup — remove the stray "tree-view-sample" record from the earlier mistaken save.
const stray = await store.findByName("form", "tree-view-sample");
if (stray) {
  await store.remove(stray.id);
  console.log("removed stray record:", stray.id);
}

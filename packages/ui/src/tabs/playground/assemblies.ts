// STRUCTURAL assembly templates for tabs — read by `./index.ts`'s `defineEditorInfo` call
// (`PWEB-127`). Same physical shape as every other component's `playground/assemblies.ts`.
//
// ONE assembly, three tabs — the shape in `components/index.tsx`'s own doc-comment example
// (`account`/`billing`), with a third tab added: two is the minimum that exercises the sliding
// indicator at all (one tab never moves), three is the minimum that shows it PASSING OVER a
// tab it isn't headed to, not just toggling between two fixed spots.

import type { PassportAssembly } from "@omnifield/probe-web-skin/editor";
import type { ComponentPassport } from "@omnifield/probe-web-skin/model";
// TYPE ONLY: no runtime import of the passport module here — `typeof passport` in a type
// position needs the binding's TYPE, not the module's side effects.
import type { passport } from "../entity/passport.js";

type TabsPart = typeof passport extends ComponentPassport<infer Part> ? Part : never;

export const assemblies: readonly PassportAssembly<TabsPart>[] = [
  {
    name: "basic",
    means: "рабочие табы: три раздела, первый открыт, полоса едет под выбранным",
    tree: {
      part: "root",
      props: { defaultValue: "account" },
      children: [
        {
          part: "list",
          children: [
            { part: "trigger", props: { value: "account" }, children: [{ genus: "text", value: "Аккаунт" }] },
            { part: "trigger", props: { value: "billing" }, children: [{ genus: "text", value: "Оплата" }] },
            { part: "trigger", props: { value: "settings" }, children: [{ genus: "text", value: "Настройки" }] },
            { part: "indicator" },
          ],
        },
        { part: "content", props: { value: "account" }, children: [{ genus: "text", value: "Имя, почта, пароль." }] },
        { part: "content", props: { value: "billing" }, children: [{ genus: "text", value: "Карта и история платежей." }] },
        { part: "content", props: { value: "settings" }, children: [{ genus: "text", value: "Язык, тема, уведомления." }] },
      ],
    },
  },
];

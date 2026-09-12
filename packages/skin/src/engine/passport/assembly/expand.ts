
import { baseAssemblyOf as baseAssemblyOfReal, type AssemblyTemplate, type AssemblyTree } from "@web-core/assembly";

import type { ComponentPassport } from "../form/index.js";
import type { PassportAssembly } from "./assembly.js";

export { scopedPath } from "@web-core/assembly";

/**
 * Тонкая обёртка вокруг `@web-core/assembly`'s настоящего `baseAssemblyOf` — сам разворот
 * `repeat`/`recur` по данным живёт там, не здесь (ROADMAP.yaml,
 * `baseAssemblyOf-becomes-thin-reexport`). `ComponentPassport` этого пакета уже структурно
 * удовлетворяет `GrowablePassport` (`component`/`anatomy.keys()`/`root` — три поля, которые
 * настоящая функция реально читает), передаётся без мержа и без каста. Типизированный вход этого
 * пакета (`PassportAssembly<Part, Registry, Data, AtRoot>` с generic-проверкой пути) стирается в
 * структурный `AssemblyTemplate`, которого ждёт настоящая функция, тем же приёмом, каким
 * `@web-core/assembly`'s собственный `engine/expand.ts` уже сегодня стирает generic до `unknown`.
 */
export function baseAssemblyOf(
  passport: ComponentPassport,
  assembly: PassportAssembly,
  address: string = passport.component,
  data?: unknown,
): AssemblyTree {
  return baseAssemblyOfReal(passport, assembly as unknown as AssemblyTemplate, address, data);
}

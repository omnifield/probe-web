import { describe, expect, it } from "vitest";

import { cn } from "../src/cn.js";

// Тест проверяет РЕЗУЛЬТАТ слияния, а не факт экспорта: смысл `cn` целиком в том, что
// именно оказывается в атрибуте после конфликта, — «функция есть» об этом не говорит.
describe("cn", () => {
  it("конфликт утилит разрешается: выигрывает правый аргумент", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("неконфликтующие утилиты остаются обе, в порядке аргументов", () => {
    expect(cn("px-2", "text-sm")).toBe("px-2 text-sm");
  });

  it("конфликт видит группу, а не строку: `px-4` перебивает `p-2` только по горизонтали", () => {
    expect(cn("p-2", "px-4")).toBe("p-2 px-4");
    expect(cn("px-4", "p-2")).toBe("p-2");
  });

  it("условные формы clsx: ложные значения выпадают, массивы и объекты разворачиваются", () => {
    expect(cn("base", false && "hidden", undefined, null)).toBe("base");
    expect(cn(["flex", "gap-2"], { "opacity-50": true, hidden: false })).toBe(
      "flex gap-2 opacity-50",
    );
  });

  it("модификаторы состояний живут своей группой и с базовой утилитой не конфликтуют", () => {
    expect(cn("bg-white", "hover:bg-black")).toBe("bg-white hover:bg-black");
    expect(cn("hover:bg-white", "hover:bg-black")).toBe("hover:bg-black");
  });

  it("произвольные классы вне tailwind проходят насквозь", () => {
    expect(cn("popover-animate", "p-2", "p-4")).toBe("popover-animate p-4");
  });
});

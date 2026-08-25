// ГЕЙТ БАЗОВОЙ СБОРКИ И ПЕРЕМЕННЫХ УЗЛА (`PWEB-89`).
//
// Проба ПОДНИМАЕТ экземпляр, а не сверяет запись: сборка, проверенная сравнением полей, зелена и
// на дереве, которое не рисуется. Здесь она собирается в плоское дерево (`baseAssemblyOf`),
// монтируется в настоящий документ и проверяется по узлам.
//
// ## Чем поднимается — и чего эта проба НЕ доказывает
//
// Поднимает её `поднять` ниже — обход дерева силами самой пробы. Это НЕ механика сборки:
// зависеть на неё кит не вправе даже пробами — механика уже зависит на кит (её живые пробы
// стоят на настоящей кнопке), и встречная зависимость замкнула бы граф сборки.
//
// Значит здесь доказано: сборка собирается в плоское дерево, поднимается в документ, даёт узлы
// объявленных частей и несёт объявленные переменные. НЕ доказано: что её примет `RenderTree`
// механики. Эта проверка принадлежит читающей зоне и названа долгом в отчёте по задаче.
//
// ## Перечень не ведётся руками
//
// Проба идёт по `PASSPORTS` — тому же порождённому перечню, что и остальные гейты зоны. Список
// имён зеленел бы ровно на том компоненте, который в него забыли вписать.

import { For, type Component, type JSX } from "solid-js";
import { Dynamic } from "solid-js/web";
import { afterEach, describe, expect, it } from "vitest";

import { KIT } from "../src/index.js";
import { EDITOR_INFOS, PASSPORTS } from "../src/passport.js";
import {
  baseAssemblyOf,
  isContentNode,
  type BaseAssemblyElement,
  type BaseAssemblyTree,
} from "@omnifield/probe-web-skin/editor";
import { cleanup, mount } from "./dom.jsx";

afterEach(cleanup);

/**
 * Паспорта, чей срез редактора объявил хотя бы одну базовую сборку, — вместе с КАЖДОЙ из них.
 *
 * Каждая, а не первая (`PWEB-116`): держатель сборки объявляет их сколько угодно, и сборка,
 * поднятая только на первой записи, доказывала бы механику ровно для неё, — вторая и следующие
 * оставались бы записью, которую никто не поднимал в документ.
 */
const собираемые = Object.values(PASSPORTS).flatMap((passport) =>
  (EDITOR_INFOS[passport.component]?.assemblies ?? []).map(
    (assembly) => [passport, assembly] as const,
  ),
);

/**
 * Поднимает узел плоского дерева в разметку.
 *
 * Обход, а не отрисовка механики: см. шапку файла. Компонент берётся из карты частей — той
 * самой, которую кит отдаёт рядом с паспортами (`PWEB-84`), и это же проверяет, что карта
 * покрывает всё, что базовая сборка называет.
 *
 * @param tree дерево сборки
 * @param component имя компонента — им же дерево проиндексировано
 * @param id имя узла
 */
function поднять(tree: BaseAssemblyTree, component: string, id: string) {
  const node = tree.components.nodes[id];

  // Один возврат и `<For />` — требование пресета зоны: он не различает разбор данных и
  // отрисовку, а нарушать канон Solid ради пробы незачем. Дерево здесь неподвижно, поэтому
  // разницы в поведении нет.
  return (
    <>
      {!node ? null : isContentNode(node) ? (
        node.value
      ) : (
        <Dynamic component={компонентЧасти(component, node.type) as Component<ЛюбыеПропы>} {...node.props}>
          <For each={node.children}>{(child) => поднять(tree, component, child)}</For>
        </Dynamic>
      )}
    </>
  );
}

/** Пропы, которыми проба зовёт часть: что дала сборка, плюс дети. Кит их сужает сам. */
type ЛюбыеПропы = Record<string, unknown> & { children?: JSX.Element };

/**
 * Компонент части по адресу узла — из карты частей, которую кит отдаёт рядом с паспортами.
 *
 * Адрес корня и адрес компонента — одно место, и разбор это учитывает: иначе корневой узел искал
 * бы часть с именем компонента, которой в анатомии нет.
 *
 * @param component имя компонента
 * @param type адрес узла: `accordion` либо `accordion.itemTrigger`
 */
function компонентЧасти(component: string, type: string): unknown {
  const part = type === component ? PASSPORTS[component]!.root : type.split(".").pop()!;

  return KIT[component]?.parts[part];
}

describe("базовая сборка поднимается в документ", () => {
  it("сборку объявил хоть кто-то", () => {
    // Иначе перебор ниже шёл бы по пустому перечню и был бы зелёным, ничего не проверив.
    expect(собираемые.length).toBeGreaterThan(0);
  });

  it("`means` каждой сборки отличает её от соседних — у одного компонента дублей нет", () => {
    // `PWEB-116`: сборка, у которой `means` совпал с соседним, для читателя неотличима от
    // соседней — списком строк, а не деревом. Проверяется РОВНО дубль имени, не годность
    // формулировки: судить, назвал ли автор случай общими словами, тесту не по силам.
    for (const passport of Object.values(PASSPORTS)) {
      const означенные = (EDITOR_INFOS[passport.component]?.assemblies ?? []).map((a) => a.means);

      expect(
        new Set(означенные).size,
        `у «${passport.component}» есть сборки с одинаковым «means»: ${означенные.join(" / ")}`,
      ).toBe(означенные.length);
    }
  });

  describe.each(
    собираемые.map(
      ([passport, assembly]) =>
        [`${passport.component}: ${assembly.means}`, passport.component, passport, assembly] as const,
    ),
  )(
    "%s",
    (_, component, passport, assembly) => {
      it("собирается в плоское дерево с корнем на корневой части", () => {
        const tree = baseAssemblyOf(passport, assembly);

        expect(tree.components.root).toBe(component);
        expect(Object.keys(tree.components.nodes).length).toBeGreaterThan(0);
      });

      it("поднимается и даёт узел КАЖДОЙ части, которую называет", () => {
        const tree = baseAssemblyOf(passport, assembly);
        const host = mount(() => поднять(tree, component, tree.components.root));

        // Части, названные сборкой, — и ровно они обязаны появиться в документе. Часть,
        // объявленная и не нарисованная, означала бы сборку, которая обещает больше, чем даёт.
        const названные = new Set(
          Object.values(tree.components.nodes)
            .filter((node): node is BaseAssemblyElement => !isContentNode(node))
            .map((node) => (node.type === component ? passport.root : node.type.split(".").pop()!)),
        );

        for (const part of названные) {
          const адрес = passport.anatomy.build()[part]!.attrs;

          expect(
            host.querySelector(
              `[data-scope="${адрес["data-scope"]}"][data-part="${адрес["data-part"]}"]`,
            ),
            `часть «${part}» не появилась в разметке`,
          ).not.toBeNull();
        }
      });

      it("содержимое сборки доезжает до разметки", () => {
        const tree = baseAssemblyOf(passport, assembly);
        const host = mount(() => поднять(tree, component, tree.components.root));

        for (const node of Object.values(tree.components.nodes)) {
          if (!isContentNode(node)) continue;

          expect(host.textContent, `подпись «${node.value}» не доехала`).toContain(node.value);
        }
      });
    },
  );
});

describe("переменные, которые кит кладёт на узел", () => {
  describe.each(
    собираемые.map(
      ([passport, assembly]) =>
        [`${passport.component}: ${assembly.means}`, passport.component, passport, assembly] as const,
    ),
  )(
    "%s",
    (_, component, passport, assembly) => {
      const сПеременными = passport.parts.filter((part) => (part.variables ?? []).length > 0);

      it("объявленная переменная ЕСТЬ на узле своей части", () => {
        if (сПеременными.length === 0) {
          // Компонент без переменных — обычное состояние, а не пропуск: у подавляющего
          // большинства частей их не бывает вовсе.
          expect(сПеременными).toEqual([]);
          return;
        }

        const tree = baseAssemblyOf(passport, assembly);
        const host = mount(() => поднять(tree, component, tree.components.root));

        for (const part of сПеременными) {
          const адрес = passport.anatomy.build()[part.name]!.attrs;
          const узлы = [
            ...host.querySelectorAll<HTMLElement>(
              `[data-scope="${адрес["data-scope"]}"][data-part="${адрес["data-part"]}"]`,
            ),
          ];

          expect(узлы.length, `узлов части «${part.name}» в сборке нет`).toBeGreaterThan(0);

          for (const variable of part.variables ?? []) {
            // Значение здесь не проверяется намеренно: без раскладки браузер меряет ноль, и
            // требовать числа значило бы требовать того, чего в пробах не бывает. Предмет —
            // НАЛИЧИЕ: исчезнет у поставщика — покраснеет здесь, а не у человека, у которого
            // перестало открываться плавно.
            const несут = узлы.filter((узел) => узел.style.getPropertyValue(variable.name) !== "");

            expect(
              несут.length,
              `переменной «${variable.name}» нет ни на одном узле части «${part.name}»`,
            ).toBeGreaterThan(0);
          }
        }
      });
    },
  );
});

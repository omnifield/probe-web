// ОБРАЗЕЦ КОМПОНЕНТА — дерево его частей, порождённое из паспорта.
//
// Редактору скинов нужно с чего-то начать: чтобы одеть гармошку, надо сперва её собрать — из
// вкладки, заголовка, содержимого. У кнопки это один узел, у таблицы — не один, и без общего
// средства каждый редактор собрал бы скелет по-своему. Разойдясь, два редактора одели бы
// РАЗНЫЕ деревья одного компонента, и оба были бы уверены, что одевают компонент.
//
// ## Порождается из объявленного, а не из представления о компоненте
//
// Состав образца — это `accepts` частей: что паспорт назвал допустимым внутри, то и появляется.
// Своего представления о том, «как выглядит нормальная гармошка», у механики нет и быть не
// должно: это ответ на «что именно собрать», а он не наш.
//
// Отсюда три следствия, каждое проверяется пробой:
//
//   • части, допущенные внутрь, попадают в образец В ПОРЯДКЕ ОБЪЯВЛЕНИЯ — порядок принадлежит
//     паспорту, а не обходу;
//   • содержимое потребителя (`{ kind: "content" }`) в образец НЕ попадает: род говорит, что
//     сюда можно положить текст или значок, но не говорит, что это нужно сделать. Положи
//     механика туда подпись — она решила бы за человека, что у кнопки есть текст;
//   • образец законен по собственным правилам механики: `checkTree` не находит изъянов, а
//     каждый узел допустим внутри своего владельца.

import { partOf } from "./passport-read.js";
import { readAddress, type Registry } from "./registry.js";
import type { AssemblyNode, AssemblyTree, NodeId } from "./tree.js";

/** Как называть узлы образца. */
export interface SketchNaming {
  /** Имя корневого узла. По умолчанию — адрес компонента. */
  readonly id?: NodeId;
  /**
   * Имя узла части. По умолчанию — имя части, а при повторе к нему добавляется число.
   *
   * Свой способ нужен тому, кто кладёт образец в уже существующее дерево: имена там заняты
   * чужими узлами, и разрешать столкновение обязан он, а не механика.
   */
  readonly nameOf?: (part: string, ordinal: number) => NodeId;
}

/**
 * Порождает образец компонента: корневой узел и узлы допущенных внутрь частей, рекурсивно.
 *
 * Рекурсия останавливается на части, уже стоящей НА ПУТИ от корня: часть, допускающая саму себя
 * (прямо или через другую), — законная запись паспорта (вложенное меню, дерево), и спуск по ней
 * не кончился бы никогда. Такая часть попадает в образец одним узлом, дальше не разворачиваясь:
 * глубину выбирает человек, а не механика.
 *
 * @param registry реестр — источник паспортов
 * @param component адрес компонента, чей образец нужен
 * @param naming как называть узлы
 * @returns дерево образца, либо `undefined` — если адрес реестру неизвестен
 */
export function sketchOf(
  registry: Registry,
  component: string,
  naming: SketchNaming = {},
): AssemblyTree | undefined {
  const read = readAddress(registry, component);
  if (!read) return undefined;

  const nodes: Record<NodeId, AssemblyNode> = {};
  const taken = new Set<NodeId>();

  /** Имя, которого ещё нет в образце: способ вызывающего, иначе имя части с числом при повторе. */
  const nameFor = (part: string): NodeId => {
    for (let ordinal = 1; ; ordinal += 1) {
      const name = naming.nameOf
        ? naming.nameOf(part, ordinal)
        : ordinal === 1
          ? part
          : `${part}-${ordinal}`;
      if (!taken.has(name)) {
        taken.add(name);
        return name;
      }
    }
  };

  /**
   * Разворачивает часть в узел и спускается в допущенные внутрь части.
   *
   * @param part имя части
   * @param id имя узла
   * @param parentId владелец узла
   * @param path части, уже стоящие на пути от корня
   */
  const grow = (part: string, id: NodeId, parentId: NodeId | null, path: Set<string>): void => {
    const children: NodeId[] = [];
    nodes[id] = {
      id,
      type: part === read.passport.root ? read.component : `${read.component}.${part}`,
      parentId,
      children,
    };

    const declared = partOf(read.passport, part);
    if (!declared?.accepts) return;

    const inside = new Set(path).add(part);
    for (const admission of declared.accepts) {
      if (admission.kind !== "part") continue;
      if (inside.has(admission.name)) continue;

      const childId = nameFor(admission.name);
      children.push(childId);
      grow(admission.name, childId, id, inside);
    }
  };

  const rootId = naming.id ?? read.component;
  taken.add(rootId);
  grow(read.part, rootId, null, new Set());

  return { components: { root: rootId, nodes } };
}

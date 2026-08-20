// КООРДИНАТА — то, чем узел адресуется у скина, и чем он отличается от самого себя как узла.
//
// Дерево адресует УЗЛЫ: вот этот узел с вот этим именем. Скин адресует КООРДИНАТЫ: все узлы с
// такой частью — во всём приложении. Это не одно и то же, и путать их дорого: редактор, честно
// построенный на адресации узлов, произвёл бы стили экземпляров, а не скин, и приложение стало
// бы набором единожды покрашенных мест, которые ничем не переодеть.
//
// ## Половина координаты, а не вся
//
// Полный адрес правила скина — часть, состояние, вариация, предок. Механика знает ПАСПОРТНУЮ
// половину: компонент и часть. Состояние и вариация в дереве не живут вовсе (их выставляют в
// предпросмотре), предок выводится обратным чтением допуска (`possibleOwnersOf`).
//
// Здесь честно отдаётся то, что механика действительно знает, и не изображается то, чего она
// знать не может. Скин достроит остальное — он для этого и читает паспорт своим читателем.
//
// ## Зачем перечислять узлы одной координаты
//
// У гармошки три вкладки — три УЗЛА одной части и одна координата. Человек красит одну — вид
// получат все три. Механика этого не запрещает (запрещать нечего: так и устроен скин), но
// обязана ПОКАЗАТЬ: иначе человек узнаёт о связи, когда покрасил одну вкладку и удивился двум
// остальным.

import { readAddress, type Registry } from "./registry.js";
import { type AssemblyTree, type NodeId } from "./tree.js";

/** Паспортная половина координаты: компонент и его часть. */
export interface Coordinate {
  /** Адрес компонента в реестре. */
  readonly component: string;
  /** Часть компонента — та, что уедет в адрес правила скина. */
  readonly part: string;
  /**
   * Нормализованный адрес координаты.
   *
   * Совпадает с адресом узла с точностью до записи корневой части: `button` и `button.root` —
   * одна координата, и здесь она названа одним способом. Ключом группировки может быть только
   * такая запись: иначе два узла, записанные по-разному, разъехались бы по разным координатам,
   * будучи одним и тем же местом.
   */
  readonly address: string;
}

/**
 * Координата узла по его адресу, либо `undefined` — если адрес реестру неизвестен.
 *
 * @param registry реестр
 * @param type адрес узла
 */
export function coordinateOf(registry: Registry, type: string): Coordinate | undefined {
  const read = readAddress(registry, type);
  if (!read) return undefined;

  return { component: read.component, part: read.part, address: read.address };
}

/**
 * Узлы дерева, разложенные по координатам: адрес координаты → имена узлов в порядке карты.
 *
 * Узлы с неизвестным реестру адресом сюда не попадают: координаты у них нет, и выдумать её
 * нечем. Их видно другим средством — отрисовка даёт им явный запасной вид, а `checkTree`
 * говорит о дереве.
 *
 * @param tree дерево
 * @param registry реестр
 */
export function nodesByCoordinate(
  tree: AssemblyTree,
  registry: Registry,
): Map<string, NodeId[]> {
  const groups = new Map<string, NodeId[]>();

  for (const [id, node] of Object.entries(tree.components.nodes)) {
    const coordinate = coordinateOf(registry, node.type);
    if (!coordinate) continue;

    const kin = groups.get(coordinate.address);
    if (kin) kin.push(id);
    else groups.set(coordinate.address, [id]);
  }

  return groups;
}

/**
 * ДРУГИЕ узлы, которые оденутся вместе с этим, — те же координаты, иное имя.
 *
 * Пустой ответ значит «этот узел в дереве единственный со своей координатой», а `undefined` —
 * «узла нет или его адрес неизвестен». Разница существенна: первое показывают человеку как
 * «правка коснётся только этого места», второе — как ошибку адреса.
 *
 * @param tree дерево
 * @param registry реестр
 * @param nodeId узел, о котором спрашивают
 */
export function nodesSharingCoordinate(
  tree: AssemblyTree,
  registry: Registry,
  nodeId: NodeId,
): NodeId[] | undefined {
  const node = tree.components.nodes[nodeId];
  if (!node) return undefined;

  const coordinate = coordinateOf(registry, node.type);
  if (!coordinate) return undefined;

  return (nodesByCoordinate(tree, registry).get(coordinate.address) ?? []).filter(
    (kin) => kin !== nodeId,
  );
}

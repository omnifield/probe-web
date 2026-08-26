// КАРТОЧКА СЛУЧАЯ — компонент в условии, нарисованный МЕХАНИКОЙ.
//
// Отрисовка — тот же `RenderTree`, которым рисует потребитель. Второго способа превратить дерево
// в вид не существует, и именно поэтому витрина отвечает за то, что увидит человек.
//
// ШИРИНУ КАРТОЧКА РЕШАЕТ САМА, измерением. Ни паспорт, ни наш список «крупных компонентов» этого
// не решают: паспорт про вид не говорит, а список устарел бы на первом же новом компоненте.
// Содержимое шире порога — карточка занимает всю строку, и кнопка с диалогом живут в одном
// потоке, не подгоняя его друг под друга.

import { RenderTree } from "@omnifield/probe-web-assembly";
import { createSignal, onCleanup, onMount, Show } from "solid-js";

import type { ShowcaseCase } from "./cases.js";
import { REGISTRY } from "./registry.js";

/** Порог, за которым карточка перестаёт делить строку с соседями. */
const WIDE_AT = 380;

export function Case(props: { item: ShowcaseCase }) {
  const [wide, setWide] = createSignal(false);
  let stage!: HTMLDivElement;

  onMount(() => {
    const measure = () => setWide(stage.scrollWidth > WIDE_AT);

    measure();

    // Среда без наблюдателя размеров (jsdom в пробах) меряет один раз и живёт дальше: ширина
    // карточки — украшение показа, и ронять из-за неё весь показ нечестно.
    if (typeof ResizeObserver !== "function") return;

    // Пересчитываем на смену скина и шрифтов: одетый компонент шире голого, и «широкий» — это
    // свойство того, что показано сейчас, а не того, что показали в первый кадр.
    const watcher = new ResizeObserver(measure);
    watcher.observe(stage);
    onCleanup(() => watcher.disconnect());
  });

  // ОПИСАНИЕ СВЕРХУ, КОМПОНЕНТ НИЖЕ (решение user 2026-08-23): человек сперва читает, на что
  // смотрит, и уже потом смотрит. Обратный порядок заставлял угадывать, что за карточка перед
  // ним, и искать подпись под ней.
  return (
    <figure class="case" classList={{ "case--wide": wide() }}>
      <figcaption class="case__caption">
        <b class="case__title">{props.item.title}</b>

        <Show when={props.item.at.state !== null}>
          <span class="case__state">{props.item.at.state}</span>
        </Show>
      </figcaption>

      <div class="case__stage" ref={stage}>
        <RenderTree tree={props.item.tree} registry={REGISTRY} />
      </div>
    </figure>
  );
}

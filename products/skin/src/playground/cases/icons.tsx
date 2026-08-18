// ЗНАЧКИ на стенде.
//
// Показывать тут надо не «сорок шесть картинок», а три утверждения, которые иначе приходится
// проверять на слово: значок следует за кеглем, берёт роль у места установки и добавляется своим
// одной строкой. Поэтому кейсы устроены как доказательства, а не как каталог.
//
// Ядро всё равно показано целиком — набор это публичная поверхность, и увидеть его глазами надо
// до того, как имя уедет в чужую разметку.

import { Button, Field, Input, Label } from "@omnifield/probe-web-ui";
import { For } from "solid-js";

import { CORE } from "../../icons/core.js";
import type { Specimen } from "./model.js";

/** Значок с подписью-именем — то, что уедет в `data-icon`. */
function Named(props: { name: string; why: string }) {
  return (
    <span class="icon-cell" title={props.why}>
      <span data-icon={props.name} aria-hidden="true" />
      <code>{props.name}</code>
    </span>
  );
}

export const ICON_SPECIMENS: Specimen[] = [
  {
    id: "icons",
    title: "Значки",
    group: "Структура",
    slots: ["data-icon"],
    cases: [
      {
        // ПЕРВЫЙ кейс попадает на витрину «Всё», поэтому он маленький: сорок шесть значков там
        // заняли бы весь экран и вытеснили остальные семейства. Плитка 2×2 показывает механику
        // (значок, имя, размер, цвет), а весь набор смотрят на странице семейства.
        id: "basic",
        title: "Базовые",
        note: "Значок это CSS-маска: размер `1em`, цвет `currentColor`. Весь набор — в кейсе ниже.",
        render: () => (
          <div class="icon-tiles">
            <Named name="check" why="выбрано" />
            <Named name="search" why="поиск" />
            <Named name="trash-2" why="удаление" />
            <Named name="chevron-down" why="раскрыть" />
          </div>
        ),
      },
      {
        id: "core",
        title: "Ядро набора",
        note: "Сорок шесть значков, каждый с причиной, по которой он в ядре — наведите на имя. Источник — Lucide (ISC); значок это CSS-маска, а не компонент: в поставке зоны JS нет.",
        render: () => (
          <div class="icon-grid">
            <For each={CORE}>{(icon) => <Named name={icon.name} why={icon.why} />}</For>
          </div>
        ),
      },
      {
        id: "size",
        title: "Размер приходит от кегля",
        note: "Значок ровно `1em`, поэтому он следует за кеглем контрола сам. Ни одного правила «в мелкой кнопке значок мельче» в оформлении нет и не нужно.",
        render: () => (
          <div class="case__row">
            <Button data-size="sm">
              <span data-icon="trash-2" aria-hidden="true" />
              мелкая
            </Button>
            <Button>
              <span data-icon="trash-2" aria-hidden="true" />
              обычная
            </Button>
            <Button data-size="lg">
              <span data-icon="trash-2" aria-hidden="true" />
              крупная
            </Button>
          </div>
        ),
      },
      {
        id: "color",
        title: "Цвет приходит от места установки",
        note: "Значок красится `currentColor`, то есть берёт роль у того, внутри чего стоит: на сплошной кнопке — подпись на акценте, в опасном варианте — опасный, в приглушённом тексте — приглушённый.",
        render: () => (
          <div class="case__stack">
            <div class="case__row">
              <Button>
                <span data-icon="check" aria-hidden="true" />
                сохранить
              </Button>
              <Button data-variant="outline">
                <span data-icon="x" aria-hidden="true" />
                отмена
              </Button>
              <Button data-variant="danger">
                <span data-icon="trash-2" aria-hidden="true" />
                удалить
              </Button>
              <Button data-variant="ghost" aria-label="прочие действия">
                <span data-icon="ellipsis" aria-hidden="true" />
              </Button>
            </div>
            <p class="case__note">
              <span data-icon="info" aria-hidden="true" /> в приглушённом тексте значок приглушён
              вместе с ним — это одно и то же значение роли
            </p>
          </div>
        ),
      },
      {
        id: "in-field",
        title: "Значок внутри поля",
        note: "Тот же значок в подписи поля и в кнопке рядом. Выравнивание по строке задано один раз в общем правиле — оптическая посадка `-0.125em`, иначе значок сидит на базовой линии и выглядит приподнятым.",
        render: () => (
          <div class="case__row">
            <Field>
              <Label>
                <span data-icon="search" aria-hidden="true" /> поиск по названию
              </Label>
              <Input placeholder="например: продажи" />
            </Field>
            <Button data-variant="soft">
              <span data-icon="filter" aria-hidden="true" />
              отбор
            </Button>
          </div>
        ),
      },
      {
        id: "own",
        title: "Своя иконка — одна строка",
        note: "Слева встроенный значок, справа свой: правило `[data-icon=\"своя-метка\"] { --icon: … }` объявлено в стенде, а не в поставке. Своя иконка слушается тех же размеров и ролей — механика её не отличает.",
        render: () => (
          <div class="case__row">
            <Button data-variant="soft">
              <span data-icon="star" aria-hidden="true" />
              встроенная
            </Button>
            <Button data-variant="soft">
              <span data-icon="своя-метка" aria-hidden="true" />
              своя
            </Button>
            <Button data-size="lg" data-variant="outline">
              <span data-icon="своя-метка" aria-hidden="true" />
              и она же крупнее
            </Button>
            <span class="case__note">
              <span data-icon="неизвестное-имя" aria-hidden="true" /> неизвестное имя не рисует
              ничего — пустая маска вместо закрашенного квадрата
            </span>
          </div>
        ),
      },
    ],
  },
];

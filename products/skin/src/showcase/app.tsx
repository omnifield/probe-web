// ВИТРИНА — раскладка. Что показывается, откуда берётся и как называется.
//
// ДВЕ КОЛОНКИ (`PWEB-31`, первая волна):
//
//   ┌──────────────┬────────────────────────────────────┐
//   │ компоненты   │ страница компонента                │
//   │ из реестра   │ случаи сеткой, каждый подписан     │
//   └──────────────┴────────────────────────────────────┘
//
// Третьей колонки — панели правки — здесь НЕТ и в этой волне не будет: витрина показывает,
// редактор правит, и это разные вещи (страница раздела «Устройство продукта»). Так же
// разложено у Storybook: перечень, холст и панели — разные области, а выбор темы живёт вообще
// не там, где правка.
//
// ЧЕГО ЗДЕСЬ НЕТ ЕЩЁ:
//   • выбора скина — скин появится следующим шагом, сейчас витрина показывает ГОЛЫЙ кит;
//   • вариаций — их имена принадлежат скину, а не паспорту: нет скина — называть нечего.
//
// Оба пробела названы на экране вслух. Пустое место, о котором не сказано, читается как
// поломка; названное — как состояние работы.

import { knownComponents, RenderTree } from "@omnifield/probe-web-assembly";
import { passportOf } from "@omnifield/probe-web-ui/passport";
import { createSignal, For, Show } from "solid-js";

import { CASES, type ShowcaseCase } from "./cases.js";
import { REGISTRY } from "./registry.js";

/** Адреса компонентов, которые витрина знает. Перечень приходит ИЗ РЕЕСТРА, своего нет. */
const COMPONENTS = knownComponents(REGISTRY);

/**
 * Один случай: подпись, пояснение и сам компонент, нарисованный МЕХАНИКОЙ.
 *
 * Отрисовка — тот же `RenderTree`, которым рисует потребитель. Второго способа превратить
 * дерево в вид не существует, и именно поэтому витрина отвечает за то, что увидит человек.
 */
function Case(props: { item: ShowcaseCase }) {
  return (
    <figure class="case">
      <div class="case__stage">
        <RenderTree tree={props.item.tree} registry={REGISTRY} />
      </div>
      <figcaption class="case__caption">
        <b class="case__title">{props.item.title}</b>
        <span class="case__note">{props.item.note}</span>
      </figcaption>
    </figure>
  );
}

/** Части компонента — из анатомии, а не из нашего представления о нём. */
function Parts(props: { component: string }) {
  const passport = () => passportOf(props.component);

  return (
    <Show when={passport()}>
      {(found) => (
        <ul class="parts">
          <For each={found().parts}>
            {(part) => (
              <li class="parts__item">
                <code class="parts__name">{part.name}</code>
                <span class="parts__means">{part.means}</span>
                <span class="parts__states">
                  {part.states.map((state) => state.name).join(" · ")}
                </span>
              </li>
            )}
          </For>
        </ul>
      )}
    </Show>
  );
}

/** Страница компонента: что он объявил о себе и как держится в случаях. */
function ComponentPage(props: { component: string }) {
  const cases = () => CASES[props.component] ?? [];

  return (
    <article class="page">
      <header class="page__head">
        <h1 class="page__title">{props.component}</h1>
        <p class="page__lead">
          Части и состояния — из паспорта компонента. Случаи собраны из образца и нарисованы
          механикой сборки.
        </p>
      </header>

      <section class="page__section">
        <h2 class="page__subtitle">Части и состояния</h2>
        <Parts component={props.component} />
      </section>

      <section class="page__section">
        <h2 class="page__subtitle">Случаи</h2>
        <div class="cases">
          <For each={cases()}>{(item) => <Case item={item} />}</For>
        </div>
      </section>
    </article>
  );
}

export function App() {
  const [current, setCurrent] = createSignal(COMPONENTS[0] ?? "");

  return (
    <div class="shell">
      <aside class="rail">
        <div class="rail__head">
          <b class="rail__title">Витрина</b>
          <span class="rail__note">перечень — из реестра паспортов</span>
        </div>
        <nav class="rail__list">
          <For each={COMPONENTS}>
            {(component) => (
              <button
                class="rail__item"
                type="button"
                aria-current={component === current() ? "true" : undefined}
                onClick={() => setCurrent(component)}
              >
                {component}
              </button>
            )}
          </For>
        </nav>
        <p class="rail__state">
          Скин не надет — кит показан голым. Это рабочее состояние продукта, а не поломка
          витрины.
        </p>
      </aside>

      <main class="main">
        <Show when={current()} fallback={<p class="empty">В реестре нет ни одного компонента.</p>}>
          {(component) => <ComponentPage component={component()} />}
        </Show>
      </main>
    </div>
  );
}

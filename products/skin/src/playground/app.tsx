// Стенд зоны `skin`. Показывает ОДНО утверждение, и оно же — первое правило зоны:
// **оформление подключается отдельно и снимается отдельно, кит без него остаётся голым.**
//
// Поэтому здесь два переключателя, и оба честные:
//
//   1. «Оформление» — подключает и снимает НАШ CSS на живую. Ничего не подменяется и не
//      перекрашивается: снятие удаляет тот же текст, который добавило подключение.
//   2. «Тема» — переключает класс `dark` на `<html>`, ровно как это делает потребитель.
//      Оформление не знает о теме ничего: все значения взяты токенами, и пара меняет их сама.
//
// Почему CSS подключается строкой, а не импортом файла. У потребителя форма другая — обычный
// `import "@probe-web/skin/skin.css"`, один раз на бутстрапе. Импорт снять на живую нельзя, а
// стенд обязан показать именно снятие; поэтому здесь тот же текст берётся `?inline` и
// вставляется тегом. Форма поставки от этого не меняется — меняется способ показа.

import { Button, Field, FieldDescription, FieldError, Input, Label, Textarea } from "@omnifield/probe-web-ui";
import { createSignal, onCleanup, Show } from "solid-js";

// `?inline` — Vite отдаёт содержимое файла строкой и НЕ подключает его к странице сам.
import skinCss from "../skin/skin.css?inline";

const STYLE_ID = "probe-web-skin";

/** Ставит и снимает оформление тем же тегом: снятие обязано возвращать ровно исходный кит. */
function useSkin() {
  const [dressed, setDressed] = createSignal(false);

  const apply = (on: boolean) => {
    const existing = document.getElementById(STYLE_ID);
    if (on) {
      if (existing) return;
      const el = document.createElement("style");
      el.id = STYLE_ID;
      el.textContent = skinCss;
      document.head.appendChild(el);
    } else {
      existing?.remove();
    }
  };

  const toggle = () => {
    const next = !dressed();
    setDressed(next);
    apply(next);
  };

  // Стенд живёт в одной вкладке с горячей перезагрузкой: тег обязан уйти вместе с площадкой,
  // иначе после правки их станет два.
  onCleanup(() => document.getElementById(STYLE_ID)?.remove());

  return { dressed, toggle };
}

/** Тема — класс `dark` на `<html>`, как у потребителя. Оформление про неё не знает. */
function useMode() {
  const root = document.documentElement;
  const [dark, setDark] = createSignal(root.classList.contains("dark"));

  const toggle = () => {
    const next = !dark();
    setDark(next);
    root.classList.toggle("dark", next);
  };

  return { dark, toggle };
}

export function App() {
  const skin = useSkin();
  const mode = useMode();

  return (
    <div class="page">
      <header class="page__head">
        <h1>Стенд зоны skin</h1>
        <p class="page__lead">
          Кит <code>ui</code> безголовый: без оформления это голые примитивы с зацепками{" "}
          <code>data-slot</code>. Оформление приезжает отдельным CSS и снимается отдельно —
          проверьте обоими переключателями.
        </p>

        <div class="page__controls">
          {/* Кнопки стенда — НЕ из кита: иначе, сняв оформление, вы потеряете и управление
              стендом. Это оснастка площадки, у неё свой класс и своё оформление. */}
          <button class="control" type="button" onClick={skin.toggle}>
            Оформление: <b>{skin.dressed() ? "подключено" : "снято"}</b>
          </button>
          <button class="control" type="button" onClick={mode.toggle}>
            Тема: <b>{mode.dark() ? "тёмная" : "светлая"}</b>
          </button>
        </div>

        <Show when={!skin.dressed()}>
          <p class="page__note">
            Сейчас оформления нет — и это рабочее состояние кита, а не поломка.
          </p>
        </Show>
      </header>

      <section class="stand">
        <h2>Кнопка</h2>
        <div class="stand__row">
          <Button>Обычная</Button>
          <Button disabled>Отключена</Button>
        </div>
      </section>

      <section class="stand">
        <h2>Поле</h2>

        <div class="stand__row stand__row--stack">
          <Field>
            <Label>Имя набора</Label>
            <Input placeholder="например, продажи за квартал" />
            <FieldDescription>Короткое имя, по которому набор будет виден в списке.</FieldDescription>
          </Field>

          <Field validationState="invalid">
            <Label>Адрес службы</Label>
            <Input value="ht!tp://" />
            <FieldError>Адрес не разобран — проверьте схему.</FieldError>
          </Field>

          <Field>
            <Label>Заметка</Label>
            <Textarea placeholder="необязательно" />
          </Field>

          <Field disabled>
            <Label>Ключ доступа</Label>
            <Input value="выдаётся администратором" />
          </Field>
        </div>
      </section>
    </div>
  );
}

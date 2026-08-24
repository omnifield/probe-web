// Экран эталонного приложения — ГЕЙТ, а не витрина (`PROBEWEB-14`).
//
// Один маленький сценарий («заявка»), но проходящий сквозь всю цепочку зон: ввод меняет
// состояние, состояние меняет разметку и класс, разметка держится на зацепках `data-slot`, а
// класс собирается `createStyle` из поставки инструментов. Каждая строка здесь стоит потому,
// что через неё проходит шов, — украшений в файле нет.
//
// Экран намеренно ОДИН. Полигон, выросший в приложение, перестаёт быть полигоном: за ним
// начинают ухаживать вместо того, чтобы им проверять.

// Из ящика инструментов приезжает механика сборки класса, и только она (`PWEB-3`).
// Инструменты необязательны, и приложение берёт их ОТДЕЛЬНЫМ решением — эта поставка
// объявлена в манифесте сама по себе, а не приезжает следом за набором значений.
//
// Из набора значений сюда не приезжает НИЧЕГО (`PWEB-52`): контроллер темы отсюда ушёл вместе
// с переключателем режима — режим стал половиной скина, а скина у эталона нет. Значения зона
// по-прежнему объявляет в манифесте: оттуда приезжает базовый слой CSS (`src/main.tsx`).
import { createStyle, cva } from "@omnifield/probe-web-style-tools";
import {
  Button,
  Field,
  FieldDescription,
  FieldError,
  Input,
  Label,
  Select,
  SelectContent,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemLabel,
  SelectListbox,
  SelectPortal,
  SelectTrigger,
  SelectValue,
  Separator,
  Slot,
  Spinner,
  Textarea,
  Toggle,
} from "@omnifield/probe-web-ui";
import { createMemo, createSignal, Show } from "solid-js";

import { trace } from "./trace";

/** Что уходит «на отправку». Форма данных приложения, к поверхности зон отношения не имеет. */
export interface Order {
  mail: string;
  city: string | null;
  comment: string;
  urgent: boolean;
}

const CITIES = ["Москва", "Казань", "Новосибирск"];

/** Достаточная проверка адреса для полигона: есть имя, собака, домен с точкой. */
const MAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Варианты кнопки отправки — ВТОРОЙ путь стилизации безголового кита, из JS.
 *
 * Первый (зацепки `[data-slot]`) живёт в `app.css` и одевает примитивы разом. Этот нужен
 * там, где класс зависит от состояния: `createStyle` читает пропсы ВНУТРИ мемо, поэтому
 * класс пересчитывается при смене варианта, а не застывает на значении момента вызова.
 * Оба пути показаны намеренно — потребитель, увидевший только один, второй не найдёт.
 */
const submitStyle = cva("app-submit", {
  variants: {
    tone: {
      active: "app-submit--active",
      waiting: "app-submit--waiting",
    },
  },
  defaultVariants: { tone: "active" },
});

/** Отправка по умолчанию: отправлять некуда, поэтому просто ждём. */
function pretendSend(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 400));
}

export interface AppProps {
  /**
   * Чем «отправляется» заявка. Дефолт — задержка; тест подставляет свою и потому не ждёт
   * таймера. Инъекция здесь, а не мок таймеров в тесте: приложение — гейт, и «ожидание»
   * это его единственная асинхронная часть, которую тест обязан контролировать явно.
   */
  send?: (order: Order) => Promise<void>;
}

export function App(props: AppProps) {
  // Замер настройки экрана. Каналы всех зон включаются одинаково и независимо, поэтому три
  // флага сразу дают ОДНУ ленту — от `mount()` рантайма до жизни каждого примитива.
  const settled = trace("app.setup");

  const [mail, setMail] = createSignal("");
  const [city, setCity] = createSignal<string | null>(null);
  const [comment, setComment] = createSignal("");
  const [urgent, setUrgent] = createSignal(false);
  const [sending, setSending] = createSignal(false);
  const [sent, setSent] = createSignal<Order | null>(null);

  const mailValid = createMemo(() => MAIL.test(mail()));
  // Пустое поле не ругается: ошибка — реакция на ВВОД, а не приветствие.
  const mailState = createMemo<"valid" | "invalid">(() =>
    mail() === "" || mailValid() ? "valid" : "invalid",
  );
  const canSend = createMemo(() => mailValid() && !sending());

  const submitClass = createStyle(submitStyle, {
    // Геттер, а не значение: без него вариант прочитался бы один раз при создании мемо и
    // кнопка навсегда осталась бы в стартовом состоянии.
    get tone(): "active" | "waiting" {
      return sending() ? "waiting" : "active";
    },
  });

  async function submit(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    if (!canSend()) return;

    const order: Order = {
      mail: mail(),
      city: city(),
      comment: comment(),
      urgent: urgent(),
    };
    const send = props.send ?? pretendSend;

    const measured = trace("app.submit");
    setSending(true);
    setSent(null);
    try {
      await send(order);
      setSent(order);
    } finally {
      setSending(false);
      measured();
    }
  }

  settled();
  return (
    <Slot as="main" class="app">
      <header class="app__head">
        <h1>probe-web reference</h1>
        {/* Переключатель держит признак ЗАЯВКИ, а не режим документа (`PWEB-52`). Режим
            принадлежит скину, скина у эталона нет — переключать было бы нечего, и ручка,
            которая заведомо ничего не делает, гейтом быть перестаёт. Шов при этом остался
            тем же: примитив из `ui` объявляет нажатое состояние атрибутом, а состояние
            приложения доезжает до заявки. */}
        <Toggle pressed={urgent()} onChange={setUrgent} aria-label="Срочная заявка">
          {urgent() ? "Срочно" : "Обычно"}
        </Toggle>
      </header>

      <Separator />

      <Slot as="form" class="app__form" onSubmit={(event: SubmitEvent) => void submit(event)}>
        <Field value={mail()} onChange={setMail} validationState={mailState()} required>
          <Label>Почта</Label>
          <Input type="email" placeholder="me@example.com" />
          <FieldDescription>Куда ответить по заявке</FieldDescription>
          {/* Узел появляется в документе только при `validationState="invalid"` — это
              механика kobalte, а не наша ветка `Show`. */}
          <FieldError>Не похоже на адрес</FieldError>
        </Field>

        <Select<string>
          options={CITIES}
          value={city()}
          onChange={setCity}
          placeholder="Город"
          itemComponent={(item) => (
            <SelectItem item={item.item}>
              <SelectItemLabel>{item.item.rawValue}</SelectItemLabel>
              <SelectItemIndicator>✓</SelectItemIndicator>
            </SelectItem>
          )}
        >
          <SelectTrigger aria-label="Город">
            <SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
            <SelectIcon>▾</SelectIcon>
          </SelectTrigger>
          <SelectPortal>
            <SelectContent>
              <SelectListbox />
            </SelectContent>
          </SelectPortal>
        </Select>

        <Field value={comment()} onChange={setComment}>
          <Label>Комментарий</Label>
          <Textarea rows={3} />
          <FieldDescription>Необязательно</FieldDescription>
        </Field>

        {/* `type="submit"` стоит явно: kobalte по умолчанию ставит кнопке `type="button"`,
            чтобы она не отправляла форму случайно. Отправляющая кнопка объявляется руками. */}
        <Button
          type="submit"
          class={submitClass()}
          disabled={!canSend()}
          aria-busy={sending() ? "true" : undefined}
        >
          <Show when={sending()}>
            <Spinner aria-label="Отправляем" />
          </Show>
          {sending() ? "Отправляем" : "Отправить"}
        </Button>
      </Slot>

      <Show when={sent()}>
        {(order) => (
          <p class="app__done" role="status">
            Заявка с адреса {order().mail} отправлена
          </p>
        )}
      </Show>
    </Slot>
  );
}

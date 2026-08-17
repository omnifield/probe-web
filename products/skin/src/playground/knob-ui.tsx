// Управление панели — НА НАШИХ ЖЕ КОМПОНЕНТАХ.
//
// Решение user 2026-08-17: пояснения убрать в подсказку (появляется при наведении на заголовок и
// не занимает места), а выбор из более чем двух-трёх вариантов делать списком, потому что
// вариантов будет больше и ряды кнопок съедают панель.
//
// Побочная выгода, ради которой это стоило делать и без просьбы: стенд начинает ЕСТЬ СВОЙ КОРМ.
// Подсказка и список выбора здесь — те самые примитивы, которые зона одевает; если у них криво
// с раскладкой в узкой колонке или с длинным значением, я узнаю об этом первым, а не от
// потребителя.
//
// ЦЕНА, названная прямо: при снятом оформлении панель становится голой — она сделана теми же
// компонентами, что и образцы. Управление при этом РАБОТАЕТ (поведение у кита своё, вида оно не
// требует), и это честнее, чем держать для панели вторую копию оформления: копия разошлась бы с
// поставкой на первой же правке.

import {
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
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@omnifield/probe-web-ui";
import { Show } from "solid-js";

export interface Option {
  id: string;
  label: string;
}

/**
 * Заголовок раздела панели. Пояснение живёт в подсказке: оно нужно раз в жизни, а место занимало
 * постоянно.
 */
export function KnobLabel(props: { text: string; hint?: string }) {
  return (
    <Show when={props.hint} fallback={<span class="rail__label">{props.text}</span>}>
      <Tooltip openDelay={200} placement="right">
        <TooltipTrigger as="span" class="rail__label rail__label--help">
          {props.text}
          <span class="rail__help" data-icon="info" aria-hidden="true" />
        </TooltipTrigger>
        <TooltipPortal>
          <TooltipContent>
            <TooltipArrow />
            {props.hint}
          </TooltipContent>
        </TooltipPortal>
      </Tooltip>
    </Show>
  );
}

/**
 * Выбор одного из нескольких — списком, а не рядом кнопок.
 *
 * Порог назвал user: больше двух-трёх вариантов. Ниже порога ряд кнопок читается быстрее (обе
 * возможности видны сразу), выше — список выигрывает, потому что панель не растёт вместе с
 * числом вариантов.
 */
export function KnobSelect(props: {
  label: string;
  hint?: string;
  options: readonly Option[];
  value: string;
  onChange: (id: string) => void;
}) {
  const ids = () => props.options.map((o) => o.id);
  const labelOf = (id: string | null) =>
    props.options.find((o) => o.id === id)?.label ?? "";

  return (
    <div class="knob">
      <KnobLabel text={props.label} hint={props.hint} />
      {/* СПИСОК НЕ ЗАКРЫВАЕТСЯ ПОСЛЕ ВЫБОРА (решение user 2026-08-17): здесь варианты
          ПЕРЕБИРАЮТ — смотрят, как меняется вид, и пробуют следующий; закрытие после каждого
          выбора заставляло открывать список заново на каждую пробу.

          Делается ПРОПОМ кита (`closeOnSelection`), а не своим состоянием открытости. Первая
          редакция держала `open` сама и возвращала его в `true` из `onChange` — не работало:
          компонент присылает закрытие ПОСЛЕ выбора и перебивает нашу правку. Проп существует
          ровно для этого, и он у kobalte объявлен. */}
      <Select
        closeOnSelection={false}
        value={props.value}
        onChange={(id) => id !== null && props.onChange(id)}
        options={ids()}
        disallowEmptySelection
        itemComponent={(itemProps) => (
          <SelectItem item={itemProps.item}>
            <SelectItemLabel>{labelOf(itemProps.item.rawValue)}</SelectItemLabel>
            {/* Отметка выбранного обязательна: без неё в открытом списке не видно, что стоит
                сейчас, — подсветка показывает лишь то, на чём курсор или клавиатура. */}
            <SelectItemIndicator />
          </SelectItem>
        )}
      >
        <SelectTrigger aria-label={props.label}>
          <SelectValue<string>>{(state) => labelOf(state.selectedOption())}</SelectValue>
          <SelectIcon />
        </SelectTrigger>
        <SelectPortal>
          <SelectContent>
            <SelectListbox />
          </SelectContent>
        </SelectPortal>
      </Select>
    </div>
  );
}

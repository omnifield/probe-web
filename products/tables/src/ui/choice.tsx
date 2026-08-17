// ВЫБОР ИЗ СПИСКА и ГАЛКА — на примитивах кита, одной обёрткой на всю зону.
//
// ## Почему не нативные `<select>` и `<input type=checkbox>`
//
// Нативный список одеть НЕЛЬЗЯ: панель рисует браузер, и в одетом приложении она видна сразу
// как чужая — другой шрифт, другие отступы, другое поведение на телефоне. Обойти это правилами
// вида `select[data-slot^="…"]` нельзя, и не нужно: у кита есть примитив, который делает
// панель разметкой (заявка owner-skin 2026-08-17).
//
// Нативные `<button>` в таблице при этом ОСТАЮТСЯ нативными, и это не непоследовательность:
// сортировке в шапке, листанию и раскрытию группы вид даёт их собственная зацепка, а не
// «кнопка». Заголовок-сортировка не должен выглядеть кнопкой.
//
// ## Почему обёртка, а не композиция на месте
//
// Список у кита — шесть частей (корень, триггер, значение, портал, панель, перечень) плюс
// отрисовка пункта. Десять мест в зоне, где нужен выбор, повторяли бы эти шесть частей
// десятью способами, и разъехались бы они на первой правке. Обёртка держит форму одной, а
// наружу отдаёт то, ради чего вызывают: что выбрано и из чего выбирать.
//
// ## Зацепки
//
// Наше имя встаёт РЯДОМ с именем кита (`data-slot="select filter-condition-field"`), а не
// вместо него: перекрыв чужое имя, узел теряет оформление кита и остаётся с браузерным
// умолчанием. Части списка (триггер, панель, пункт) несут имена КИТА и одеваются его
// правилами — своих имён мы им не даём намеренно: это его предмет, а не наш.

import {
  Checkbox,
  CheckboxControl,
  CheckboxIndicator,
  CheckboxInput,
  CheckboxLabel,
  Select,
  SelectContent,
  SelectItem,
  SelectItemLabel,
  SelectListbox,
  SelectPortal,
  SelectTrigger,
  SelectValue,
} from "@omnifield/probe-web-ui";
import { Show } from "solid-js";

/** Строка списка: что уедет в состояние и что увидит человек. */
export interface ChoiceOption {
  value: string;
  label: string;
}

export interface ChoiceProps {
  /**
   * НАШЕ имя зацепки — то, под которым эту часть знает обещание зоны. Имя кита обёртка
   * добавляет сама, поэтому передавать его не надо и нельзя забыть.
   */
  slot: string;
  value: string;
  options: readonly ChoiceOption[];
  onChange: (value: string) => void;
  /** Подпись для вспомогательной технологии: у списка своего заголовка нет. */
  label: string;
  /** Что показать, пока не выбрано. */
  placeholder?: string;
}

export function Choice(props: ChoiceProps) {
  const options = () => [...props.options];
  const selected = () => props.options.find((option) => option.value === props.value);

  return (
    <Select<ChoiceOption>
      data-slot={`select ${props.slot}`}
      options={options()}
      optionValue="value"
      optionTextValue="label"
      value={selected()}
      onChange={(option) => {
        // `null` приходит при снятии выбора. Наружу отдаём только настоящий выбор: значение
        // «ничего» у нас всегда есть в списке явной строкой, и подменять его пустотой значило
        // бы завести второй способ сказать одно и то же.
        if (option) props.onChange(option.value);
      }}
      itemComponent={(item) => (
        <SelectItem item={item.item}>
          <SelectItemLabel>{item.item.rawValue.label}</SelectItemLabel>
        </SelectItem>
      )}
    >
      <SelectTrigger aria-label={props.label}>
        <SelectValue<ChoiceOption>>
          {(state) => state.selectedOption()?.label ?? props.placeholder ?? ""}
        </SelectValue>
      </SelectTrigger>
      <SelectPortal>
        <SelectContent>
          <SelectListbox />
        </SelectContent>
      </SelectPortal>
    </Select>
  );
}

export interface TickProps {
  /** Наше имя зацепки; имя кита обёртка добавляет сама. */
  slot: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** Выключена — переключить нельзя. Состояние кит отдаёт атрибутом `data-disabled`. */
  disabled?: boolean;
  /** Показывать подпись рядом с галкой или держать её только для вспомогательной технологии. */
  children?: string;
}

/**
 * Галка.
 *
 * Настоящий `<input type="checkbox">` внутри остаётся — его прячут оформлением, а не
 * отсутствием: убрать ввод и рисовать `<div role="checkbox">` значит переписать доступность
 * руками. Это решение кита, и мы его наследуем, а не переигрываем.
 */
export function Tick(props: TickProps) {
  return (
    <Checkbox
      data-slot={`checkbox ${props.slot}`}
      checked={props.checked}
      onChange={props.onChange}
      disabled={props.disabled}
      aria-label={props.label}
    >
      <CheckboxInput />
      <CheckboxControl>
        <CheckboxIndicator />
      </CheckboxControl>
      {/* Подпись — `CheckboxLabel` кита, а не свой `span`: она СВЯЗАНА с вводом, и щелчок по
          ней переключает галку. Свой узел выглядел бы так же и не работал. */}
      <Show when={props.children}>{(text) => <CheckboxLabel>{text()}</CheckboxLabel>}</Show>
    </Checkbox>
  );
}

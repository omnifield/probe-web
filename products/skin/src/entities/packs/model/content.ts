// ЗАГОТОВКИ ИЗ КОРОБКИ (PWEB-187/190) — содержимое, а не механизм: РЕШЕНИЕ, какие темы
// показывать, живёт в продукте, не во фреймворке (`packages/io` несёт только пустой реестр,
// `createPackRegistry`, и подбор, `compatibleItems`, — «средство, а не решение», его же
// README). Faker — тоже зависимость ЭТОГО продукта, не `packages/io`: пакет-механизм не должен
// тащить faker транзитивно в каждого, кому заготовки не нужны вовсе (найдено user, 2026-08-29).
//
// Содержимое ГЕНЕРИРУЕТ `@faker-js/faker` (9.9M скачиваний/неделю, стандарт индустрии), не
// пишем тексты руками: темы — это его же модули (`hacker` — технологии, `commerce` —
// коммерция, `music` — музыка). Seed ФИКСИРОВАН — набор воспроизводим между прогонами, не новый
// случайный шум при каждой загрузке витрины.
//
// Записи КАЖДОЙ темы — НАРОЧНО разной формы: часть похожа на вход кнопки (`{label, payload?}`,
// `packages/ui/src/button/entity/io.ts`), часть — нет. Доказывает, что подбор
// (`compatibleItems`) реально фильтрует, а не подсовывает всё подряд.

import { faker } from "@faker-js/faker";

function themed(seed: number, build: () => readonly unknown[]): readonly unknown[] {
  faker.seed(seed);
  return build();
}

/** Технологии — звонкие технические фразы, годятся в подпись кнопки. */
const TECHNOLOGY = themed(1, () => [
  ...Array.from({ length: 5 }, () => ({ label: faker.hacker.phrase() })),
  // Не подходит под {label: string} — форма другая, доказательство фильтрации.
  { headline: faker.hacker.phrase() },
  { command: faker.hacker.abbreviation(), verb: faker.hacker.verb() },
]);

/** Коммерция — названия товаров, годятся в подпись кнопки. */
const COMMERCE = themed(2, () => [
  ...Array.from({ length: 5 }, () => ({
    label: faker.commerce.productName(),
    payload: { price: faker.commerce.price() },
  })),
  // Не подходит — нет label вовсе.
  { product: faker.commerce.productName(), department: faker.commerce.department() },
]);

/** Музыка — названия песен, годятся в подпись кнопки. */
const MUSIC = themed(3, () => [
  ...Array.from({ length: 5 }, () => ({ label: faker.music.songName() })),
  // Не подходит — label не строка.
  { label: { genre: faker.music.genre() } },
]);

/** Что показывает витрина из коробки — тема → её записи. */
export const BUILTIN_PACKS: Readonly<Record<string, readonly unknown[]>> = {
  технологии: TECHNOLOGY,
  коммерция: COMMERCE,
  музыка: MUSIC,
};

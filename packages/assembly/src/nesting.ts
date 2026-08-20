// ВЛОЖЕННОСТЬ — что допустимо положить внутрь чего.
//
// ## Уровень один
//
// Часть компонента и есть вложенный компонент, увиденный с другой стороны: у Ark вкладка
// гармошки — и часть гармошки, и самостоятельный компонент. Значит и дерево одно, и правило
// одно. Страница — компонент раскладки, чей паспорт пускает внутрь любой компонент; кнопка —
// компонент, чей паспорт пускает внутрь текст или значок. Механика в обоих случаях делает
// одно: спрашивает паспорт и отвергает недопустимое.
//
// ## Своих правил здесь нет и не заводится
//
// Ни списка компонентов, ни таблицы исключений, ни иерархии родов. Всё, чем эта проверка
// располагает, объявлено паспортами (`accepts` части и `genus` кандидата), а РЕШЕНИЕ по ним
// принимает правило допуска, приехавшее вместе с паспортами (`registry.admits`).
//
// Работа механики — не решать, а поставить правилу верный вопрос:
//
//   • перевести адрес узла в кандидата: часть своего компонента либо содержимое рода;
//   • найти часть-владельца, внутрь которой кладут;
//   • назвать отказ так, чтобы редактор мог объяснить его человеку.
//
// Заведи механика собственное правило — оно немедленно разошлось бы с паспортом, и правым
// оказался бы тот, кого спросили последним.

import { partOf, type Admission } from "./passport-read.js";
import { readAddress, type Registry } from "./registry.js";

/**
 * Имя отказа. Именованный отказ, а не `false`: редактор показывает человеку причину, а проба
 * проверяет ИМЕННО ТУ причину, ради которой написана.
 *
 *  • `parent-unknown`      — адреса владельца реестр не знает: ни компонента, ни части;
 *  • `child-unknown`       — адреса вкладываемого реестр не знает;
 *  • `part-undeclared`     — часть есть в анатомии, но добавки к ней паспорт не дал: сказать о
 *                            её вложенности нечего. Пробел паспорта, а не отказ по правилу;
 *  • `foreign-part`        — часть ЧУЖОГО компонента: части живут внутри своего компонента, а
 *                            чужой вкладывается целиком, и тогда его пускают по роду;
 *  • `part-not-admitted`   — часть своего компонента, но владелец её среди допустимого не назвал;
 *  • `content-not-admitted`— содержимое такого рода часть внутрь не пускает.
 */
export type NestingRefusal =
  | "parent-unknown"
  | "child-unknown"
  | "part-undeclared"
  | "foreign-part"
  | "part-not-admitted"
  | "content-not-admitted";

/** Ответ проверки: допустимо, либо отказ с именем и пояснением человеку. */
export type NestingVerdict =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly refusal: NestingRefusal; readonly means: string };

const allow: NestingVerdict = { allowed: true };

const deny = (refusal: NestingRefusal, means: string): NestingVerdict => ({
  allowed: false,
  refusal,
  means,
});

/**
 * Допустим ли кандидат внутри узла.
 *
 * Нижний вызов, к которому сводится всё остальное: кандидат назван прямо — своя часть по имени
 * либо содержимое рода. Нужен там, где адреса ещё нет: редактор спрашивает «влезет ли сюда
 * подпись» до того, как её создали.
 *
 * @param registry реестр: паспорта и правило допуска
 * @param parent адрес узла-владельца
 * @param candidate что кладут
 */
export function canAdmit(
  registry: Registry,
  parent: string,
  candidate: Admission,
): NestingVerdict {
  const owner = readAddress(registry, parent);
  if (!owner) {
    return deny("parent-unknown", `адрес «${parent}» реестру неизвестен — правил для него нет`);
  }

  const ownerPart = partOf(owner.passport, owner.part);
  if (!ownerPart) {
    return deny(
      "part-undeclared",
      `часть «${owner.part}» компонента «${owner.passport.component}» объявлена анатомией, но паспорт не сказал о ней ничего — вложенность неизвестна`,
    );
  }

  if (registry.admits(ownerPart, candidate)) return allow;

  return candidate.kind === "part"
    ? deny(
        "part-not-admitted",
        `часть «${owner.part}» не назвала «${candidate.name}» среди допустимого внутри`,
      )
    : deny(
        "content-not-admitted",
        `часть «${owner.part}» компонента «${owner.passport.component}» не пускает внутрь содержимое рода «${candidate.genus}»`,
      );
}

/**
 * Допустимо ли положить узел с адресом `child` внутрь узла с адресом `parent`.
 *
 * Разбор один и тот же для обоих применений механики: редактор скинов спрашивает про части
 * одного компонента, конструктор страниц — про компоненты целиком. Различие только в том,
 * какие адреса ему передадут.
 *
 * @param registry реестр: паспорта и правило допуска
 * @param parent адрес узла-владельца
 * @param child адрес вкладываемого узла
 */
export function canContain(registry: Registry, parent: string, child: string): NestingVerdict {
  const owner = readAddress(registry, parent);
  if (!owner) {
    return deny("parent-unknown", `адрес «${parent}» реестру неизвестен — правил для него нет`);
  }

  const guest = readAddress(registry, child);
  if (!guest) {
    return deny("child-unknown", `адрес «${child}» реестру неизвестен — вкладывать нечего`);
  }

  // Гость — ЧАСТЬ, если его адрес несёт часть, отличную от корневой. Корневая часть — это сам
  // компонент, и он приходит сюда на общих правах содержимого: по роду, а не по имени.
  const guestIsPart = guest.part !== guest.passport.root;

  if (guestIsPart) {
    if (guest.component !== owner.component) {
      return deny(
        "foreign-part",
        `часть «${guest.part}» принадлежит компоненту «${guest.passport.component}» — внутрь «${owner.passport.component}» она сама по себе не кладётся, кладётся компонент целиком`,
      );
    }
    return canAdmit(registry, parent, { kind: "part", name: guest.part });
  }

  return canAdmit(registry, parent, { kind: "content", genus: guest.passport.genus });
}

/**
 * Что паспорт разрешает положить внутрь узла — перечень для того, кто предлагает выбор.
 *
 * Здесь механика ПЕРЕВОДИТ объявленное, а не решает: адреса частей собираются полными
 * (`accordion.itemTrigger`), рода остаются как названы. Какой род каким подходит — знает
 * правило допуска, и спрашивают его вызовом `canAdmit`, а не перебором этого перечня.
 */
export interface AllowedInside {
  /**
   * Часть ничего не запрещает: паспорт правила вложенности для неё не объявлял.
   *
   * Это не «пусто» и не «всё»: молчание паспорта, названное честно. Перечни в таком случае
   * пустые — предложить по ним нечего, а отвергать нечем.
   */
  readonly unrestricted: boolean;
  /** Адреса частей этого же компонента, названных допустимыми внутри. */
  readonly parts: readonly string[];
  /** Рода содержимого потребителя, названные допустимыми внутри. */
  readonly genera: readonly string[];
}

/**
 * Что допустимо внутри узла, либо `undefined` — если адрес реестру неизвестен или паспорт о
 * части ничего не сказал.
 *
 * @param registry реестр
 * @param parent адрес узла-владельца
 */
export function allowedInside(registry: Registry, parent: string): AllowedInside | undefined {
  const owner = readAddress(registry, parent);
  if (!owner) return undefined;

  const ownerPart = partOf(owner.passport, owner.part);
  if (!ownerPart) return undefined;

  const accepts = ownerPart.accepts;
  if (!accepts) return { unrestricted: true, parts: [], genera: [] };

  const parts: string[] = [];
  const genera: string[] = [];
  for (const item of accepts) {
    if (item.kind === "part") {
      parts.push(
        item.name === owner.passport.root ? owner.component : `${owner.component}.${item.name}`,
      );
    } else if (!genera.includes(item.genus)) {
      genera.push(item.genus);
    }
  }

  return { unrestricted: false, parts, genera };
}

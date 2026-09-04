// см. README.md / FAQ.md

import { partOf, type Admission } from "./passport-read.js";
import { readAddress, type Registry } from "./registry.js";

export type NestingRefusal =
  | "parent-unknown"
  | "child-unknown"
  | "part-undeclared"
  | "foreign-part"
  | "content-not-admitted"
  | "component-not-admitted";

export type NestingVerdict =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly refusal: NestingRefusal; readonly means: string };

const allow: NestingVerdict = { allowed: true };

const deny = (refusal: NestingRefusal, means: string): NestingVerdict => ({
  allowed: false,
  refusal,
  means,
});

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

  if (candidate.kind === "component") {
    return deny(
      "component-not-admitted",
      candidate.name
        ? `часть «${owner.part}» компонента «${owner.passport.component}» не пускает внутрь «${candidate.name}»`
        : `часть «${owner.part}» компонента «${owner.passport.component}» не пускает внутрь ссылку на компонент общего реестра`,
    );
  }

  return deny(
    "content-not-admitted",
    `часть «${owner.part}» компонента «${owner.passport.component}» не пускает внутрь содержимое рода «${candidate.genus}»`,
  );
}

export function canContain(registry: Registry, parent: string, child: string): NestingVerdict {
  const owner = readAddress(registry, parent);
  if (!owner) {
    return deny("parent-unknown", `адрес «${parent}» реестру неизвестен — правил для него нет`);
  }

  const guest = readAddress(registry, child);
  if (!guest) {
    return deny("child-unknown", `адрес «${child}» реестру неизвестен — вкладывать нечего`);
  }

  const guestIsPart = guest.part !== guest.passport.root;

  if (guestIsPart) {
    if (guest.component !== owner.component) {
      return deny(
        "foreign-part",
        `часть «${guest.part}» принадлежит компоненту «${guest.passport.component}» — внутрь «${owner.passport.component}» она сама по себе не кладётся, кладётся компонент целиком`,
      );
    }
    return canAdmit(registry, parent, { kind: "component", name: guest.part });
  }

  return canAdmit(registry, parent, { kind: "component", genus: guest.passport.genus, name: guest.component });
}

export interface AllowedInside {
  readonly unrestricted: boolean;
  readonly parts: readonly string[];
  readonly genera: readonly string[];
  readonly components: boolean;
}

export function allowedInside(registry: Registry, parent: string): AllowedInside | undefined {
  const owner = readAddress(registry, parent);
  if (!owner) return undefined;

  const ownerPart = partOf(owner.passport, owner.part);
  if (!ownerPart) return undefined;

  const accepts = ownerPart.accepts;
  if (!accepts) return { unrestricted: true, parts: [], genera: [], components: false };

  const ownAnatomy = owner.passport.anatomy.keys();

  const parts: string[] = [];
  const genera: string[] = [];
  let components = false;
  for (const item of accepts) {
    if (item.kind === "content") {
      if (!genera.includes(item.genus)) genera.push(item.genus);
      continue;
    }

    if (item.name === undefined) {
      components = true;
      continue;
    }

    if (ownAnatomy.includes(item.name)) {
      parts.push(
        item.name === owner.passport.root ? owner.component : `${owner.component}.${item.name}`,
      );
    } else {
      components = true;
    }
  }

  return { unrestricted: false, parts, genera, components };
}

export interface PossibleOwner {
  readonly address: string;
  readonly component: string;
  readonly part: string;
}

export function ownersAdmitting(
  registry: Registry,
  candidate: Admission,
  component?: string,
): PossibleOwner[] {
  const scope = component === undefined ? Object.keys(registry.components) : [component];
  const found: PossibleOwner[] = [];

  for (const componentAddress of scope) {
    const passport = registry.components[componentAddress]?.passport;
    if (!passport) continue;

    for (const part of passport.parts) {
      if (!registry.admits(part, candidate)) continue;
      found.push({
        address:
          part.name === passport.root ? componentAddress : `${componentAddress}.${part.name}`,
        component: componentAddress,
        part: part.name,
      });
    }
  }

  return found.sort((left, right) => (left.address < right.address ? -1 : 1));
}

export function possibleOwnersOf(registry: Registry, child: string): PossibleOwner[] | undefined {
  const guest = readAddress(registry, child);
  if (!guest) return undefined;

  return guest.part === guest.passport.root
    ? ownersAdmitting(registry, { kind: "component", genus: guest.passport.genus, name: guest.component })
    : ownersAdmitting(registry, { kind: "component", name: guest.part }, guest.component);
}

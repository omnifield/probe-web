// см. README.md / FAQ.md

import type {
  Admission,
  AdmissionRule,
  ReadablePart,
  ReadablePassport,
} from "./passport-read.js";

export interface ReadableComponent {
  readonly passport: ReadablePassport;
  readonly parts: Readonly<Record<string, unknown>>;
  readonly provider?: unknown;
}

export interface Registry {
  readonly components: Readonly<Record<string, ReadableComponent>>;
  admits(part: ReadablePart, candidate: Admission): boolean;
}

export interface Address {
  readonly component: string;
  readonly passport: ReadablePassport;
  readonly part: string;
  readonly address: string;
}

export interface RegistrySpec extends AdmissionRule {
  readonly components: Readonly<Record<string, ReadableComponent>>;
}

export function createRegistry(spec: RegistrySpec): Registry {
  for (const [address, entry] of Object.entries(spec.components)) {
    const pair = entry as Partial<ReadableComponent> | undefined;
    const passport = pair?.passport as Partial<ReadablePassport> | undefined;

    if (!passport || typeof passport.anatomy?.keys !== "function" || !pair?.parts) {
      throw new Error(
        `по адресу «${address}» лежит не пара «паспорт и части»: реестр складывается из того, ` +
          `что отдаёт поставщик (например, kitOf("button")), а не из карты компонентов`,
      );
    }
  }

  return {
    components: spec.components,
    admits: (part, candidate) => spec.admits(part, candidate),
  };
}

export function readAddress(registry: Registry, address: string): Address | undefined {
  if (!address) return undefined;

  const whole = registry.components[address];
  if (whole) {
    return {
      component: address,
      passport: whole.passport,
      part: whole.passport.root,
      address,
    };
  }

  const cut = address.lastIndexOf(".");
  if (cut <= 0) return undefined;

  const component = address.slice(0, cut);
  const segment = address.slice(cut + 1);
  const supplied = registry.components[component];
  if (!supplied) return undefined;

  const passport = supplied.passport;

  if (!passport.anatomy.keys().includes(segment)) return undefined;

  if (segment === passport.root) {
    return { component, passport, part: segment, address: component };
  }

  return { component, passport, part: segment, address };
}

export function resolveComponent(registry: Registry, address: string): unknown {
  const read = readAddress(registry, address);
  if (!read) return undefined;

  const supplied = registry.components[read.component];
  const found = supplied?.parts[read.part];
  return typeof found === "function" ? found : undefined;
}

export function knownComponents(registry: Registry): string[] {
  return Object.keys(registry.components).sort();
}

export type RegistryFlawName = "part-uncharted" | "part-not-callable" | "part-astray";

export interface RegistryFlaw {
  readonly flaw: RegistryFlawName;
  readonly component: string;
  readonly part: string;
  readonly means: string;
}

export function checkRegistry(registry: Registry): RegistryFlaw[] {
  const flaws: RegistryFlaw[] = [];

  for (const [component, supplied] of Object.entries(registry.components)) {
    const declared = supplied.passport.anatomy.keys();

    for (const part of declared) {
      if (!Object.hasOwn(supplied.parts, part)) {
        flaws.push({
          flaw: "part-uncharted",
          component,
          part,
          means: `часть «${part}» объявлена анатомией «${supplied.passport.component}», но чем её рисовать — не названо`,
        });
        continue;
      }

      if (typeof supplied.parts[part] !== "function") {
        flaws.push({
          flaw: "part-not-callable",
          component,
          part,
          means: `часть «${part}» компонента «${supplied.passport.component}» названа не компонентом — позвать её нечем`,
        });
      }
    }

    for (const part of Object.keys(supplied.parts)) {
      if (declared.includes(part)) continue;
      flaws.push({
        flaw: "part-astray",
        component,
        part,
        means: `в карте «${supplied.passport.component}» есть часть «${part}», которой нет в анатомии — адресовать её нечем`,
      });
    }
  }

  return flaws;
}

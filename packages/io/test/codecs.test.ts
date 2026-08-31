// Живая проба слоёв L0/L1 (PWEB-182): decode ЧУЖОЙ формы в канон, и encode канона ОБРАТНО в
// чужую форму — round-trip, не только чтение в одну сторону, раз codec заявлен двусторонним.

import { describe, expect, it } from "vitest";
import { z } from "zod";

import { identityCodec, renameKeysCodec } from "../src/codecs.js";

describe("identityCodec (L0)", () => {
  it("разбирает и отдаёт значение как есть в обе стороны", () => {
    const schema = z.object({ label: z.string() });
    const codec = identityCodec(schema);

    expect(codec.decode({ label: "Купить" })).toEqual({ label: "Купить" });
    expect(codec.encode({ label: "Купить" })).toEqual({ label: "Купить" });
  });

  it("проверка на месте — чужое лишнее поле не проходит объектную схему", () => {
    const schema = z.object({ label: z.string() }).strict();
    const codec = identityCodec(schema);

    expect(() => codec.decode({ label: "x", extra: 1 } as { label: string })).toThrow();
  });
});

describe("renameKeysCodec (L1)", () => {
  const input = z.record(z.string(), z.unknown());
  const output = z.object({ id: z.string(), title: z.string() });
  const mapping = { code: "id", name: "title" };

  it("decode переименовывает чужие ключи в наши", () => {
    const codec = renameKeysCodec(input, output, mapping);

    expect(codec.decode({ code: "s1", name: "Section 1" })).toEqual({
      id: "s1",
      title: "Section 1",
    });
  });

  it("encode переименовывает наши ключи обратно в чужие — словарь строится сам, не задаётся отдельно", () => {
    const codec = renameKeysCodec(input, output, mapping);

    expect(codec.encode({ id: "s1", title: "Section 1" })).toEqual({
      code: "s1",
      name: "Section 1",
    });
  });

  it("round-trip: decode∘encode и encode∘decode возвращают исходное", () => {
    const codec = renameKeysCodec(input, output, mapping);
    const theirs = { code: "s1", name: "Section 1" };
    const ours = { id: "s1", title: "Section 1" };

    expect(codec.encode(codec.decode(theirs))).toEqual(theirs);
    expect(codec.decode(codec.encode(ours))).toEqual(ours);
  });

  it("ключ не из словаря проезжает под своим именем — отбор лишнего не эта функция, а output-схема", () => {
    const codec = renameKeysCodec(input, z.object({ id: z.string() }), { code: "id" });

    expect(codec.decode({ code: "s1", untouched: "x" })).toEqual({ id: "s1" });
  });

  it("неоднозначный словарь (два чужих ключа в один наш) — явный отказ при построении", () => {
    expect(() => renameKeysCodec(input, output, { code: "id", sku: "id" })).toThrow(/неоднозначен/);
  });
});

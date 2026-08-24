import { describe, expect, it } from "vitest";

import { SIZE_SEEDS } from "./helpers/seeds.js";

import { AXES, axisOf, type AxisBound } from "../src/axes.js";
import {
  DENSITY_CEILING,
  DENSITY_FLOOR,
  DENSITY_TOKEN,
  DERIVED_SCALES,
  FIXED_TOKENS,
} from "../src/dimension.js";

// Границы осей — гейт того, что отсутствие границы ОБЪЯВЛЕНО, а не получилось молчанием.
// Проверять здесь нечего в смысле вычислений: ценность таблицы вся в том, что она полна,
// не расходится с данными шкал и не выдаёт наш предел за требование нормы.

const bounds = (): AxisBound[] => AXES.flatMap((axis) => [axis.floor, axis.ceiling]);

describe("оси вида и их границы", () => {
  it("объявлена каждая ось, которую потребитель может крутить", () => {
    // Полнота — главное свойство таблицы. Заведённая шкала без объявленных границ вернула бы
    // ровно то состояние, ради выхода из которого таблица и заведена: потребитель снова
    // подставит свой список, потому что края ему неоткуда узнать.
    const declared = AXES.map((axis) => axis.token).sort();
    const turnable = [DENSITY_TOKEN, ...DERIVED_SCALES.map((scale) => scale.seed)].sort();

    expect(declared).toEqual(turnable);
  });

  it("границы плотности — те же константы, а не их копии", () => {
    // Копия разъезжается с оригиналом молча, и снаружи не видно, какая из двух правда.
    const density = axisOf(DENSITY_TOKEN)!;
    expect(density.floor.value).toBe(DENSITY_FLOOR);
    expect(density.ceiling.value).toBe(DENSITY_CEILING);
  });

  it("«границы нет» и число — несовместимы, «норма» без числа не бывает", () => {
    for (const bound of bounds()) {
      if (bound.kind === "границы нет") {
        expect(bound.value, `«границы нет» с числом: ${bound.why}`).toBeNull();
      }
      if (bound.kind === "норма") {
        expect(bound.value, `норма без числа: ${bound.why}`).not.toBeNull();
      }
    }
  });

  it("норма названа ровно там, где она связывает", () => {
    // Поле структурное именно поэтому: предел поддержки, объяснённый через норму свободным
    // текстом, читается как требование — и его начинают соблюдать как требование.
    for (const bound of bounds()) {
      expect(bound.norm !== null, `norm при kind «${bound.kind}»: ${bound.why}`).toBe(
        bound.kind === "норма",
      );
    }
  });

  it("у каждой границы названа причина, а не поставлена галочка", () => {
    for (const bound of bounds()) expect(bound.why.length).toBeGreaterThan(30);
  });

  it("предел скругления назван пределом, а не требованием доступности", () => {
    // Проверка по тексту — та же, что стережёт `DENSITY_NOTE`: формулировка уезжает
    // потребителю, и «практический предел», прочитанный как норма, останавливает ползунок
    // там, где ничего не запрещено.
    const radius = axisOf("radius")!;
    expect(radius.ceiling.kind).toBe("практический предел");
    expect(radius.ceiling.norm).toBeNull();
    expect(radius.ceiling.why).toMatch(/НЕ требование доступности/);
    expect(radius.ceiling.why).toMatch(/пилюл/);
  });

  it("у скругления и кегля границ нет — и это сказано, а не пропущено", () => {
    // Первое и главное требование `PROBEWEB-69`: молчание читается как «база не знает».
    for (const token of ["radius", "font-size"]) {
      const axis = axisOf(token)!;
      expect(axis.floor.kind, `пол ${token}`).toBe("границы нет");
      expect(axis.floor.value, `пол ${token}`).toBeNull();
    }
    expect(axisOf("font-size")!.ceiling.kind).toBe("границы нет");
    // Отсутствие минимального кегля — проверенный факт, а не наша догадка: у WCAG 2.2 такого
    // критерия нет вовсе. Дата сверки уезжает вместе с причиной.
    expect(axisOf("font-size")!.floor.why).toMatch(/1\.4\.4/);
    expect(axisOf("font-size")!.floor.why).toMatch(/2026-08-18/);
  });

  it("пол высоты контрола выведен из данных шкалы, а не переписан числом", () => {
    // `семя × 0.8 ≥ 1.5rem` при плотности 1. Считается из шкалы и `control-target-min`:
    // подвинется ступень — подвинется и объявленный пол, без правки таблицы.
    const control = DERIVED_SCALES.find((scale) => scale.seed === "control-height")!;
    const smallest = control.steps.find((step) => step.name === "control-height-sm")!;
    const factor = "factor" in smallest ? smallest.factor : Number.NaN;
    const minRem = Number.parseFloat(
      FIXED_TOKENS.find((token) => token.name === "control-target-min")!.value,
    );

    const floor = axisOf("control-height")!.floor.value!;
    expect(floor * factor).toBeCloseTo(minRem, 10);

    // Границы не складываются, а перемножаются: на нижней плотности порог для семени равен
    // ровно нынешнему семени, то есть запаса нет.
    expect(Number.parseFloat(SIZE_SEEDS[control.seed]!) * factor * DENSITY_FLOOR).toBeCloseTo(minRem, 10);
    expect(floor).toBeLessThan(Number.parseFloat(SIZE_SEEDS[control.seed]!));
  });

  it("единица оси совпадает с единицей семени шкалы", () => {
    // Иначе панель нарисует ползунок в rem там, где семя в px, и человек будет крутить не то.
    for (const axis of AXES) {
      const scale = DERIVED_SCALES.find((item) => item.seed === axis.token);
      if (!scale) {
        expect(axis.unit, `${axis.token} — не шкала, значит множитель`).toBe("множитель");
        continue;
      }
      const unit = /[\d.]+([a-z%]*)$/.exec(SIZE_SEEDS[scale.seed]!)?.[1];
      expect(axis.unit, `единица ${axis.token}`).toBe(unit);
    }
  });

  // Проба «границы уезжают комментарием в базовый слой» снята вместе с печатью (`PWEB-66`):
  // комментарий в чужом файле знанием не является — его не прочтёт машина и не найдёт тот, кто
  // строит ползунок. Знание живёт данными и проверяется выше.

  it("диапазон непрерывен — «правильных» ступеней у базы нет ни у одной оси", () => {
    // Вопрос потребителя был прямым: между полом и потолком диапазон непрерывный или у базы
    // есть свои ступени? Ответ «непрерывный» объявлен здесь, а подтверждён данными в
    // `dimension.test.ts` — «любой множитель из диапазона законен».
    for (const axis of AXES) expect(axis.continuous, `ось ${axis.token}`).toBe(true);
  });
});

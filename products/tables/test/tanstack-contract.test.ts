// Проба на ЧУЖУЮ начинку: что именно мы предполагаем про TanStack v9.
//
// Она существует не для того, чтобы проверять чужой пакет — его проверяет его автор, — а
// чтобы наши предположения о нём были записаны машиной, а не памятью. Обновление начинки
// уронит эту пробу первой и назовёт, что именно поехало: реактивность опций через геттеры,
// применение внешнего состояния сортировки и видимость колонок.
//
// Проверено на `@tanstack/table-core@9.1.2` 2026-08-11.

import { describe, expect, it } from "vitest";
import { createRoot, createSignal } from "solid-js";
import {
  columnOrderingFeature,
  columnVisibilityFeature,
  createCoreRowModel,
  createSortedRowModel,
  createTable,
  rowSortingFeature,
  tableFeatures,
} from "@tanstack/solid-table";

const features = tableFeatures({
  columnOrderingFeature,
  columnVisibilityFeature,
  rowSortingFeature,
  coreRowModel: createCoreRowModel(),
  sortedRowModel: createSortedRowModel(),
});

describe("предположения о начинке", () => {
  it("опции читаются РЕАКТИВНО через геттеры — состояние живёт снаружи таблицы", () => {
    createRoot((dispose) => {
      const [sorting, setSorting] = createSignal([{ id: "name", desc: false }]);
      const [visibility, setVisibility] = createSignal<Record<string, boolean>>({});

      const table = createTable({
        features,
        data: [
          { name: "б", n: 2 },
          { name: "а", n: 1 },
        ],
        columns: [
          { id: "name", accessorKey: "name", header: "имя" },
          { id: "n", accessorKey: "n", header: "число" },
        ],
        get state() {
          return { sorting: sorting(), columnVisibility: visibility(), columnOrder: [] };
        },
      });

      expect(table.getRowModel().rows.map((row) => row.getValue("name"))).toEqual(["а", "б"]);

      setSorting([{ id: "n", desc: true }]);
      expect(table.getRowModel().rows.map((row) => row.getValue("n"))).toEqual([2, 1]);

      setVisibility({ n: false });
      expect(table.getVisibleLeafColumns().map((column) => column.id)).toEqual(["name"]);

      dispose();
    });
  });

  it("порядок колонок задаётся состоянием, а не порядком объявления", () => {
    createRoot((dispose) => {
      const table = createTable({
        features,
        data: [{ name: "а", n: 1 }],
        columns: [
          { id: "name", accessorKey: "name", header: "имя" },
          { id: "n", accessorKey: "n", header: "число" },
        ],
        get state() {
          return { columnOrder: ["n", "name"], sorting: [], columnVisibility: {} };
        },
      });

      expect(table.getVisibleLeafColumns().map((column) => column.id)).toEqual(["n", "name"]);
      dispose();
    });
  });
});

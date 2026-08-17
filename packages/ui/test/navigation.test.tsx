import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../src/alert-dialog.jsx";
import {
  Breadcrumbs,
  BreadcrumbsItem,
  BreadcrumbsLink,
  BreadcrumbsList,
  BreadcrumbsSeparator,
  Image,
  ImageFallback,
  ImageImg,
  Link,
} from "../src/navigation.jsx";
import {
  Pagination,
  PaginationEllipsis,
  PaginationItem,
  PaginationItems,
  PaginationNext,
  PaginationPrevious,
} from "../src/pagination.jsx";
import { cleanup, mount, nextTask, one, press } from "./dom.jsx";

afterEach(cleanup);

describe("Link — смысл обёртки один: отключённая ссылка", () => {
  it("обычная ссылка — ОДИН `<a>` со своим адресом", () => {
    const host = mount(() => <Link href="/docs">Документация</Link>);
    const link = one<HTMLAnchorElement>(host, "[data-slot='link']");

    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("/docs");
  });

  it("`disabled` снимает адрес и объявляет состояние — узел остаётся тем же", () => {
    // У нативной ссылки атрибута `disabled` не существует: «отключённая» либо остаётся
    // кликабельной, либо превращается в `<span>` и теряет фокус. Здесь ни того, ни другого.
    const host = mount(() => (
      <Link href="/docs" disabled>
        Документация
      </Link>
    ));
    const link = one(host, "[data-slot='link']");

    expect(link.tagName).toBe("A");
    expect(link.hasAttribute("href")).toBe(false);
    expect(link.getAttribute("aria-disabled")).toBe("true");
    expect(link.hasAttribute("data-disabled")).toBe(true);
  });
});

describe("Breadcrumbs", () => {
  it("это объявленная навигация, а не список ссылок", () => {
    const host = mount(() => (
      <Breadcrumbs>
        <BreadcrumbsList>
          <BreadcrumbsItem>
            <BreadcrumbsLink href="/">Главная</BreadcrumbsLink>
            <BreadcrumbsSeparator />
          </BreadcrumbsItem>
          <BreadcrumbsItem>
            <BreadcrumbsLink current>Отчёт</BreadcrumbsLink>
          </BreadcrumbsItem>
        </BreadcrumbsList>
      </Breadcrumbs>
    ));

    const root = one(host, "[data-slot='breadcrumbs']");
    expect(root.tagName).toBe("NAV");
    expect(root.hasAttribute("aria-label")).toBe(true);
  });

  it("`current` — не оформление: адрес снят, страница объявлена текущей", () => {
    const host = mount(() => (
      <Breadcrumbs>
        <BreadcrumbsList>
          <BreadcrumbsItem>
            <BreadcrumbsLink current>Отчёт</BreadcrumbsLink>
          </BreadcrumbsItem>
        </BreadcrumbsList>
      </Breadcrumbs>
    ));

    const link = one(host, "[data-slot='breadcrumbs-link']");
    expect(link.getAttribute("aria-current")).toBe("page");
    expect(link.hasAttribute("href")).toBe(false);
  });

  it("список и крошка — НАШИ части: у оформления есть имя вместо тега", () => {
    // До них оформление цеплялось за прямого ребёнка корня и за тег `li` — то есть за
    // структуру, которую зона вправе поменять молча. Теперь у обоих есть обещанное имя.
    const host = mount(() => (
      <Breadcrumbs>
        <BreadcrumbsList>
          <BreadcrumbsItem>
            <BreadcrumbsLink href="/">Главная</BreadcrumbsLink>
          </BreadcrumbsItem>
        </BreadcrumbsList>
      </Breadcrumbs>
    ));

    const list = one(host, "[data-slot='breadcrumbs-list']");
    const item = one(host, "[data-slot='breadcrumbs-item']");

    expect(list.tagName).toBe("OL");
    expect(item.tagName).toBe("LI");
    expect(list.contains(item)).toBe(true);
    // Ни поведения, ни вида — чистая точка опоры.
    expect(list.hasAttribute("class")).toBe(false);
    expect(item.hasAttribute("style")).toBe(false);
  });

  it("разделитель спрятан от вспомогательной техники", () => {
    const host = mount(() => (
      <Breadcrumbs separator="→">
        <BreadcrumbsList>
          <BreadcrumbsItem>
            <BreadcrumbsLink href="/">Главная</BreadcrumbsLink>
            <BreadcrumbsSeparator />
          </BreadcrumbsItem>
        </BreadcrumbsList>
      </Breadcrumbs>
    ));

    const separator = one(host, "[data-slot='breadcrumbs-separator']");
    expect(separator.getAttribute("aria-hidden")).toBe("true");
    expect(separator.textContent).toBe("→");
  });
});

describe("Image — картинка появляется только после загрузки", () => {
  it("пока картинки нет, стоит заглушка", () => {
    // Иначе аватарка мигает битым значком на каждой медленной сети.
    const host = mount(() => (
      <Image>
        <ImageImg src="/avatar.png" alt="Пётр" />
        <ImageFallback>П</ImageFallback>
      </Image>
    ));

    // В JSDOM картинка не грузится вовсе — это и есть состояние «ещё не загрузилась».
    expect(host.querySelector("[data-slot='image-img']")).toBeNull();
    expect(one(host, "[data-slot='image-fallback']").textContent).toBe("П");
  });

  it("загрузилась — картинка появляется, заглушка уходит", async () => {
    const host = mount(() => (
      <Image>
        <ImageImg src="/avatar.png" alt="Пётр" />
        <ImageFallback>П</ImageFallback>
      </Image>
    ));

    // Загрузку сообщает заглушка обвязки следующей задачей — как это делает браузер и как
    // это стыкует сам kobalte в своих тестах.
    await nextTask();

    expect(one<HTMLImageElement>(host, "[data-slot='image-img']").alt).toBe("Пётр");
    expect(host.querySelector("[data-slot='image-fallback']")).toBeNull();
  });

  it("корень — один узел с зацепкой, вокруг обоих состояний", () => {
    const host = mount(() => (
      <Image>
        <ImageFallback>П</ImageFallback>
      </Image>
    ));

    expect(host.children.length).toBe(1);
    expect(one(host, "[data-slot='image']").contains(one(host, "[data-slot='image-fallback']"))).toBe(
      true,
    );
  });
});

describe("AlertDialog — не `Dialog` с другим именем", () => {
  const Confirm = (props: { open?: boolean; onOpenChange?: (open: boolean) => void }) => (
    <AlertDialog open={props.open} onOpenChange={props.onOpenChange}>
      <AlertDialogTrigger>Удалить</AlertDialogTrigger>
      <AlertDialogPortal>
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogTitle>Удалить безвозвратно?</AlertDialogTitle>
          <AlertDialogDescription>Восстановить будет нельзя</AlertDialogDescription>
          <AlertDialogClose>Отмена</AlertDialogClose>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialog>
  );

  it("роль `alertdialog` — техника объявляет такое окно настойчивее", () => {
    mount(() => <Confirm open />);

    expect(one(document, "[data-slot='alert-dialog-content']").getAttribute("role")).toBe(
      "alertdialog",
    );
  });

  it("заголовок и пояснение связаны с окном", () => {
    mount(() => <Confirm open />);

    const content = one(document, "[data-slot='alert-dialog-content']");
    expect(content.getAttribute("aria-labelledby")).toBe(
      one(document, "[data-slot='alert-dialog-title']").id,
    );
    expect(content.getAttribute("aria-describedby")).toBe(
      one(document, "[data-slot='alert-dialog-description']").id,
    );
  });

  it("клик по подложке НЕ закрывает — решение не отменяют промахом", () => {
    const onOpenChange = vi.fn();
    mount(() => <Confirm open onOpenChange={onOpenChange} />);

    press(one(document, "[data-slot='alert-dialog-overlay']"));

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(document.querySelector("[data-slot='alert-dialog-content']")).not.toBeNull();
  });
});

describe("Pagination — раскладку номеров считает kobalte", () => {
  const Pages = (props: { page?: number; onPageChange?: (page: number) => void }) => (
    <Pagination
      count={20}
      page={props.page}
      onPageChange={props.onPageChange}
      itemComponent={(item) => <PaginationItem page={item.page}>{item.page}</PaginationItem>}
      ellipsisComponent={() => <PaginationEllipsis>…</PaginationEllipsis>}
    >
      <PaginationPrevious>Назад</PaginationPrevious>
      <PaginationItems />
      <PaginationNext>Вперёд</PaginationNext>
    </Pagination>
  );

  it("корень — `<nav>`, номера и многоточия появились сами", () => {
    const host = mount(() => <Pages page={10} />);

    expect(one(host, "[data-slot='pagination']").tagName).toBe("NAV");
    expect(host.querySelectorAll("[data-slot='pagination-item']").length).toBeGreaterThan(2);
    // «1 … 9 10 11 … 20»: многоточия это тоже узлы, и оформляются они отдельно.
    expect(host.querySelectorAll("[data-slot='pagination-ellipsis']").length).toBe(2);
  });

  it("текущая страница помечена — оформлению не надо сравнивать числа", () => {
    const host = mount(() => <Pages page={10} />);
    const current = [...host.querySelectorAll("[data-slot='pagination-item']")].find((node) =>
      node.hasAttribute("data-current"),
    );

    expect(current?.textContent).toBe("10");
    expect(current?.getAttribute("aria-current")).toBe("page");
  });

  it("на первой странице «назад» отключена самим примитивом", () => {
    const host = mount(() => <Pages page={1} />);

    expect(one(host, "[data-slot='pagination-previous']").hasAttribute("disabled")).toBe(true);
    expect(one(host, "[data-slot='pagination-next']").hasAttribute("disabled")).toBe(false);
  });

  it("нажатие на номер зовёт `onPageChange`", () => {
    const onPageChange = vi.fn();
    const host = mount(() => <Pages page={10} onPageChange={onPageChange} />);

    press(host.querySelectorAll("[data-slot='pagination-item']")[0]);

    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it("класса нет ни у одной части", () => {
    const host = mount(() => <Pages page={10} />);

    for (const node of host.querySelectorAll("[data-slot^='pagination']")) {
      expect(node.hasAttribute("class")).toBe(false);
    }
  });

  it("список и его пункты — узлы KOBALTE, и структура закреплена здесь", () => {
    // Зацепки на них нет и быть не может: `<ul>` рендерит корень kobalte, `<li>` — сама
    // часть, и наружу они не выведены. Оформлению остаётся селектор по структуре
    // (`[data-slot="pagination"] > ul`), а нам — держать эту структуру проверенной: сменится
    // она в `@kobalte/core`, прогон покраснеет здесь, а не вёрстка у потребителя.
    const host = mount(() => <Pages page={10} />);

    const list = one(host, "[data-slot='pagination'] > ul");
    const item = one(host, "[data-slot='pagination-item']");

    expect(list.tagName).toBe("UL");
    expect(item.parentElement?.tagName).toBe("LI");
    expect(item.parentElement?.parentElement).toBe(list);
  });
});

// Кейсы структуры и навигации: аккордеон, раскрывашка, путь, страницы, ссылка, изображение,
// строка меню, навигационное меню, окно подтверждения, контекстное меню.

import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionItem,
  AccordionTrigger,
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
  Breadcrumbs,
  BreadcrumbsItem,
  BreadcrumbsLink,
  BreadcrumbsList,
  BreadcrumbsSeparator,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuItemLabel,
  ContextMenuPortal,
  ContextMenuSeparator,
  ContextMenuTrigger,
  Image,
  ImageFallback,
  ImageImg,
  Link,
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarItemLabel,
  MenubarMenu,
  MenubarPortal,
  MenubarSeparator,
  MenubarTrigger,
  Pagination,
  PaginationEllipsis,
  PaginationItem,
  PaginationItems,
  PaginationNext,
  PaginationPrevious,
} from "@omnifield/probe-web-ui";
import { For } from "solid-js";

import type { Specimen } from "./model.js";

export const STRUCTURE_SPECIMENS: Specimen[] = [
  {
    id: "accordion",
    title: "Аккордеон",
    group: "Структура",
    slots: ["accordion", "accordion-item", "accordion-header", "accordion-trigger", "accordion-content"],
    cases: [
      {
        id: "basic",
        title: "Базовый",
        note: "Закрытый раздел УДАЛЯЕТСЯ из документа, а не прячется — поэтому перехода раскрытия здесь нет: анимировать нечего. Нужен переход — потребитель ставит forceMount.",
        render: () => (
          <Accordion defaultValue={["a"]} collapsible>
            <For each={[
              { v: "a", t: "Цвета", c: "Ступени шкал и роли поверх них." },
              { v: "b", t: "Размеры", c: "Интервалы, высоты контролов, кегли." },
              { v: "c", t: "Движение", c: "Длительности и кривые." },
            ]}>
              {(item) => (
                <AccordionItem value={item.v}>
                  <AccordionHeader>
                    <AccordionTrigger>{item.t}</AccordionTrigger>
                  </AccordionHeader>
                  <AccordionContent>{item.c}</AccordionContent>
                </AccordionItem>
              )}
            </For>
          </Accordion>
        ),
      },
      {
        id: "multiple",
        title: "Несколько открытых",
        note: "Сколько разделов открыто — поведение аккордеона, вида оно не касается.",
        render: () => (
          <Accordion multiple defaultValue={["a", "b"]}>
            <For each={[
              { v: "a", t: "Первый", c: "Открыт." },
              { v: "b", t: "Второй", c: "Тоже открыт." },
            ]}>
              {(item) => (
                <AccordionItem value={item.v}>
                  <AccordionHeader>
                    <AccordionTrigger>{item.t}</AccordionTrigger>
                  </AccordionHeader>
                  <AccordionContent>{item.c}</AccordionContent>
                </AccordionItem>
              )}
            </For>
          </Accordion>
        ),
      },
    ],
  },
  {
    id: "collapsible",
    title: "Раскрывашка",
    group: "Структура",
    slots: ["collapsible", "collapsible-trigger", "collapsible-content"],
    cases: [
      {
        id: "basic",
        title: "Базовая",
        note: "Раздел аккордеона без соседей — вид тот же, поэтому и правила одни. Разделяет их только поведение.",
        render: () => (
          <Collapsible>
            <CollapsibleTrigger>Подробности расчёта</CollapsibleTrigger>
            <CollapsibleContent>
              Итог считается по видимым строкам, а не по всему набору.
            </CollapsibleContent>
          </Collapsible>
        ),
      },
    ],
  },
  {
    id: "breadcrumbs",
    title: "Путь",
    group: "Навигация",
    slots: ["breadcrumbs", "breadcrumbs-list", "breadcrumbs-item", "breadcrumbs-link", "breadcrumbs-separator"],
    cases: [
      {
        id: "basic",
        title: "Базовый",
        note: "Текущая страница — не ссылка, и это объявлено атрибутом, а не только видом.",
        render: () => (
          <Breadcrumbs>
            <BreadcrumbsList>
              <BreadcrumbsItem>
                <BreadcrumbsLink href="#">Наборы</BreadcrumbsLink>
                <BreadcrumbsSeparator />
              </BreadcrumbsItem>
              <BreadcrumbsItem>
                <BreadcrumbsLink href="#">Продажи</BreadcrumbsLink>
                <BreadcrumbsSeparator />
              </BreadcrumbsItem>
              <BreadcrumbsItem>
                <BreadcrumbsLink current>За квартал</BreadcrumbsLink>
              </BreadcrumbsItem>
            </BreadcrumbsList>
          </Breadcrumbs>
        ),
      },
    ],
  },
  {
    id: "pagination",
    title: "Страницы",
    group: "Навигация",
    slots: ["pagination", "pagination-item", "pagination-ellipsis", "pagination-previous", "pagination-next"],
    cases: [
      {
        id: "basic",
        title: "Базовые",
        note: "Номера и кнопки перехода — один вид: это ряд кнопок одного назначения. Текущая страница сплошным акцентом, чтобы её видеть до чтения цифры.",
        render: () => (
          <Pagination
            count={12}
            itemComponent={(props) => <PaginationItem page={props.page}>{props.page}</PaginationItem>}
            ellipsisComponent={() => <PaginationEllipsis>…</PaginationEllipsis>}
          >
            <PaginationPrevious>←</PaginationPrevious>
            <PaginationItems />
            <PaginationNext>→</PaginationNext>
          </Pagination>
        ),
      },
    ],
  },
  {
    id: "link",
    title: "Ссылка",
    group: "Навигация",
    slots: ["link"],
    cases: [
      {
        id: "basic",
        title: "Базовая",
        note: "Подчёркивание отодвинуто от буквы: вплотную оно перечёркивает нижние выносные у «р» и «у».",
        render: () => (
          <div class="case__stack">
            <span>
              Правила зоны описаны в <Link href="#">контракте</Link>, а ловушки — в{" "}
              <Link href="#">README</Link>.
            </span>
          </div>
        ),
      },
    ],
  },
  {
    id: "image",
    title: "Изображение",
    group: "Структура",
    slots: ["image", "image-img", "image-fallback"],
    cases: [
      {
        id: "fallback",
        title: "Пока не загрузилось",
        note: "Корень держит место: заглушка и картинка занимают его по очереди, и раскладка не прыгает. В отличие от заглушки загрузки, эта не мерцает — неизвестно, приедет ли содержимое вообще.",
        render: () => (
          <div class="case__row">
            <Image style={{ width: "120px", height: "80px" }}>
              <ImageImg src="/нет-такого-файла.png" alt="Схема" />
              <ImageFallback>нет схемы</ImageFallback>
            </Image>
          </div>
        ),
      },
    ],
  },
  {
    id: "menubar",
    title: "Строка меню",
    group: "Навигация",
    slots: ["menubar", "menubar-trigger", "menubar-content", "menubar-item", "menubar-item-label", "menubar-separator"],
    cases: [
      {
        id: "basic",
        title: "Базовая",
        note: "Открывашки — пункты строки, а не кнопки с рамками: рамка есть у самой строки. Переключаются наведением, когда меню уже открыто.",
        render: () => (
          <div class="case__row">
            <Menubar>
              <MenubarMenu>
                <MenubarTrigger>Набор</MenubarTrigger>
                <MenubarPortal>
                  <MenubarContent>
                    <MenubarItem>
                      <MenubarItemLabel>Сохранить</MenubarItemLabel>
                    </MenubarItem>
                    <MenubarSeparator />
                    <MenubarItem>
                      <MenubarItemLabel>Закрыть</MenubarItemLabel>
                    </MenubarItem>
                  </MenubarContent>
                </MenubarPortal>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger>Вид</MenubarTrigger>
                <MenubarPortal>
                  <MenubarContent>
                    <MenubarItem>
                      <MenubarItemLabel>Плотность строк</MenubarItemLabel>
                    </MenubarItem>
                  </MenubarContent>
                </MenubarPortal>
              </MenubarMenu>
            </Menubar>
          </div>
        ),
      },
    ],
  },
  {
    id: "context-menu",
    title: "Контекстное меню",
    group: "Всплывающее",
    slots: ["context-menu-trigger", "context-menu-content", "context-menu-item", "context-menu-item-label", "context-menu-separator"],
    cases: [
      {
        id: "basic",
        title: "Базовое",
        note: "Нажмите правой кнопкой по области. Встаёт ОТ УКАЗАТЕЛЯ: placement и gutter у него не работают, поэтому и появления из точки привязки нет.",
        render: () => (
          <ContextMenu>
            <ContextMenuTrigger class="case__zone">
              Область строки таблицы — правый клик здесь
            </ContextMenuTrigger>
            <ContextMenuPortal>
              <ContextMenuContent>
                <ContextMenuItem>
                  <ContextMenuItemLabel>Открыть</ContextMenuItemLabel>
                </ContextMenuItem>
                <ContextMenuItem>
                  <ContextMenuItemLabel>Дублировать</ContextMenuItemLabel>
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem>
                  <ContextMenuItemLabel>Удалить</ContextMenuItemLabel>
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenuPortal>
          </ContextMenu>
        ),
      },
    ],
  },
  {
    id: "alert-dialog",
    title: "Окно подтверждения",
    group: "Всплывающее",
    slots: [
      "alert-dialog-trigger",
      "alert-dialog-overlay",
      "alert-dialog-content",
      "alert-dialog-title",
      "alert-dialog-description",
      "alert-dialog-close",
    ],
    cases: [
      {
        id: "basic",
        title: "Базовое",
        note: "Отличается от обычного окна поведением: мимо него не закрыться, ответ обязателен. Вид тот же — и держится одним источником правил с модальным окном.",
        render: () => (
          <div class="case__row">
            <AlertDialog>
              <AlertDialogTrigger data-variant="danger">Удалить набор</AlertDialogTrigger>
              <AlertDialogPortal>
                <AlertDialogOverlay />
                <AlertDialogContent>
                  <AlertDialogTitle>Удалить набор?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Набор исчезнет у всех, кто открыл стенд. Отменить будет нельзя.
                  </AlertDialogDescription>
                  <div class="case__row">
                    <Button data-variant="danger">Удалить</Button>
                    <AlertDialogClose data-variant="outline">Отмена</AlertDialogClose>
                  </div>
                </AlertDialogContent>
              </AlertDialogPortal>
            </AlertDialog>
          </div>
        ),
      },
    ],
  },
];

// Кейсы всплывающего и структурного: панель, подсказка, меню, окно, вкладки, разделитель,
// индикатор ожидания.

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuIcon,
  DropdownMenuItem,
  DropdownMenuItemDescription,
  DropdownMenuItemIndicator,
  DropdownMenuItemLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Field,
  Input,
  Label,
  Popover,
  PopoverArrow,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverPortal,
  PopoverTitle,
  PopoverTrigger,
  Separator,
  Spinner,
  Tabs,
  TabsContent,
  TabsIndicator,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@omnifield/probe-web-ui";
import { For } from "solid-js";

import type { Specimen } from "./model.js";

export const OVERLAY_SPECIMENS: Specimen[] = [
  {
    id: "popover",
    title: "Всплывающая панель",
    slots: [
      "popover-trigger",
      "popover-content",
      "popover-arrow",
      "popover-title",
      "popover-description",
      "popover-close",
    ],
    cases: [
      {
        id: "basic",
        title: "Базовая",
        note: "Указатель берёт цвет панели сам — kobalte считывает его с неё, отдельного правила нет.",
        render: () => (
          <div class="case__row">
            <Popover placement="bottom-start" gutter={8}>
              <PopoverTrigger>Вид таблицы</PopoverTrigger>
              <PopoverPortal>
                <PopoverContent>
                  <PopoverArrow />
                  <PopoverTitle>Вид таблицы</PopoverTitle>
                  <PopoverDescription>Порядок и видимость колонок.</PopoverDescription>
                  <PopoverClose data-variant="soft">Готово</PopoverClose>
                </PopoverContent>
              </PopoverPortal>
            </Popover>
          </div>
        ),
      },
      {
        id: "with-form",
        title: "С полем внутри",
        note: "В панель можно увести фокус — этим она и отличается от подсказки.",
        render: () => (
          <div class="case__row">
            <Popover placement="bottom-start" gutter={8}>
              <PopoverTrigger>Переименовать</PopoverTrigger>
              <PopoverPortal>
                <PopoverContent>
                  <PopoverArrow />
                  <PopoverTitle>Новое имя</PopoverTitle>
                  <Field>
                    <Label>Имя набора</Label>
                    <Input value="продажи за квартал" />
                  </Field>
                  <PopoverClose>Сохранить</PopoverClose>
                </PopoverContent>
              </PopoverPortal>
            </Popover>
          </div>
        ),
      },
      {
        id: "placement",
        title: "Сверху",
        note: "Место задаётся опцией на корне, а не отступом в оформлении: координаты пишет позиционировщик.",
        render: () => (
          <div class="case__row">
            <Popover placement="top" gutter={8}>
              <PopoverTrigger>Панель сверху</PopoverTrigger>
              <PopoverPortal>
                <PopoverContent>
                  <PopoverArrow />
                  <PopoverDescription>
                    Появление растёт из точки привязки — её сообщает позиционировщик.
                  </PopoverDescription>
                </PopoverContent>
              </PopoverPortal>
            </Popover>
          </div>
        ),
      },
    ],
  },
  {
    id: "tooltip",
    title: "Подсказка",
    slots: ["tooltip-trigger", "tooltip-content", "tooltip-arrow"],
    cases: [
      {
        id: "basic",
        title: "Базовая",
        note: "Наведите или дайте фокус клавишей. В подсказку нельзя увести фокус — она только поясняет.",
        render: () => (
          <div class="case__row">
            <Tooltip openDelay={150}>
              {/* Триггер — ОБЁРТКА, а не сама кнопка: `as={Button}` отдал бы узлу зацепку триггера
                  вместо зацепки кнопки, и кнопка приехала бы голой (видно было на витрине).
                  Подсказку вешают на что угодно, поэтому у её триггера своего вида и нет. */}
              <TooltipTrigger as="span">
                <Button>Наведите</Button>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent>
                  <TooltipArrow />
                  Сохранит текущий набор фильтров
                </TooltipContent>
              </TooltipPortal>
            </Tooltip>
          </div>
        ),
      },
      {
        id: "long",
        title: "Длинный текст",
        note: "Потолок ширины держит подсказку читаемой колонкой, а не строкой во весь экран.",
        render: () => (
          <div class="case__row">
            <Tooltip openDelay={150}>
              <TooltipTrigger as="span">
                <Button>Длинное пояснение</Button>
              </TooltipTrigger>
              <TooltipPortal>
                <TooltipContent>
                  <TooltipArrow />
                  Набор сохраняется на сервере и становится виден всем, кто открыл стенд; удалить
                  его сможет тот, кто создал.
                </TooltipContent>
              </TooltipPortal>
            </Tooltip>
          </div>
        ),
      },
    ],
  },
  {
    id: "dropdown-menu",
    title: "Меню действий",
    slots: [
      "dropdown-menu-trigger",
      "dropdown-menu-icon",
      "dropdown-menu-content",
      "dropdown-menu-item",
      "dropdown-menu-item-label",
      "dropdown-menu-item-description",
      "dropdown-menu-item-indicator",
      "dropdown-menu-checkbox-item",
      "dropdown-menu-group",
      "dropdown-menu-group-label",
      "dropdown-menu-separator",
      "dropdown-menu-sub-trigger",
      "dropdown-menu-sub-content",
    ],
    cases: [
      {
        id: "basic",
        title: "Базовое",
        render: () => (
          <div class="case__row">
            <DropdownMenu placement="bottom-start" gutter={4}>
              <DropdownMenuTrigger>
                Действия <DropdownMenuIcon>▾</DropdownMenuIcon>
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent>
                  <DropdownMenuItem>
                    <DropdownMenuItemLabel>Переименовать</DropdownMenuItemLabel>
                    <DropdownMenuItemDescription>F2</DropdownMenuItemDescription>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <DropdownMenuItemLabel>Дублировать</DropdownMenuItemLabel>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>
                    <DropdownMenuItemLabel>Удалить</DropdownMenuItemLabel>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
          </div>
        ),
      },
      {
        id: "rich",
        title: "Группы, флажки, подменю",
        note: "Четыре разных вида строки: пункт, пункт-флажок, открывашка подменю и подпись группы. У каждого своя роль доступности.",
        render: () => (
          <div class="case__row">
            <DropdownMenu placement="bottom-start" gutter={4}>
              <DropdownMenuTrigger>
                Ещё <DropdownMenuIcon>▾</DropdownMenuIcon>
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent>
                  <DropdownMenuGroup>
                    <DropdownMenuGroupLabel>Вид</DropdownMenuGroupLabel>
                    <DropdownMenuCheckboxItem checked>
                      <DropdownMenuItemIndicator>✓</DropdownMenuItemIndicator>
                      <DropdownMenuItemLabel>Сетка</DropdownMenuItemLabel>
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem>
                      <DropdownMenuItemIndicator>✓</DropdownMenuItemIndicator>
                      <DropdownMenuItemLabel>Легенда</DropdownMenuItemLabel>
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuGroup>

                  <DropdownMenuSeparator />

                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      Экспорт
                      <DropdownMenuIcon>▸</DropdownMenuIcon>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem>
                          <DropdownMenuItemLabel>CSV</DropdownMenuItemLabel>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <DropdownMenuItemLabel>JSON</DropdownMenuItemLabel>
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
          </div>
        ),
      },
      {
        id: "long",
        title: "Длинные подписи",
        note: "Подпись обрезается многоточием, ярлык справа остаётся на месте.",
        render: () => (
          <div class="case__row">
            <DropdownMenu placement="bottom-start" gutter={4}>
              <DropdownMenuTrigger>
                Колонки <DropdownMenuIcon>▾</DropdownMenuIcon>
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent>
                  <For
                    each={[
                      "Наименование контрагента",
                      "Дата последней операции",
                      "Сумма с учётом скидки",
                    ]}
                  >
                    {(label) => (
                      <DropdownMenuItem>
                        <DropdownMenuItemLabel>{label}</DropdownMenuItemLabel>
                      </DropdownMenuItem>
                    )}
                  </For>
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
          </div>
        ),
      },
    ],
  },
  {
    id: "dialog",
    title: "Модальное окно",
    slots: [
      "dialog-trigger",
      "dialog-overlay",
      "dialog-content",
      "dialog-title",
      "dialog-description",
      "dialog-close",
    ],
    cases: [
      {
        id: "basic",
        title: "Базовое",
        note: "Затемнение — отдельный узел; без правил оформления оно невидимо, кит и здесь остаётся безголовым.",
        render: () => (
          <div class="case__row">
            <Dialog>
              <DialogTrigger>Сохранить набор</DialogTrigger>
              <DialogPortal>
                <DialogOverlay />
                <DialogContent>
                  <DialogTitle>Сохранить набор</DialogTitle>
                  <DialogDescription>
                    Набор станет виден всем, кто открыл стенд.
                  </DialogDescription>
                  <Field>
                    <Label>Имя набора</Label>
                    <Input placeholder="продажи за квартал" />
                  </Field>
                  <DialogClose data-variant="outline">Отмена</DialogClose>
                </DialogContent>
              </DialogPortal>
            </Dialog>
          </div>
        ),
      },
      {
        id: "scroll",
        title: "Длинное содержимое",
        note: "Окно не выше экрана: содержимое прокручивается внутри, а страница под окном остаётся запертой.",
        render: () => (
          <div class="case__row">
            <Dialog>
              <DialogTrigger>Условия</DialogTrigger>
              <DialogPortal>
                <DialogOverlay />
                <DialogContent>
                  <DialogTitle>Условия хранения</DialogTitle>
                  <For each={[...Array(12).keys()]}>
                    {(i) => (
                      <DialogDescription>
                        Пункт {i + 1}. Набор хранится на сервере, пока его не удалит владелец;
                        имя набора уникально в пределах стенда.
                      </DialogDescription>
                    )}
                  </For>
                  <DialogClose data-variant="outline">Понятно</DialogClose>
                </DialogContent>
              </DialogPortal>
            </Dialog>
          </div>
        ),
      },
    ],
  },
  {
    id: "tabs",
    title: "Вкладки",
    slots: ["tabs", "tabs-list", "tabs-trigger", "tabs-indicator", "tabs-content"],
    cases: [
      {
        id: "basic",
        title: "Базовые",
        note: "Полоска-указатель ездит сама: её место и размер считает кит, мы задаём только вид.",
        render: () => (
          <Tabs defaultValue="colors">
            <TabsList>
              <TabsTrigger value="colors">Цвета</TabsTrigger>
              <TabsTrigger value="sizes">Размеры</TabsTrigger>
              <TabsTrigger value="motion" disabled>
                Движение
              </TabsTrigger>
              <TabsIndicator />
            </TabsList>
            <TabsContent value="colors">Ступени шкал и роли поверх них.</TabsContent>
            <TabsContent value="sizes">Интервалы, высоты контролов, кегли.</TabsContent>
            <TabsContent value="motion">Длительности и кривые.</TabsContent>
          </Tabs>
        ),
      },
      {
        id: "many",
        title: "Много вкладок",
        note: "Список переносится по строкам — полоска остаётся под активной вкладкой.",
        render: () => (
          <Tabs defaultValue="t1">
            <TabsList>
              <For each={[...Array(8).keys()]}>
                {(i) => <TabsTrigger value={`t${i + 1}`}>Раздел {i + 1}</TabsTrigger>}
              </For>
              <TabsIndicator />
            </TabsList>
            <For each={[...Array(8).keys()]}>
              {(i) => <TabsContent value={`t${i + 1}`}>Содержимое раздела {i + 1}.</TabsContent>}
            </For>
          </Tabs>
        ),
      },
    ],
  },
  {
    id: "separator",
    title: "Разделитель",
    slots: ["separator"],
    cases: [
      {
        id: "basic",
        title: "Горизонтальный и вертикальный",
        note: "Цвет тише границы элемента: у базы это разные ступени, и разделитель по замыслу спокойнее.",
        render: () => (
          <div class="case__stack">
            <span>Над чертой</span>
            <Separator />
            <span>Под чертой</span>
            <div class="case__inline">
              <span>Слева</span>
              <Separator orientation="vertical" />
              <span>Справа</span>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "spinner",
    title: "Индикатор ожидания",
    slots: ["spinner"],
    cases: [
      {
        id: "basic",
        title: "Сам по себе и в тексте",
        note: "Размер в em и цвет currentColor: индикатор садится на кегль места, куда его поставили.",
        render: () => (
          <div class="case__row">
            <Spinner aria-label="Загрузка" />
            <span class="case__inline">
              <Spinner aria-label="Загрузка" /> в строке текста
            </span>
          </div>
        ),
      },
      {
        id: "in-button",
        title: "В кнопке",
        note: "На брендовом фоне индикатор наследует его подпись — потому и currentColor.",
        render: () => (
          <div class="case__row">
            <Button>
              <Spinner aria-label="Идёт сохранение" />
              Сохраняем
            </Button>
          </div>
        ),
      },
      {
        id: "reduced",
        title: "При уменьшенном движении",
        note: "Вращение не выключается, а замедляется: неподвижное кольцо соврало бы, что работа встала.",
        render: () => (
          <div class="case__row">
            <Spinner aria-label="Загрузка" />
            <span class="case__hint">
              Проверяется настройкой системы «уменьшить движение».
            </span>
          </div>
        ),
      },
    ],
  },
];

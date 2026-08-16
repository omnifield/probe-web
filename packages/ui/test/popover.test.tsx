import { createSignal } from "solid-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  Popover,
  PopoverAnchor,
  PopoverArrow,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverPortal,
  PopoverTitle,
  PopoverTrigger,
} from "../src/popover.jsx";
import { cleanup, mount, one, press } from "./dom.jsx";

afterEach(cleanup);

/** Полная сборка панели — та же, что стоит примером в доке компонента. */
function Settings(props: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  anchor?: boolean;
}) {
  return (
    <Popover open={props.open} onOpenChange={props.onOpenChange}>
      <PopoverTrigger>Настройки</PopoverTrigger>
      {props.anchor ? <PopoverAnchor /> : null}
      <PopoverPortal>
        <PopoverContent>
          <PopoverArrow />
          <PopoverTitle>Вид таблицы</PopoverTitle>
          <PopoverDescription>Порядок и видимость колонок</PopoverDescription>
          <PopoverClose>Готово</PopoverClose>
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  );
}

describe("Popover — закрытое состояние", () => {
  it("корень своего узла НЕ рендерит — в документе только кнопка", () => {
    // Это и есть причина, по которой зацепки `data-slot="popover"` не существует: у корня нет
    // узла, а зацепка обязана быть НА узле. Проверяем фактом, а не доверием к доке.
    const host = mount(() => <Settings />);

    expect(host.children.length).toBe(1);
    expect(host.firstElementChild?.getAttribute("data-slot")).toBe("popover-trigger");
    expect(host.querySelector("[data-slot='popover']")).toBeNull();
  });

  it("кнопка — один `<button>`, объявляющий всплывающую панель", () => {
    const trigger = one<HTMLButtonElement>(mount(() => <Settings />), "[data-slot='popover-trigger']");

    expect(trigger.tagName).toBe("BUTTON");
    expect(trigger.getAttribute("aria-haspopup")).toBe("dialog");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("панели в документе нет вовсе, пока не открыли", () => {
    mount(() => <Settings />);

    // Панель живёт в портале, и до открытия портал пуст — не «скрыта стилями», а отсутствует.
    expect(document.querySelector("[data-slot='popover-content']")).toBeNull();
  });

  it("зацепка позиционирования появляется только когда её попросили", () => {
    mount(() => <Settings />);
    expect(document.querySelector("[data-slot='popover-anchor']")).toBeNull();

    cleanup();

    mount(() => <Settings anchor />);
    expect(document.querySelector("[data-slot='popover-anchor']")).not.toBeNull();
  });
});

describe("Popover — открытие и содержимое", () => {
  it("нажатие на кнопку открывает панель", () => {
    const host = mount(() => <Settings />);
    press(one(host, "[data-slot='popover-trigger']"));

    expect(one(document, "[data-slot='popover-content']").tagName).toBe("DIV");
    expect(one(host, "[data-slot='popover-trigger']").getAttribute("aria-expanded")).toBe("true");
  });

  it("заголовок и пояснение связаны с панелью, а не просто лежат внутри", () => {
    mount(() => <Settings open />);

    const content = one(document, "[data-slot='popover-content']");
    const title = one(document, "[data-slot='popover-title']");
    const description = one(document, "[data-slot='popover-description']");

    expect(title.tagName).toBe("H2");
    expect(description.tagName).toBe("P");
    expect(content.getAttribute("aria-labelledby")).toBe(title.id);
    expect(content.getAttribute("aria-describedby")).toBe(description.id);
  });

  it("кнопка закрытия закрывает панель и зовёт `onOpenChange`", () => {
    const onOpenChange = vi.fn();
    const [open, setOpen] = createSignal(true);
    mount(() => (
      <Settings
        open={open()}
        onOpenChange={(next) => {
          onOpenChange(next);
          setOpen(next);
        }}
      />
    ));

    press(one(document, "[data-slot='popover-close']"));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(document.querySelector("[data-slot='popover-content']")).toBeNull();
  });

  it("управляемая открытость приходит снаружи, а не из клика", () => {
    const [open, setOpen] = createSignal(false);
    mount(() => <Settings open={open()} />);

    expect(document.querySelector("[data-slot='popover-content']")).toBeNull();

    setOpen(true);

    expect(document.querySelector("[data-slot='popover-content']")).not.toBeNull();
  });
});

describe("Popover — названные отступления", () => {
  it("панель приезжает внутри позиционера — узла на один больше", () => {
    mount(() => <Settings open />);

    const content = one(document, "[data-slot='popover-content']");

    // То же отступление, что у `SelectContent`, и оно названо в доке компонента: координаты
    // floating-ui пишет в стиль отдельного узла-позиционера. Тест держит его ЯВНЫМ.
    expect(content.parentElement?.hasAttribute("data-popper-positioner")).toBe(true);
    expect(content.parentElement?.children.length).toBe(1);
  });

  it("стрелка несёт `<svg>` внутри и стиль позиционирования", () => {
    mount(() => <Settings open />);

    const arrow = one(document, "[data-slot='popover-arrow']");

    // Второе названное отступление: узел не один (внутри вектор, иначе стрелку не повернуть
    // вслед за фактическим положением панели) и на нём есть инлайновый стиль.
    expect(arrow.querySelector("svg")).not.toBeNull();
    expect(arrow.getAttribute("aria-hidden")).toBe("true");
    expect(arrow.getAttribute("style")).toContain("position: absolute");
    expect(arrow.hasAttribute("class")).toBe(false);
  });

  it("цвет стрелки — ЗЕРКАЛО панели, а не наш выбор", () => {
    // Вот почему стиль на стрелке приемлем и не делает кит одетым: `fill` и `stroke` kobalte
    // СЧИТЫВАЕТ с самой панели. Покрасил панель потребитель — стрелка пошла за ним. Проверка
    // именно этого: своей краски у кита нет, есть повтор чужой.
    mount(() => (
      <Popover open>
        <PopoverTrigger>Настройки</PopoverTrigger>
        <PopoverPortal>
          <PopoverContent style={{ "background-color": "rgb(1, 2, 3)" }}>
            <PopoverArrow />
          </PopoverContent>
        </PopoverPortal>
      </Popover>
    ));

    expect(one(document, "[data-slot='popover-arrow']").getAttribute("style")).toContain(
      "fill: rgb(1, 2, 3)",
    );
  });
});

describe("Popover — части из портала пропускают своё насквозь", () => {
  // Общий перечень `contract.test.tsx` эти части не покрывает: он смотрит в контейнер
  // монтирования, а панель живёт в портале, то есть в конце документа. Проверки те же —
  // `ref` доезжает до узла, обработчик потребителя вызывается, класс приходит без примеси.
  const PARTS = [
    { slot: "popover-content", render: (p: Record<string, unknown>) => <PopoverContent {...p} /> },
    { slot: "popover-arrow", render: (p: Record<string, unknown>) => <PopoverArrow {...p} /> },
    { slot: "popover-title", render: (p: Record<string, unknown>) => <PopoverTitle {...p} /> },
    {
      slot: "popover-description",
      render: (p: Record<string, unknown>) => <PopoverDescription {...p} />,
    },
    { slot: "popover-close", render: (p: Record<string, unknown>) => <PopoverClose {...p} /> },
  ] as const;

  const inPanel = (part: (typeof PARTS)[number], props: Record<string, unknown>) => (
    <Popover open>
      <PopoverTrigger>Настройки</PopoverTrigger>
      <PopoverPortal>
        <PopoverContent>{part.slot === "popover-content" ? null : part.render(props)}</PopoverContent>
      </PopoverPortal>
    </Popover>
  );

  for (const part of PARTS) {
    it(part.slot, () => {
      let received: Element | undefined;
      const onClick = vi.fn();

      mount(() =>
        part.slot === "popover-content" ? (
          <Popover open>
            <PopoverTrigger>Настройки</PopoverTrigger>
            <PopoverPortal>
              <PopoverContent
                ref={(el: Element) => {
                  received = el;
                }}
                onClick={onClick}
                class="мой-класс"
              />
            </PopoverPortal>
          </Popover>
        ) : (
          inPanel(part, {
            ref: (el: Element) => {
              received = el;
            },
            onClick,
            class: "мой-класс",
          })
        ),
      );

      const node = one(document, `[data-slot='${part.slot}']`);

      expect(received).toBe(node);
      expect(node.getAttribute("class")).toBe("мой-класс");

      (node as HTMLElement).click();
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  }
});

describe("Popover — стилей по умолчанию нет", () => {
  /** Части, на которых kobalte держит СВОЙ служебный стиль: позиционирование и анимация. */
  const WITH_SERVICE_STYLE = new Set(["popover-content", "popover-arrow"]);

  it("ни одна часть не приносит своего класса", () => {
    mount(() => <Settings open anchor />);

    for (const node of document.querySelectorAll("[data-slot^='popover']")) {
      expect(node.hasAttribute("class")).toBe(false);

      if (!WITH_SERVICE_STYLE.has(node.getAttribute("data-slot") as string)) {
        expect(node.hasAttribute("style")).toBe(false);
      }
    }
  });

  it("служебный стиль панели — про механику, а не про вид", () => {
    // На панели kobalte держит `position: relative`, `pointer-events` и переменную начала
    // трансформации (по ней потребитель пишет анимацию появления). Ни цвета, ни шрифта, ни
    // скругления там нет — иначе кит перестал бы быть безголовым втихую.
    mount(() => <Settings open />);

    const style = one(document, "[data-slot='popover-content']").getAttribute("style") ?? "";

    expect(style).toContain("transform-origin");
    expect(style).not.toMatch(/color|font|radius|shadow|padding/);
  });
});

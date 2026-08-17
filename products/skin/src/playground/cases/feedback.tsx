// Кейсы обратной связи: полоса выполнения, заглушка загрузки, уведомления.

import {
  Button,
  Progress,
  ProgressFill,
  ProgressLabel,
  ProgressTrack,
  ProgressValueLabel,
  Skeleton,
  Toast,
  ToastClose,
  ToastDescription,
  ToastList,
  ToastProgressFill,
  ToastProgressTrack,
  ToastRegion,
  ToastTitle,
  toaster,
} from "@omnifield/probe-web-ui";
import { For } from "solid-js";

import type { Specimen } from "./model.js";

/**
 * Область уведомлений ставится ОДИН раз — так их и зовут в приложении: регион в скелете, а
 * дальше вызов из кода. Здесь она стоит внутри кейса, потому что стенд и есть приложение.
 */
function ToastStand() {
  const show = (title: string, description: string) =>
    toaster.show((props) => (
      <Toast toastId={props.toastId}>
        <ToastTitle>{title}</ToastTitle>
        <ToastDescription>{description}</ToastDescription>
        <ToastClose aria-label="Закрыть">×</ToastClose>
        <ToastProgressTrack>
          <ToastProgressFill />
        </ToastProgressTrack>
      </Toast>
    ));

  return (
    <>
      <div class="case__row">
        <Button onClick={() => show("Набор сохранён", "Виден всем, кто открыл стенд.")}>
          Показать уведомление
        </Button>
        <Button
          data-variant="outline"
          onClick={() => show("Не удалось сохранить", "Служба не ответила за пять секунд.")}
        >
          Ещё одно
        </Button>
      </div>
      <ToastRegion>
        <ToastList />
      </ToastRegion>
    </>
  );
}

export const FEEDBACK_SPECIMENS: Specimen[] = [
  {
    id: "progress",
    title: "Полоса выполнения",
    group: "Обратная связь",
    slots: ["progress", "progress-label", "progress-value-label", "progress-track", "progress-fill"],
    cases: [
      {
        id: "basic",
        title: "Базовая",
        note: "Долю кит отдаёт переменной, а чем её выразить — ширина, трансформация, маска — решает оформление. Здесь ширина: она не создаёт слоя композитора.",
        render: () => (
          <div class="case__stack">
            <Progress value={64}>
              <div class="case__inline case__spread">
                <ProgressLabel>Загрузка набора</ProgressLabel>
                <ProgressValueLabel />
              </div>
              <ProgressTrack>
                <ProgressFill />
              </ProgressTrack>
            </Progress>
          </div>
        ),
      },
      {
        id: "values",
        title: "Крайние значения",
        note: "У нуля дорожка не должна выглядеть сломанной, у сотни — заливка обязана закрыть её полностью, без щели у скругления.",
        render: () => (
          <div class="case__stack">
            <For each={[0, 50, 100]}>
              {(value) => (
                <Progress value={value}>
                  <div class="case__inline case__spread">
                    <ProgressLabel>{value} процентов</ProgressLabel>
                    <ProgressValueLabel />
                  </div>
                  <ProgressTrack>
                    <ProgressFill />
                  </ProgressTrack>
                </Progress>
              )}
            </For>
          </div>
        ),
      },
      {
        id: "indeterminate",
        title: "Неизвестная доля",
        note: "Это НЕ ноль процентов: работа идёт, но сколько осталось — неизвестно. Пустая полоса соврала бы, поэтому отрезок бежит по дорожке.",
        render: () => (
          <div class="case__stack">
            <Progress indeterminate>
              <ProgressLabel>Считаем итоги</ProgressLabel>
              <ProgressTrack>
                <ProgressFill />
              </ProgressTrack>
            </Progress>
          </div>
        ),
      },
    ],
  },
  {
    id: "skeleton",
    title: "Заглушка загрузки",
    group: "Обратная связь",
    slots: ["skeleton"],
    cases: [
      {
        id: "basic",
        title: "Базовая",
        note: "Держит МЕСТО будущего содержимого: когда данные приедут, раскладка не прыгнет. Мерцает прозрачностью, а не цветом — она стоит на произвольном фоне.",
        render: () => (
          <div class="case__stack">
            <Skeleton height={16} width={220} />
            <Skeleton height={16} width={160} />
            <Skeleton height={16} width={190} />
          </div>
        ),
      },
      {
        id: "shape",
        title: "Место под разные вещи",
        note: "Размеры задаёт потребитель — он знает, что там будет: строка текста, аватар, картинка.",
        render: () => (
          <div class="case__row">
            <Skeleton circle width={40} height={40} />
            <div class="case__stack">
              <Skeleton height={12} width={140} />
              <Skeleton height={12} width={100} />
            </div>
          </div>
        ),
      },
      {
        id: "hidden",
        title: "Данные приехали",
        note: "Скрытая заглушка не мерцает: анимация на невидимом узле продолжала бы тратить кадры.",
        render: () => (
          <div class="case__stack">
            <Skeleton visible={false} height={16} width={220}>
              Содержимое на месте
            </Skeleton>
          </div>
        ),
      },
    ],
  },
  {
    id: "toast",
    title: "Уведомления",
    group: "Обратная связь",
    slots: [
      "toast-region",
      "toast-list",
      "toast",
      "toast-title",
      "toast-description",
      "toast-close",
      "toast-progress-track",
      "toast-progress-fill",
    ],
    cases: [
      {
        id: "basic",
        title: "Базовое",
        note: "Зовутся КОДОМ: область и стопка стоят один раз, дальше вызов. Нить у нижнего края — таймер ЖИЗНИ уведомления, а не полоса задачи: спутать дорого, решат, что закрытие отменит работу.",
        render: () => <ToastStand />,
      },
    ],
  },
];

// Витрина компонента — показывает один выбранный компонент (сборка из параметра маршрута) через
// `ComponentPreview`.
//
// БЕЗ ВАРИАНТОВ ПОКА: прежняя версия оборачивала показ в аккордеон по именам вариаций НАДЕТОГО
// наряда (`entities/outfit`'s `variantsOf`) — без наряда (сущность снята) вариант всегда один,
// оборачивать не во что. Вернётся вместе с пересборкой `entities/outfit`.
import { ComponentPreview } from "#/widgets/component-preview/component-preview.jsx";

export function ComponentShowcasePage(props: {
  component: string;
  assembly?: string;
}) {
  return <ComponentPreview component={props.component} assembly={props.assembly} />;
}

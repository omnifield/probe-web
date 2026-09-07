import { Docs } from "#/entities/component";

// ПЛЕЙСХОЛДЕР — форма виджета подготовлена заранее (верх `WorkspaceRightbar`, над `Input`),
// остальное содержимое (сведения о показываемом компоненте, кроме доков) ещё не объявлено.
export function Info() {
  return (
    <p>
      Инфо компонента (плейсхолдер) <Docs />
    </p>
  );
}

/**
 * Русский (ru) — переводы страниц базы знаний (вики)
 *
 * Поверхности:
 *   - PagesView (дерево слева + панель редактора)
 *   - PageMoveDialog
 *   - PagePermissionsDialog
 */
export default {
  pages: {
    // Боковая панель / навигация по дереву
    backWorkspace: 'Рабочее пространство',
    treeHeading: 'Страницы',
    addPageAria: 'Добавить страницу',
    untitled: 'Без названия',
    treeLoading: 'Загрузка…',
    treeEmptyTitle: 'Страниц пока нет',
    treeEmptyDescription: 'Используйте кнопку + выше, чтобы создать первую страницу.',

    // Меню действий для элемента (кебаб-меню)
    menuAddChild: 'Добавить дочернюю страницу',
    menuRename: 'Переименовать',
    menuMove: 'Переместить',
    menuPermissions: 'Права доступа',
    menuHistory: 'История',
    menuPrint: 'Печать',
    menuArchive: 'Архивировать',

    // Режим печати / сохранения в PDF без интерфейса (открывается в новой вкладке)
    print: {
      button: 'Печать',
      back: 'Назад к странице',
      loading: 'Подготовка страницы к печати…',
      error: 'Не удалось загрузить страницу.',
    },

    // Панель истории версий
    history: {
      title: 'История версий',
      empty: 'Версий пока нет.',
      loadError: 'Не удалось загрузить историю версий.',
      restoreTitle: 'Восстановить версию №{rev}?',
      restoreMessage:
        'Это заменит текущее содержимое страницы содержимым выбранной версии и создаст новую версию, фиксирующую восстановление.',
      restoreConfirm: 'Восстановить',
      restoreAction: 'Восстановить №{rev}',
      restoring: 'Восстановление…',
      restoredOK: 'Версия №{rev} восстановлена.',
      restoreError: 'Не удалось восстановить версию.',
    },

    // Панель страницы
    pageLoading: 'Загрузка страницы…',
    emptyPaneTitle: 'Страницы базы знаний',
    emptyPaneDescription: 'Выберите страницу в дереве или создайте новую, чтобы начать.',
    titlePlaceholder: 'Без названия',
    editorPlaceholder: 'Начните писать…',
    tocHeading: 'На этой странице',
    tocAriaLabel: 'Оглавление',

    // Кнопки действий на открытой странице
    save: 'Сохранить',
    move: 'Переместить',
    permissions: 'Права доступа',
    archive: 'Архивировать',

    // Индикатор статуса автосохранения рядом с кебаб-меню панели инструментов
    statusSaving: 'Сохранение…',
    statusSaved: 'Сохранено',
    statusUnsaved: 'Не сохранено',
    statusError: 'Ошибка сохранения',

    // Переключатель режимов «Редактирование / Чтение»
    modeEdit: 'Редактирование',
    modeRead: 'Чтение',
    modeAria: 'Режим просмотра',
    canvasWide: 'Использовать полноширинный холст',
    canvasComfortable: 'Использовать холст удобной ширины',

    // Резервные сообщения об ошибках
    errorLoadTree: 'Не удалось загрузить страницы',
    errorLoadPage: 'Не удалось загрузить страницу',
    errorSave: 'Не удалось сохранить',
    errorCreate: 'Не удалось создать страницу',
    errorArchive: 'Не удалось архивировать',

    // Подтверждения отмены изменений / архивирования
    discardTitle: 'Отменить несохранённые изменения?',
    discardMessage:
      'На текущей странице есть несохранённые изменения. Они будут потеряны при переключении.',
    discardConfirm: 'Отменить',
    discardCancel: 'Продолжить редактирование',
    archiveTitle: 'Архивировать «{title}»?',
    archiveMessage:
      'Это архивирует страницу и все дочерние страницы. Это действие нельзя отменить.',
    archiveConfirm: 'Архивировать',

    // Список архивных страниц (полноэкранный вид только для админов, открывается из шапки боковой панели)
    archivedOpenAria: 'Просмотреть архивные страницы',
    archivedHeading: 'Архивные страницы',
    archivedSubtitle: 'Просматривайте и восстанавливайте ранее архивированные страницы.',
    archivedBack: 'Назад к страницам',
    archivedEmpty: 'Архивных страниц нет',
    archivedColTitle: 'Название',
    archivedColArchivedAt: 'Архивировано',
    archivedColArchivedBy: 'Кем архивировано',
    archivedUnarchive: 'Восстановить из архива',
    archivedUnarchiveTitle: 'Восстановить «{title}» из архива?',
    archivedUnarchiveMessage:
      'Страница снова появится в дереве. Если родительская страница всё ещё в архиве, эта страница останется скрытой, пока вы не восстановите и родительскую страницу.',
    archivedUnarchiveConfirm: 'Восстановить из архива',
    archivedUnarchiveOK: '«{title}» восстановлена',
    archivedLoadError: 'Не удалось загрузить архивные страницы',
    archivedUnarchiveError: 'Не удалось восстановить страницу из архива',

    // Диалог перемещения
    moveTitle: 'Переместить «{title}»',
    moveSubtitle:
      'Выберите новую родительскую страницу. Страницы внутри текущей скрыты, так как они создали бы цикл.',
    moveWorkspaceLabel: 'Целевое рабочее пространство',
    moveWorkspacePlaceholder: 'Выберите рабочее пространство…',
    moveParentLabel: 'Родительская страница',
    moveSearchPlaceholder: 'Поиск страниц…',
    moveRoot: 'Корень рабочего пространства',
    moveCrossWorkspaceSummary: 'Страниц в этом поддереве: {count}.',
    moveCrossWorkspacePolicy:
      'Совпадающие метки сохраняются. Явные права доступа, связи с рабочими элементами и ссылки на агентские навыки удаляются.',
    moveButton: 'Переместить',
    moveCancel: 'Отмена',
    errorLoadWorkspaces: 'Не удалось загрузить рабочие пространства',
    errorMove: 'Не удалось переместить',

    // Диалог прав доступа
    permsTitle: 'Права доступа к странице',
    permsEffectiveAccess: 'Ваш действующий уровень доступа: {level}',
    permsEffectiveAccessNone: 'нет',
    permsLoading: 'Загрузка…',
    permsInheritLabel: 'Наследовать права доступа от родительских страниц',
    permsInheritHint:
      'Если наследование включено и явных прав нет, доступ определяется ролью в рабочем пространстве. Отключение наследования без явных прав ограничивает доступ к странице только администраторами.',
    permsExplicitGrants: 'Явные права доступа',
    permsEmptyGrantsTitle: 'На этой странице нет явных прав доступа.',
    permsEmptyGrantsDescription: 'Наследование и роли рабочего пространства всё равно применяются.',
    permsColumnPrincipal: 'Субъект',
    permsColumnLevel: 'Уровень',
    permsRemove: 'Удалить',
    permsRemoveTitle: 'Удалить право доступа?',
    permsRemoveMessage: 'Это право будет удалено со страницы. Вы сможете добавить его снова позже.',
    permsRemoveConfirm: 'Удалить',
    permsRemoveCancel: 'Отмена',
    permsClose: 'Закрыть',
    permsAdd: 'Добавить',
    permsPrincipalUser: 'Пользователь',
    permsPrincipalGroup: 'Группа',
    permsPrincipalRole: 'Роль',
    permsLevelView: 'Просмотр',
    permsLevelEdit: 'Редактирование',
    permsLevelAdmin: 'Администрирование',
    permsPickUser: 'Выберите пользователя',
    permsPickGroup: 'Выберите группу',
    permsPickRole: 'Выберите роль',
    permsErrorNoPrincipal: 'Выберите субъект перед добавлением права доступа',
    permsErrorLoad: 'Не удалось загрузить права доступа',
    permsErrorInherit: 'Не удалось обновить наследование',
    permsErrorGrant: 'Не удалось добавить право доступа',
    permsErrorRevoke: 'Не удалось отозвать право доступа',

    // Метки страниц (в рамках рабочего пространства, привязываются только к страницам)
    labelsTitle: 'Метки',
    labelsAdd: 'Добавить метку',
    labelsCreate: 'Создать метку',
    labelsCreateNamed: 'Создать «{name}»',
    labelsSearchPlaceholder: 'Найти или создать…',
    labelsFilterTitle: 'Фильтр по метке',
    labelsFilterPlaceholder: 'Фильтровать страницы по метке',
    labelsFilterClear: 'Сбросить фильтр',
    labelsEmpty: 'Меток пока нет',
    labelsNameRequired: 'Название метки обязательно',
    labelsDuplicate: 'Метка с таким названием уже существует',
    labelsDeleteConfirm: 'Удалить эту метку? Она будет снята со всех страниц, к которым прикреплена.',
    labelsDelete: 'Удалить метку',
    labelsRemoveAria: 'Удалить метку {name}',
    labelsErrorLoad: 'Не удалось загрузить метки',
    labelsErrorSave: 'Не удалось сохранить метку',
    labelsErrorAttach: 'Не удалось прикрепить метку',
    labelsErrorDetach: 'Не удалось открепить метку',

    // Поиск по названию в боковой панели
    searchAria: 'Поиск страниц',
    searchPlaceholder: 'Поиск страниц…',
    searchClear: 'Очистить поиск',

    // Разворачивание/сворачивание дерева в боковой панели
    toggleSubtreeAria: 'Развернуть/свернуть дочерние страницы {title}',
    expandAllAria: 'Развернуть все',
    collapseAllAria: 'Свернуть все',

    // Кнопка и всплывающее окно связанных рабочих элементов (справа вверху на детальной странице)
    workItemsButton: 'Рабочие элементы',
    workItemsAria: 'Показать связанные рабочие элементы',
    workItemsEmpty: 'Пока нет связанных рабочих элементов',
    workItemsLoading: 'Загрузка рабочих элементов…',
    workItemsTitle: 'Рабочие элементы',
    addWorkItem: 'Добавить рабочий элемент',
    addWorkItemCancel: 'Отмена',
    addWorkItemSearchPlaceholder: 'Поиск рабочих элементов…',
    removeWorkItemLink: 'Отвязать рабочий элемент',
    workItemsErrorLoad: 'Не удалось загрузить связанные рабочие элементы',
    workItemsErrorLink: 'Не удалось связать рабочий элемент',
    workItemsErrorUnlink: 'Не удалось отвязать рабочий элемент',
  },
};

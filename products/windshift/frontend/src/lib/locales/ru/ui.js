/**
 * Переводы интерфейса (UI) для русской локализации
 * Включает: pickers, editors, dialogs, components, aria, layout, widgets, footer
 */

export default {
  pickers: {
    // Общее
    select: 'Выбрать',
    search: 'Поиск',
    options: 'Параметры',
    clearSelection: 'Очистить выбор',
    noResultsFor: 'Нет результатов по запросу «{query}»',
    createItem: 'Создать «{value}»',
    noItemsFound: 'Элементы не найдены',
    noItemsAvailable: 'Нет доступных элементов',
    startTypingToSearch: 'Начните вводить текст для поиска…',
    searchPages: 'Поиск страниц…',

    // Выбор актива (Asset Picker)
    selectAsset: 'Выбрать актив',
    noTag: 'Без тега',
    showingOfTotal: 'Показано {shown} из {total} — введите текст для поиска',

    // Выбор пользователя/исполнителя (User/Assignee Picker)
    selectUser: 'Выбрать пользователя',
    searchUsers: 'Поиск пользователей...',
    users: 'Пользователи',
    noUsersFound: 'Пользователи не найдены',
    noUsersAvailable: 'Нет доступных пользователей',
    assignTo: 'Назначить на',
    unassigned: 'Не назначено',
    assignee: 'Исполнитель',
    user: 'Пользователь',
    group: 'Группа',
    searchUser: 'Поиск пользователя...',
    searchGroup: 'Поиск группы...',

    // Присутствие агента в пикерах назначения (WI-272)
    agentOnline: 'Агент в сети — активный runner подхватит назначенные элементы',
    agentOffline: 'Агент не в сети — в пуле runner-ов нет активных; назначенные элементы встанут в очередь',
    agentLocal: 'Агент работает на этом сервере',
    agentUnbound: 'В этом воркспейсе нет привязки агента — назначение не запустит выполнение',

    // Выбор группы (Group Picker)
    selectGroup: 'Выбрать группу',

    // Выбор категории (Category Picker)
    selectCategories: 'Выбрать категории',
    removeCategory: 'Удалить категорию',
    categoriesSelected: 'Выбрано категорий: {count}',
    searchCategories: 'Поиск категорий...',
    noCategoriesFound: 'Категории не найдены',

    // Выбор коллекции (Collection Picker)
    selectCollections: 'Выбрать коллекции',

    // Выбор воркспейса (Workspace Picker)
    selectWorkspaces: 'Выбрать воркспейсы',
    searchWorkspaces: 'Поиск воркспейсов...',
    noWorkspacesFound: 'Воркспейсы не найдены',

    // Выбор набора конфигураций (Configuration Set Picker)
    selectConfigurationSet: 'Выбрать набор конфигураций',
    searchConfigurationSets: 'Поиск наборов конфигураций...',
    configurationSets: 'Наборы конфигураций',
    defaultConfiguration: 'Конфигурация по умолчанию',
    defaultConfigurationDescription: 'Использует настройки воркспейса по умолчанию',
    noConfigurationSetsFound: 'Наборы конфигураций не найдены',

    // Выбор сущности набора конфигураций (Configuration Set Entity Picker)
    entityAlreadyAssigned: '«{label}» уже назначено',
    itemType: 'Тип элемента',
    priorities: 'Приоритеты',
    itemTypes: 'Типы элементов',
    level: 'Уровень {level}',
    assigned: 'Назначено',
    noEntitiesAssigned: 'Нет назначенных {entities}',
    available: 'Доступно',
    noEntitiesMatchSearch: 'Нет {entities}, соответствующих условиям поиска',
    allEntitiesAssigned: 'Все {entities} назначены',
    inConfigSet: 'В наборе конфигураций',
    searchEntities: 'Поиск: {entities}...',

    // Выбор поля (Field Selector)
    selectField: 'Выбрать поле',
    searchFields: 'Поиск полей...',
    noFieldsFound: 'Поля не найдены',
    customFields: 'Пользовательские поля',
    custom: 'Пользовательский',
    customFieldDesc: 'Пользовательское поле',
    fieldTypes: {
      text: 'Текст',
      number: 'Число',
      date: 'Дата',
      select: 'Выбор',
      multiselect: 'Множественный выбор',
      checkbox: 'Флажок',
      url: 'URL',
      email: 'Email',
      phone: 'Телефон',
      textarea: 'Многострочный текст',
      textArea: 'Многострочный текст',
      user: 'Пользователь',
      rating: 'Рейтинг',
      boolean: 'Логическое значение',
      reference: 'Ссылка',
      identifier: 'Идентификатор',
    },
    fieldCategories: {
      basic: 'Основные поля',
      dates: 'Поля дат',
      people: 'Люди',
      workflow: 'Рабочий процесс',
      custom: 'Пользовательские поля',
    },
    fields: {
      title: { name: 'Заголовок', description: 'Заголовок элемента' },
      description: { name: 'Описание', description: 'Описание элемента' },
      status: { name: 'Статус', description: 'Текущий статус' },
      priority: { name: 'Приоритет', description: 'Уровень приоритета' },
      type: { name: 'Тип', description: 'Тип элемента' },
      assignee: { name: 'Исполнитель', description: 'Назначенный пользователь' },
      reporter: { name: 'Автор', description: 'Кто создал элемент' },
      createdAt: { name: 'Дата создания', description: 'Когда элемент был создан' },
      updatedAt: { name: 'Дата обновления', description: 'Когда элемент был последний раз обновлён' },
      dueDate: { name: 'Срок выполнения', description: 'Когда элемент должен быть выполнен' },
      startDate: { name: 'Дата начала', description: 'Когда начинается работа' },
      estimate: { name: 'Оценка', description: 'Оценка трудозатрат' },
      labels: { name: 'Метки', description: 'Метки элемента' },
      sprint: { name: 'Спринт', description: 'Связанный спринт' },
      iteration: { name: 'Итерация', description: 'Связанная итерация (спринт, релиз и т.д.)' },
      milestone: { name: 'Веха', description: 'Целевая веха' },
      parent: { name: 'Родитель', description: 'Родительский элемент' },
      children: { name: 'Дочерние элементы', description: 'Дочерние элементы' },
      links: { name: 'Связи', description: 'Связанные элементы' },
      attachments: { name: 'Вложения', description: 'Прикреплённые файлы' },
      comments: { name: 'Комментарии', description: 'Комментарии обсуждения' },
      watchers: { name: 'Наблюдатели', description: 'Пользователи, следящие за этим элементом' },
    },

    // Выбор значка (Icon Selector)
    iconAndColor: 'Значок и цвет',
    searchIcons: 'Поиск значков...',
    icons: 'Значки',
    colors: 'Цвета',
    icon: 'Значок',
    color: 'Цвет',

    // Комбобокс меток (Label Combobox)
    allLabels: 'Все метки',
    selectLabels: 'Выбрать метки',
    noLabelsFoundFor: 'Метки по запросу «{query}» не найдены',
    labelCommaNotAllowed: 'Название метки не может содержать запятую',

    // Выбор упоминания (Mention Picker)
    mentionUsers: 'Упомянуть пользователей',
    searching: 'Поиск...',
    noNotificationPersonalTask: 'Личные задачи не отправляют уведомления',

    // Комбобокс вех (Milestone Combobox)
    selectMilestone: 'Выбрать веху',
    selectMilestones: 'Выбрать вехи',
    noMilestone: 'Без вехи',
    milestones: 'Вехи',
    milestonesSelected: '{count} вехи выбрано',
    milestonesSelected_one: '{count} веха выбрана',
    milestonesSelected_few: '{count} вехи выбраны',
    milestonesSelected_many: '{count} вех выбрано',
    milestonesSelected_other: '{count} вехи выбрано',
    noMilestonesFound: 'Вехи не найдены',
    showCompletedMilestones: 'Показать завершённые',

    // Комбобокс итераций (Iteration Combobox)
    selectIteration: 'Выбрать итерацию',
    noIteration: 'Без итерации',

    // Выбор приоритета (Priority Picker)
    selectPriority: 'Выбрать приоритет',
    noPriority: 'Без приоритета',
    loadingPriorities: 'Загрузка приоритетов...',
    noPrioritiesConfigured: 'Приоритеты не настроены',

    // Выбор проекта (Project Picker)
    selectProject: 'Выбрать проект',

    // Выбор репозитория (Repository Selector)
    linkRepositories: 'Связать репозитории',
    selectRepositoriesFrom: 'Выбрать репозитории из {provider}',
    searchRepositories: 'Поиск репозиториев...',
    loadingRepositories: 'Загрузка репозиториев...',
    noRepositoriesMatchSearch: 'Репозитории по запросу не найдены',
    noRepositoriesAvailable: 'Нет доступных репозиториев',
    alreadyLinked: 'Уже связан',
    linkSelected: 'Связать выбранные',
    linking: 'Связывание...',
    repositoriesSelected: 'Выбрано: {count}',

    // Выбор роли (Role Picker)
    selectRole: 'Выбрать роль',

    // Выбор экрана (Screen Picker)
    selectScreen: 'Выбрать экран',

    // Выбор тест-кейса (Test Case Picker)
    searchTestCases: 'Поиск тест-кейсов...',

    // Выбор рабочего процесса (Workflow Picker)
    selectWorkflow: 'Выбрать рабочий процесс',

    // Выбор набора условий (Condition Set Picker)
    selectConditionSet: 'Выбрать набор условий',

    // Выбор набора согласований (Approval Set Picker)
    selectApprovalSet: 'Выбрать набор согласований',
  },

  editors: {
    enterText: 'Введите текст...',
    selectDate: 'Выберите дату...',
    clickToChangeColor: 'Нажмите, чтобы изменить цвет',
    saveEnter: 'Сохранить (Enter)',
    cancelEscape: 'Отмена (Escape)',
    availableFields: 'Доступные поля',
    selectedFields: 'Выбранные поля',
    dragFieldsToAdd: 'Перетащите поля, чтобы добавить их',
    dragToReorderOrDrop: 'Перетащите, чтобы изменить порядок, или бросьте поля сюда',
    dropFieldsHere: 'Бросьте поля сюда для настройки',
    noFieldsMatchSearch: 'Поля по запросу не найдены',
    noFieldsAvailable: 'Нет доступных полей',
    allFieldsAdded: 'Все доступные поля уже добавлены',
    bold: 'Жирный (Ctrl+B)',
    italic: 'Курсив (Ctrl+I)',
    strikethrough: 'Зачёркнутый',
    inlineCode: 'Встроенный код',
    bulletList: 'Маркированный список',
    numberedList: 'Нумерованный список',
    insertImage: 'Вставить изображение',
    userNotFound: 'Пользователь не найден',
    insertDiagram: 'Вставить диаграмму',
    diagramEdit: 'Редактировать диаграмму',
    diagramOpen: 'Открыть диаграмму',
    diagramUntitled: 'Диаграмма без названия',
    diagramNamePlaceholder: 'Название диаграммы',
    diagramUnsaved: 'Несохранённые изменения',
    diagramUnsavedConfirm: 'Отменить несохранённые изменения диаграммы?',
    diagramDeleted: 'Диаграмма удалена',
    diagramRenderError: 'Не удалось отобразить диаграмму',
    diagramLoadError: 'Не удалось загрузить диаграмму',
    diagramSaveError: 'Не удалось сохранить диаграмму',
    mermaidRendering: 'Отрисовка диаграммы',
    mermaidParseError: 'Ошибка разбора Mermaid',
    mermaidEmpty: 'Пустой блок Mermaid',
  },

  dialogs: {
    cancel: 'Отмена',
    confirm: 'Подтвердить',
    save: 'Сохранить',
    close: 'Закрыть',
    delete: 'Удалить',
    update: 'Обновить',
    // Сообщения подтверждения для диалогов confirm()
    confirmations: {
      deleteItem: 'Вы уверены, что хотите удалить «{name}»? Это действие нельзя отменить.',
      deleteSection: 'Вы уверены, что хотите удалить этот раздел?',
      discardChanges: 'У вас есть несохранённые изменения. Вы уверены, что хотите отменить?',
      dismissAllNotifications:
        'Вы уверены, что хотите отклонить все уведомления? Это действие нельзя отменить.',
      removeAvatar: 'Вы уверены, что хотите удалить фото профиля?',
      revokeCalendarFeed:
        'Вы уверены, что хотите отозвать URL календарной ленты? Все календари, использующие этот URL, перестанут синхронизироваться.',
      deleteTheme: 'Вы уверены, что хотите удалить эту тему? Это действие нельзя отменить.',
      resetBoardConfig:
        'Вы уверены, что хотите сбросить конфигурацию доски к значениям по умолчанию? Это удалит вашу пользовательскую конфигурацию.',
      deleteCustomField:
        'Вы уверены, что хотите удалить пользовательское поле «{name}»? Оно будет удалено из всех проектов.',
      deleteLinkType:
        'Вы уверены, что хотите удалить этот тип связи? Все связи этого типа также будут удалены.',
      deleteAsset: 'Вы уверены, что хотите удалить этот актив?',
      deleteAssetSet:
        'Вы уверены, что хотите удалить этот набор активов? Будут удалены все активы, типы и категории внутри него.',
      deleteAssetType:
        'Вы уверены, что хотите удалить этот тип актива? У активов, использующих этот тип, тип будет снят.',
      deleteCategory:
        'Вы уверены, что хотите удалить эту категорию? Дочерние категории будут перемещены к родительской.',
      revokeRole: 'Вы уверены, что хотите отозвать эту роль?',
      quitApplication: 'Вы уверены, что хотите выйти из приложения? Сервер будет остановлен.',
      deleteConnection:
        'Вы уверены, что хотите удалить это подключение? Это действие нельзя отменить.',
      deleteWidget: 'Удалить этот раздел? Все виджеты в нём будут удалены.',
      deleteScreen:
        'Вы уверены, что хотите удалить экран «{name}»? Это затронет все воркспейсы, использующие этот экран.',
    },
    // Сообщения оповещений для диалогов alert()
    alerts: {
      nameRequired: 'Необходимо указать название',
      pleaseSelectImage: 'Пожалуйста, выберите файл изображения',
      timerAlreadyRunning: 'Таймер уже запущен. Остановите его перед запуском нового.',
      noTimerRunning: 'В данный момент ни один таймер не запущен.',
      timerSyncing: 'Таймер синхронизируется. Подождите и попробуйте снова.',
      startTimerFromItem: 'Запустите таймер из рабочего элемента, чтобы указать контекст.',
      cannotDeleteDefaultScreen:
        'Невозможно удалить экран по умолчанию. Этот экран необходим для воркспейсов без набора конфигураций.',
      applicationShuttingDown: 'Приложение завершает работу...',
      pdfExportComingSoon: 'Экспорт в PDF для представления временных блоков скоро появится',
      configUpdatedSuccess:
        'Набор конфигураций успешно обновлён. Все рабочие элементы уже используют статусы из нового рабочего процесса.',
      failedToSave: 'Не удалось сохранить: {error}',
      failedToDelete: 'Не удалось удалить: {error}',
      shutdownFailed: 'Не удалось завершить работу приложения',
      failedToUpdate: 'Не удалось обновить: {error}',
      failedToLoad: 'Не удалось загрузить: {error}',
      stopTimerFailed: 'Не удалось остановить таймер',
      failedToCreate: 'Не удалось создать: {error}',
      failedToUpload: 'Не удалось отправить файл: {error}',
      failedToGeneratePdf: 'Не удалось сформировать PDF. Попробуйте снова.',
      failedToApplyConfig: 'Не удалось применить изменение конфигурации: {error}',
      failedToAddManager: 'Не удалось добавить менеджера: {error}',
      failedToRemoveManager: 'Не удалось удалить менеджера: {error}',
      failedToSaveWorkspace: 'Не удалось сохранить проект. Проверьте введённые данные и попробуйте снова.',
      failedToResetConfig: 'Не удалось сбросить конфигурацию: {error}',
      failedToToggleStatus: 'Не удалось переключить статус типа связи: {error}',
      failedToAssignRole: 'Не удалось назначить роль: {error}',
      failedToRevokeRole: 'Не удалось отозвать роль: {error}',
      failedToUpdateRole: 'Не удалось обновить роль «Все»: {error}',
      failedToLoadFields: 'Не удалось загрузить поля: {error}',
      failedToSaveFields: 'Не удалось сохранить назначения полей: {error}',
      errorAddingTestCase: 'Ошибка при добавлении тест-кейса: {error}',
      failedToCreateLabel: 'Не удалось создать метку: {error}',
      failedToSaveLayout: 'Не удалось сохранить изменения макета',
      statusInUseByTransitions:
        'Невозможно удалить «{name}», так как он используется в {count} переходах рабочего процесса. Чтобы удалить этот статус, перейдите в раздел управления рабочими процессами, удалите все переходы, использующие этот статус, а затем повторите попытку удаления статуса.',
      statusInUseByTransitions_one:
        'Невозможно удалить «{name}», так как он используется в {count} переходе рабочего процесса. Чтобы удалить этот статус, перейдите в раздел управления рабочими процессами, удалите все переходы, использующие этот статус, а затем повторите попытку удаления статуса.',
      statusInUseByTransitions_few:
        'Невозможно удалить «{name}», так как он используется в {count} переходах рабочего процесса. Чтобы удалить этот статус, перейдите в раздел управления рабочими процессами, удалите все переходы, использующие этот статус, а затем повторите попытку удаления статуса.',
      statusInUseByTransitions_many:
        'Невозможно удалить «{name}», так как он используется в {count} переходах рабочего процесса. Чтобы удалить этот статус, перейдите в раздел управления рабочими процессами, удалите все переходы, использующие этот статус, а затем повторите попытку удаления статуса.',
      statusInUseByTransitions_other:
        'Невозможно удалить «{name}», так как он используется в {count} переходах рабочего процесса. Чтобы удалить этот статус, перейдите в раздел управления рабочими процессами, удалите все переходы, использующие этот статус, а затем повторите попытку удаления статуса.',
    },
  },

  components: {
    // Компонент Avatar
    avatar: {
      defaultAlt: 'Аватар',
    },

    // Компонент DataTable
    dataTable: {
      showingRange: 'Показано {start}–{end} из {total}',
    },

    // Компоненты диаграмм
    diagram: {
      loading: 'Загрузка диаграмм...',
      loadError: 'Не удалось загрузить диаграммы',
      deleteError: 'Не удалось удалить диаграмму',
      confirmDelete: 'Вы уверены, что хотите удалить эту диаграмму?',
      edit: 'Редактировать диаграмму',
      untitled: 'Диаграмма без названия',
      namePlaceholder: 'Название диаграммы',
      nameRequired: 'Пожалуйста, введите название диаграммы',
      saveError: 'Не удалось сохранить диаграмму',
      unsavedChanges: 'Несохранённые изменения',
      unsavedChangesConfirm: 'У вас есть несохранённые изменения. Вы уверены, что хотите закрыть?',
    },

    // Компонент ErrorState
    errorState: {
      title: 'Что-то пошло не так',
    },

    // Компонент Pagination
    pagination: {
      showingRange: 'Показано {start}-{end} из {total}',
      limitedTo: 'ограничено {max} элементами',
      itemsPerPage: 'Элементов на странице:',
      previousPage: 'Предыдущая страница',
      nextPage: 'Следующая страница',
      goToPage: 'Перейти на страницу {page}',
      pageOf: 'Страница {current} из {total}',
    },

    // Компонент UserAvatar
    userAvatar: {
      myWorkspace: 'Мой воркспейс',
      myWorkspaceSubtitle: 'Личный воркспейс для задач и заметок',
      profileSubtitle: 'Управление профилем и настройками',
      security: 'Безопасность',
      securitySubtitle: 'Управление паролями, двухфакторной аутентификацией и API-токенами',
      mcpConsole: 'MCP-консоль',
      mcpConsoleSubtitle: 'Каталог MCP-инструментов сервера и живой запуск',
      themeTitle: 'Тема: {mode}',
      themeLight: 'Светлая',
      themeDark: 'Тёмная',
      themeSystem: 'Системная',
      desktopSite: 'Версия для ПК',
      addToHomeScreen: 'Добавить на главный экран',
    },
  },

  aria: {
    close: 'Закрыть',
    dragToReorder: 'Перетащите для изменения порядка',
    refresh: 'Обновить',
    removeField: 'Удалить поле',
    removeFromSection: 'Удалить из раздела',
    addNewStep: 'Добавить новый шаг',
    removeCurrentStep: 'Удалить текущий шаг',
    dismissNotification: 'Скрыть уведомление',
    mainNavigation: 'Основная навигация',
    mentionUsers: 'Упомянуть пользователей',
    notifications: 'Уведомления',
    adminSettings: 'Настройки администратора',
    userMenu: 'Меню пользователя',
    clearSearch: 'Очистить поиск',
  },

  layout: {
    addSection: 'Добавить раздел',
    moveUp: 'Переместить раздел вверх',
    moveDown: 'Переместить раздел вниз',
    deleteSection: 'Удалить раздел',
    editMode: 'Режим редактирования',
    editDisplaySettings: 'Изменить настройки отображения',
    items: 'элементы',
  },

  widgets: {
    removeWidget: 'Удалить виджет',
    defaultWidth: 'По умолчанию: ширина {width}/{columns}',
    widthQuarter: 'Четверть',
    widthThird: 'Треть',
    widthHalf: 'Половина',
    widthTwoThirds: 'Две трети',
    widthFull: 'Полная',
    resizeAriaLabel: 'Изменить размер виджета',
    resizeColumnsValue: '{count} из 12 колонок',
    rowCount: 'Количество строк',
    density: 'Плотность',
    densityComfortable: 'Комфортная',
    densityCompact: 'Компактная',
    rowCount5: '5 строк',
    rowCount10: '10 строк',
    rowCount15: '15 строк',
    rowCountAll: 'Все строки',
    narrowWidth: 'Узкая (1/3 ширины)',
    mediumWidth: 'Средняя (2/3 ширины)',
    fullWidth: 'Полная ширина',
    chart: {
      items: 'элементы',
      noDataAvailable: 'Нет доступных данных',
    },
    completionChart: {
      title: 'График завершения',
      emptyMessage: 'Нет данных о завершении',
    },
    createdChart: {
      title: 'График создания',
      emptyMessage: 'Нет данных о создании',
    },
    recentItems: {
      loadingText: 'Загрузка недавних элементов...',
      emptyTitle: 'Нет недавних элементов',
      emptySubtitle: 'Недавно просмотренные элементы появятся здесь',
      loadError: 'Не удалось загрузить недавние элементы',
    },
    savedSearch: {
      loadingCollections: 'Загрузка сохранённых коллекций...',
      setupTitle: 'Выберите сохранённую коллекцию',
      setupSubtitle: 'Выберите коллекцию, чтобы показать её рабочие элементы здесь.',
      selectCollection: 'Выберите коллекцию',
      noCollections: 'Нет доступных сохранённых коллекций',
      collectionUnavailable: 'Сохранённая коллекция недоступна',
      itemCount: '{count} элементов',
      emptyTitle: 'Нет подходящих рабочих элементов',
      emptySubtitle: 'В этой сохранённой коллекции нет подходящих элементов',
      loadError: 'Не удалось загрузить сохранённую коллекцию',
    },
    milestoneProgress: {
      emptyTitle: 'Нет вех',
      emptySubtitle: 'Создайте вехи для отслеживания прогресса',
      due: 'Срок',
      done: 'выполнено',
      item: 'элемент',
      items: 'элементы',
      noItems: 'Нет элементов',
      noStatus: 'Без статуса',
      activeMilestone: 'Активная',
      noCategorizedWork: 'Нет категоризированной работы',
    },
    myTasks: {
      loadingText: 'Загрузка ваших задач...',
      emptyTitle: 'Вам не назначено ни одной задачи',
      emptySubtitle: 'Назначенные вам задачи появятся здесь',
      loadError: 'Не удалось загрузить ваши задачи',
    },
    overdueItems: {
      loadingStatus: 'Загрузка...',
      itemCount: '{count} просроченных элементов',
      refreshAriaLabel: 'Обновить просроченные элементы',
      loadingText: 'Загрузка просроченных элементов...',
      emptyTitle: 'Нет просроченных элементов',
      emptySubtitle: 'Все элементы идут по графику',
      loadError: 'Не удалось загрузить просроченные элементы',
      daysOverdue: 'просрочено на {days} дн.',
    },
    upcomingDeadlines: {
      loadingStatus: 'Загрузка...',
      itemCount: '{count} предстоящих',
      refreshAriaLabel: 'Обновить предстоящие сроки',
      loadingText: 'Загрузка предстоящих сроков...',
      emptyTitle: 'Нет предстоящих сроков',
      emptySubtitle: 'Элементы со сроками появятся здесь',
      loadError: 'Не удалось загрузить предстоящие сроки',
    },
    iterationTimeline: {
      loadingStatus: 'Загрузка...',
      iterationCount: '{count} итераций',
      refreshAriaLabel: 'Обновить итерации',
      loadingText: 'Загрузка итераций...',
      emptyTitle: 'Нет активных итераций',
      emptySubtitle: 'Хронология итераций появится здесь',
      loadError: 'Не удалось загрузить итерации',
    },
  },

  recurrence: {
    title: 'Повторение',
    description: 'Управление правилами повторяющихся задач',
    frequency: 'Частота',
    interval: 'Повторять каждые',
    daily: 'Ежедневно',
    weekly: 'Еженедельно',
    monthly: 'Ежемесячно',
    yearly: 'Ежегодно',
    daysOfWeek: 'Дни недели',
    dayOfMonth: 'День месяца',
    endCondition: 'Завершается',
    never: 'Никогда',
    onDate: 'В дату',
    afterOccurrences: 'После количества повторений',
    occurrences: 'повторений',
    preview: 'Предстоящие повторения',
    previewLoading: 'Загрузка предпросмотра...',
    previewError: 'Не удалось загрузить предпросмотр',
    copySettings: 'Копировать из шаблона',
    copyAssignee: 'Копировать исполнителя',
    copyPriority: 'Копировать приоритет',
    copyCustomFields: 'Копировать пользовательские поля',
    copyDescription: 'Копировать описание',
    leadTime: 'Создавать заранее (дней)',
    statusOnCreate: 'Статус при создании',
    active: 'Активно',
    inactive: 'Неактивно',
    instances: 'Созданные экземпляры',
    instanceCount: '{count} экземпляров',
    forceGenerate: 'Создать сейчас',
    generating: 'Создание...',
    generated: 'Создано экземпляров: {count}',
    addRecurrence: 'Добавить повторение',
    noRule: 'Повторение не настроено',
    setUp: 'Настроить повторение',
    editRule: 'Редактировать повторение',
    deleteRule: 'Удалить повторение',
    deleteConfirm: 'Вы уверены, что хотите удалить это правило повторения? Созданные экземпляры не будут затронуты.',
    startDate: 'Дата начала',
    endDate: 'Дата окончания (необязательно)',
    timezone: 'Часовой пояс',
    templateItem: 'Элемент-шаблон',
    scheduledDate: 'Запланированная дата',
    sequenceNumber: 'Порядковый номер',
    noInstances: 'Экземпляры ещё не созданы',
    settingsTab: 'Настройки',
    instancesTab: 'Экземпляры',
    searchPlaceholder: 'Поиск правил повторения...',
    noMatchingResults: 'Правила повторения по запросу не найдены',
    empty: 'Нет правил повторения',
    emptyDesc: 'Правила повторения появятся здесь, когда для элементов будет настроено расписание повторения.',
    createFromItem: 'Чтобы создать правило повторения, откройте элемент и настройте повторение на боковой панели сведений.',
    rule: 'Правило',
    everyDay: 'день',
    everyDays: 'дней',
    everyWeek: 'неделя',
    everyWeeks: 'недель',
    everyMonth: 'месяц',
    everyMonths: 'месяцев',
    everyYear: 'год',
    everyYears: 'лет',
    mon: 'Пн',
    tue: 'Вт',
    wed: 'Ср',
    thu: 'Чт',
    fri: 'Пт',
    sat: 'Сб',
    sun: 'Вс',
  },

  footer: {
    platformName: 'Платформа управления работой Windshift',
    aboutWindshift: 'О Windshift',
    apiReference: 'Справочник API',
    licenses: 'Лицензии',
    reportProblem: 'Сообщить о проблеме',
  },

  mcpConsole: {
    title: 'MCP-консоль',
    subtitle: 'Живой каталог MCP-инструментов этого сервера — вызовы идут через настоящий протокол, как у любого внешнего MCP-клиента.',
    searchPlaceholder: 'Поиск инструментов…',
    selectPrompt: 'Выбери инструмент из списка',
    schemaHeading: 'Схема входных данных',
    argsHeading: 'Аргументы (JSON)',
    execute: 'Выполнить',
    executing: 'Выполняется…',
    resultHeading: 'Результат',
    errorHeading: 'Ошибка',
    destructiveWarning: 'Этот инструмент помечен как разрушительный — перепроверь аргументы перед запуском.',
    tokenError: 'Не удалось выпустить токен сессии для консоли.',
    loadError: 'Не удалось достучаться до MCP-сервера.',
    invalidJson: 'Аргументы должны быть валидным JSON.',
  },
};

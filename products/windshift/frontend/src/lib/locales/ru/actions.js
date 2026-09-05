/**
 * Переводы для автоматизации действий (Actions), русская локаль
 */
export default {
  actions: {
    title: 'Действия',
    description: 'Автоматизируйте рабочие процессы с помощью действий на основе правил',
    create: 'Создать действие',
    createFirst: 'Создайте своё первое действие',
    noActions: 'Пока нет действий',
    noActionsDescription: 'Создавайте действия, чтобы автоматизировать рабочие процессы на основе событий по задачам',
    enabled: 'Включено',
    disabled: 'Отключено',
    enable: 'Включить',
    disable: 'Отключить',
    viewLogs: 'Просмотреть журнал',
    confirmDelete: 'Вы уверены, что хотите удалить действие «{name}»?',
    failedToSave: 'Не удалось сохранить действие',
    newAction: 'Новое действие',

    // Шаблоны действий (готовые сценарии автоматизации)
    templates: {
      pickTitle: 'Выберите шаблон действия',
      fromTemplate: 'Из шаблона',
      empty: 'Нет доступных шаблонов.',
      help: 'Примените готовый шаблон автоматизации к этому воркспейсу. Каждое применение создаёт новое действие, которое можно отредактировать позже.',
      apply: 'Применить',
    },

    // Типы триггеров
    trigger: {
      statusTransition: 'Переход статуса',
      itemCreated: 'Задача создана',
      itemUpdated: 'Задача обновлена',
      itemLinked: 'Задача связана',
      manual: 'Вручную',
      respondToCascades: 'Реагировать на изменения, вызванные другими действиями',
      respondToCascadesHint:
        'Если включено, это действие также будет запускаться при срабатывании других действий, а не только при изменениях пользователя.',
    },

    manualAccess: {
      label: 'Кто может запускать это действие вручную?',
      allEditors: 'Все редакторы воркспейса',
      unrestrictedHint:
        'Без ограничения по ролям. Любой пользователь с правом редактирования может видеть и запускать это действие.',
      restrictedHint:
        'Видеть и запускать это действие могут только участники хотя бы с одной из выбранных ролей. Администраторы воркспейса всегда сохраняют доступ.',
    },

    // Типы узлов
    nodes: {
      trigger: 'Триггер',
      setField: 'Установить поле',
      setStatus: 'Установить статус',
      addComment: 'Добавить комментарий',
      notifyUser: 'Уведомить пользователя',
      condition: 'Условие',
      updateAsset: 'Обновить актив',
      createAsset: 'Создать актив',
      httpRequest: 'HTTP-запрос',
      containerRun: 'Запустить контейнер',
      aiExtract: 'ИИ-извлечение',
      aiAgent: 'ИИ-агент',
      relatedItems: 'Для каждой связанной задачи',
      transitionItem: 'Перевести задачу',
      roundRobinAssign: 'Назначить по очереди',
      createMilestone: 'Создать веху',
    },

    // Тост, показываемый при обновлении открытого действия через AI-чат (update_action).
    aiUpdated: 'Действие обновлено ИИ',

    // Переопределение исполнителя (run-as)
    runAs: 'Запускать от имени',
    runAsTriggerUser: 'Запускать от имени пользователя, вызвавшего действие',
    runAsHint:
      'Действие выполняется с правами этого пользователя. Оставьте поле пустым, чтобы запускать от имени того, кто вызвал действие.',
    runAsReadonlyHint: 'Для изменения требуется разрешение «Задавать исполнителя действия».',

    // Палитра узлов и подсказки
    addNodes: 'Добавить узлы',
    tips: 'Подсказки',
    tipDragToConnect: 'Перетащите от точек соединения, чтобы связать узлы',
    tipClickToEdit: 'Нажмите на узел, чтобы настроить его',
    tipConditionBranches: 'У условий есть ветви «истина»/«ложь»',

    // Панель настройки
    nodeConfig: 'Настройка узла',
    config: {
      from: 'Из',
      to: 'В',
      selectField: 'Выберите поле...',
      selectStatus: 'Выберите статус...',
      config: 'Конфигурация',
      configure: 'Настроить',
      selectConfig: 'Выберите конфигурацию',
      enterComment: 'Введите комментарий...',
      selectRecipient: 'Выберите получателя...',
      setCondition: 'Задайте условие...',
      targetStatus: 'Целевой статус',
      fieldName: 'Имя поля',
      value: 'Значение',
      commentContent: 'Текст комментария',
      commentPlaceholder: 'Введите текст комментария. Используйте {{item.title}} для переменных.',
      privateComment: 'Приватный комментарий (только для внутреннего использования)',
      fieldToCheck: 'Проверяемое поле',
      operator: 'Оператор',
      compareValue: 'Значение для сравнения',
      private: 'Приватно',
      triggerType: 'Тип триггера',
      fromStatus: 'Из статуса',
      toStatus: 'В статус',
      anyStatus: 'Любой статус',
      triggerField: 'Изменённое поле',
      anyField: 'Любое поле (все изменения)',
      recipientType: 'Получатель',
      notifyMessage: 'Сообщение',
      notifyPlaceholder: 'Введите сообщение. Используйте {{item.title}} для переменных.',
      includeLink: 'Включить ссылку на задачу',
      // Настройка обновления актива
      sourceAssetField: 'Поле актива в задаче',
      selectAssetField: 'Выберите поле актива...',
      sourceAssetFieldHint: 'Выберите поле задачи, которое содержит связанный актив',
      targetAssetType: 'Целевой тип актива',
      selectAssetType: 'Выберите тип актива...',
      fieldMappingsLabel: 'Сопоставления полей',
      fieldMappings: '{count} сопоставления поля',
      fieldMappings_one: '{count} сопоставление поля',
      fieldMappings_few: '{count} сопоставления поля',
      fieldMappings_many: '{count} сопоставлений поля',
      fieldMappings_other: '{count} сопоставления поля',
      configureAssetUpdate: 'Настройте обновление актива...',
      fromField: 'Из поля',
      sourceTypeVariable: 'Переменная/шаблон',
      sourceTypeItemField: 'Поле задачи',
      sourceTypeLiteral: 'Фиксированное значение',
      selectTargetField: 'Выберите целевое поле...',
      addMapping: 'Добавить сопоставление',
      milestonePickerHint: 'Для действия сохраняются ID вех; названия показываются только для удобства редактирования.',
      userPickerHint: 'Выберите конкретного пользователя либо укажите ID пользователя/шаблон ниже.',
      // Настройка создания актива
      assetSet: 'Набор активов',
      selectAssetSet: 'Выберите набор активов...',
      assetTitle: 'Название актива',
      assetTitleHint: 'Используйте {{item.title}} или другие переменные',
      assetDescription: 'Описание',
      assetTagLabel: 'Тег актива',
      assetCategory: 'Категория',
      selectCategory: 'Выберите категорию (необязательно)...',
      assetStatus: 'Статус',
      selectStatusOptional: 'Выберите статус (необязательно)...',
      requiredField: 'Обязательное',
      configureAssetCreation: 'Настройте создание актива...',
      // Выбор возможности (узлы HTTP, Docker, LLM)
      capability: 'Возможность',
      selectCapability: 'Выберите возможность...',
      noCapabilitiesForWorkspace:
        'В этом воркспейсе нет доступных возможностей. Попросите администратора подключить их.',
      configureRequest: 'Настройте HTTP-запрос...',
      configureExtract: 'Настройте ИИ-извлечение...',
      selectModelAndTools: 'Выберите модель и инструменты...',
      // Узел HTTP-запроса
      httpCapability: 'Возможность HTTP-клиента',
      httpMethod: 'Метод',
      urlTemplate: 'Шаблон URL',
      requestBody: 'Тело запроса',
      requestBodyPlaceholder: 'Необязательно. JSON-тело, можно использовать {{variables}}.',
      httpHeaders: 'Заголовки',
      addHeader: 'Добавить заголовок',
      headerName: 'Имя заголовка',
      headerValue: 'Значение',
      // Узел запуска контейнера
      dockerCapability: 'Docker-окружение',
      timeoutSecs: 'Таймаут (секунды)',
      // ИИ-узлы
      llmCapability: 'Подключение LLM',
      model: 'Модель',
      tools: 'Инструменты',
      aiPrompt: 'Промпт',
      aiExtractPromptPlaceholder:
        'Извлеките структурированные данные из входных данных. Точно укажите, что нужно извлечь.',
      systemPrompt: 'Системный промпт',
      systemPromptPlaceholder: 'Вы полезный ассистент. Используйте инструменты, чтобы...',
      inputField: 'Поле ввода',
      inputFieldPlaceholder: 'имя переменной, из которой читать входные данные',
      inputFields: 'Поля ввода',
      inputFieldsPlaceholder: 'имена переменных через запятую',
      outputField: 'Поле вывода',
      outputFieldPlaceholder: 'имя переменной, в которую записать результат',
      outputSchema: 'JSON-схема вывода',
      agentTools: 'Инструменты',
      agentToolsHint:
        'Возможности HTTP-клиента, которые может вызывать агент. Показаны только возможности, доступные в этом воркспейсе.',
      noToolsAvailable: 'Для этого воркспейса нет доступных возможностей HTTP-клиента.',
      maxSteps: 'Максимум итераций',
    },

    // Получатели
    recipients: {
      assignee: 'Исполнитель',
      creator: 'Создатель',
      specific: 'Конкретные пользователи',
    },

    // Условие
    condition: {
      true: 'Да',
      false: 'Нет',
    },

    // Операторы
    operators: {
      equals: 'Равно',
      notEquals: 'Не равно',
      contains: 'Содержит',
      greaterThan: 'Больше',
      lessThan: 'Меньше',
      isEmpty: 'Пусто',
      isNotEmpty: 'Не пусто',
    },

    // Журналы выполнения
    logs: {
      title: 'Журнал выполнения',
      noLogs: 'Нет журналов выполнения',
      status: 'Статус',
      running: 'Выполняется',
      completed: 'Завершено',
      failed: 'Ошибка',
      skipped: 'Пропущено',
      startedAt: 'Начато',
      completedAt: 'Завершено',
      error: 'Ошибка',
      details: 'Подробности',
      viewDetails: 'Просмотреть подробности',
    },

    // Трассировка выполнения
    trace: {
      title: 'Подробности выполнения',
      noSteps: 'Шаги выполнения не зафиксированы',
      setStatus: 'Статус изменён с «{from}» на «{to}»',
      setField: 'Поле {field} изменено с «{from}» на «{to}»',
      addComment: 'Добавлен {prefix}комментарий: «{content}»',
      notifyUser: 'Отправлено уведомление {count} пользователям',
      notifyUser_one: 'Отправлено уведомление {count} пользователю',
      notifyUser_few: 'Отправлено уведомление {count} пользователям',
      notifyUser_many: 'Отправлено уведомление {count} пользователям',
      notifyUser_other: 'Отправлено уведомление {count} пользователям',
      notifySkipped: 'Уведомление пропущено: {reason}',
      conditionResult: 'Результат условия: {result}',
      updateAsset: 'Обновлён актив №{asset_id}',
      updateAssetSkipped: 'Обновление актива пропущено: {reason}',
      createAsset: 'Создан актив №{asset_id}: {title}',
      createAssetFailed: 'Не удалось создать актив: {reason}',
    },

    // Тестовый / ручной запуск
    test: {
      title: 'Тестовый запуск действия',
      description:
        'Выберите задачу, для которой нужно выполнить это действие. Действие будет выполнено немедленно, минуя обычный триггер.',
      selectItem: 'Выберите задачу',
      itemPlaceholder: 'Поиск задачи...',
      execute: 'Запустить действие',
      run: 'Тестовый запуск',
      executionFailed: 'Не удалось выполнить действие',
      executionQueued: 'Действие поставлено в очередь на выполнение',
    },

    // Справочник по плейсхолдерам
    placeholders: {
      title: 'Доступные плейсхолдеры',
      description:
        'Используйте эти плейсхолдеры в шаблоне. При выполнении действия они будут заменены реальными значениями.',
      showReference: 'Показать справочник по плейсхолдерам',
      categories: {
        item: 'Поля задачи',
        user: 'Текущий пользователь',
        old: 'Предыдущие значения',
        trigger: 'Контекст триггера',
      },
      item: {
        title: 'Название задачи',
        id: 'ID задачи',
        statusId: 'ID статуса',
        assigneeId: 'ID пользователя-исполнителя',
        any: 'Любое поле задачи',
      },
      user: {
        name: 'Полное имя пользователя',
        email: 'Email пользователя',
        id: 'ID пользователя',
      },
      old: {
        description: 'Предыдущее значение до изменения',
        example: 'Предыдущее значение любого поля',
      },
      trigger: {
        itemId: 'ID задачи, вызвавшей триггер',
        workspaceId: 'ID воркспейса',
      },
    },
    switchToVertical: 'Переключить на вертикальную раскладку',
    switchToHorizontal: 'Переключить на горизонтальную раскладку',
  },
};

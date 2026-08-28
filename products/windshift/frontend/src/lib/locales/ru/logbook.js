/**
 * Переводы Logbook / Базы знаний для русской локали (ru)
 */

export default {
  logbook: {
    title: 'База знаний',
    subtitle: 'Документы, заметки и знания команды',
    allDocuments: 'Все документы',
    createBucket: 'Создать раздел',
    uploadDocument: 'Загрузить документ',
    newNote: 'Новая заметка',
    noDocuments: 'Пока нет документов',
    noDocumentsDescription: 'Загрузите файл или создайте заметку, чтобы начать',
    noDocumentsAllDescription: 'В доступных вам разделах документы не найдены',
    noBuckets: 'Пока нет разделов',
    noBucketsDescription: 'Создайте раздел, чтобы упорядочить знания',
    search: 'Поиск документов...',
    article: 'Статья',
    rawContent: 'Исходное содержимое',
    info: 'Сведения',
    back: 'Назад',
    save: 'Сохранить',
    saving: 'Сохранение...',
    saved: 'Документ сохранён',
    uploadSuccess: 'Документ успешно загружен',
    noteCreated: 'Заметка успешно создана',
    bucketCreated: 'Раздел успешно создан',
    bucketUpdated: 'Раздел обновлён',
    bucketDeleted: 'Раздел удалён',
    confirmDeleteBucket:
      'Удалить этот раздел? Все документы в нём будут перенесены в архив.',
    documentArchived: 'Документ перенесён в архив',
    documentDeleted: 'Документ удалён',
    confirmDelete: 'Удалить этот документ?',
    confirmArchiveDocument: 'Перенести этот документ в архив?',
    viewOriginal: 'Открыть оригинал',
    delete: 'Удалить',

    // Bucket form
    bucketName: 'Название раздела',
    bucketNamePlaceholder: 'например, Документация разработки',
    bucketDescription: 'Описание',
    bucketDescriptionPlaceholder: 'Какие документы должны находиться здесь?',

    // Note form
    noteTitle: 'Заголовок',
    noteTitlePlaceholder: 'Заголовок заметки',
    noteContent: 'Содержимое',
    noteContentPlaceholder: 'Напишите заметку в формате markdown...',

    // Upload
    dropzoneTitle: 'Перетащите файлы сюда',
    dropzoneDescription:
      'или нажмите, чтобы выбрать файл. Поддерживаются PDF, DOCX, PPTX, XLSX, TXT, MD, HTML и изображения.',
    uploading: 'Загрузка...',
    documentTitle: 'Заголовок документа',
    documentTitlePlaceholder: 'Необязательно — по умолчанию имя файла',

    // Status
    status: {
      pending: 'Ожидание',
      processing: 'Обработка',
      ready: 'Готово',
      error: 'Ошибка',
    },

    // Source type
    sourceType: {
      upload: 'Загрузка',
      note: 'Заметка',
      email: 'Эл. почта',
    },

    // Content type (classification)
    contentType: {
      knowledge: 'Знания',
      record: 'Запись',
      correspondence: 'Переписка',
    },

    // Document info
    mimeType: 'Тип файла',
    contentHash: 'Хеш содержимого',
    retrievalCount: 'Количество обращений',
    chunkCount: 'Фрагменты',
    createdAt: 'Создан',
    updatedAt: 'Обновлён',
    reviewedAt: 'Проверен',
    health: 'Состояние',
    author: 'Автор',
    processingMessage: 'Документ обрабатывается...',
    runAction: 'Выполнить действие',
  },
};

# Служба пресетов. Сборки в этом образе НЕТ и это решение, а не упрощение: исходник —
# обычный JS с типами в JSDoc, поэтому контейнер запускает ровно те файлы, что лежат в
# репозитории. Нечему компилироваться — нечему и разъехаться с проверенным.
#
# Зависимостей в поставку ноль (`shared-policy`), поэтому `npm install` здесь тоже нет:
# `node_modules` в образе не появляется вовсе.

FROM node:24-alpine

ENV NODE_ENV=production \
    PRESETS_DIR=/data \
    PRESETS_PORT=8787 \
    PRESETS_HOST=0.0.0.0

WORKDIR /app

COPY package.json ./
COPY src ./src

# Данные ПЕРЕЖИВАЮТ перезапуск: том, а не слой образа. Без этого первый же `docker rm` унёс
# бы всё сохранённое — а сохранённое там чужое.
#
# Каталог создаётся и отдаётся пользователю `node` заранее: если том подмонтируют пустым,
# права возьмутся отсюда. Смонтируют том с хоста — права придут с хоста, и это забота того,
# кто разворачивает.
RUN mkdir -p /data && chown node:node /data
VOLUME ["/data"]

USER node
EXPOSE 8787

# Проверка живости — той же службой, без лишних тулз в образе.
HEALTHCHECK --interval=30s --timeout=3s --start-period=3s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PRESETS_PORT||8787)+'/healthz').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"

CMD ["node", "src/server.js"]

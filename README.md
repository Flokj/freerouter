# FreeFlow Proxy

Локальный OpenAI-совместимый прокси-сервер. Открывает 30 бесплатных моделей
(OpenCode Zen, KiloCode Gateway, Cline) через стандартный API `127.0.0.1:28180`,
чтобы их мог использовать любой coding-агент: [Jin](https://github.com/ethanhamilthon/jin),
Codex, Pi, Hermes, Aider, Continue и другие.

Ничего не уходит с вашей машины, кроме самих запросов к бесплатным апстримам.

## Требования

- Node.js >= 22.19 (нужен встроенный `--experimental-strip-types` для запуска TypeScript напрямую)

## Клонировать и запустить

```bash
git clone https://github.com/trefeon/freeflow-proxy.git
cd freeflow-proxy
npm install
npm start
```

Сервер поднимется на `http://127.0.0.1:28180/v1`:

```
[freeflow-proxy] Initializing with 30 models...
[freeflow-proxy] Catalog refreshed: 30 models verified
=======================================================
  FreeFlow Proxy is active and running!
  Port: http://127.0.0.1:28180/v1
  Health: http://127.0.0.1:28180/_health
  Models: http://127.0.0.1:28180/v1/models
=======================================================
```

Другой порт — через переменную окружения:

```bash
PORT=28999 npm start
```

## Эндпоинты

| Метод | Путь | Назначение |
|-------|------|------------|
| `GET`  | `/v1/models` | список всех моделей (OpenAI-формат) |
| `POST` | `/v1/chat/completions` | Chat Completions |
| `POST` | `/v1/responses` | Responses API |
| `POST` | `/v1/messages` | Anthropic Messages (транслируется) |
| `GET`  | `/_health` | статус сервера (loopback-only) |

Любой ключ авторизации подходит — сервер его не проверяет. Используйте `freeflow`
для единообразия:

```
Authorization: Bearer freeflow
```

Быстрая проверка:

```bash
curl http://127.0.0.1:28180/v1/chat/completions \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer freeflow' \
  -d '{"model":"big-pickle","messages":[{"role":"user","content":"Say OK"}]}'
```

## Подключение агентов

Во всех случаях: **Base URL** = `http://127.0.0.1:28180/v1`, **API key** = `freeflow`.

### Jin

Jin — терминальный coding-агент от автора этого проекта.

В TUI:

1. `/provider` → `Add provider`
2. **Kind**: `openai`
3. **Name**: `freeflow`
4. **Base URL**: `http://127.0.0.1:28180/v1`
5. **API Key**: `freeflow`
6. Модель — через `/model`

В headless-режиме:

```bash
JIN_BASE_URL="http://127.0.0.1:28180/v1" \
JIN_API_KEY="freeflow" \
JIN_PROVIDER_KIND="openai" \
JIN_MODEL="nemotron-3.5-lightning-free" \
jin -p "Твой запрос"
```

Через SQLite напрямую:

```bash
sqlite3 ~/.jin/jin.db "
INSERT OR REPLACE INTO settings (key, value) VALUES
('providers', json_insert(
  COALESCE((SELECT value FROM settings WHERE key='providers'), '[]'),
  '\$[#]',
  json('{\"id\":\"freeflow\",\"name\":\"FreeFlow\",\"kind\":\"openai\",\"base_url\":\"http://127.0.0.1:28180/v1\",\"api_key\":\"freeflow\"}')
));
"
```

### Codex

В `~/.codex/config.toml`:

```toml
model = "big-pickle"
model_provider = "freeflow"

[model_providers.freeflow]
name = "FreeFlow"
base_url = "http://127.0.0.1:28180/v1"
wire_api = "chat"
```

### Pi

В конфиге провайдера Pi:

```json
{
  "name": "freeflow",
  "base_url": "http://127.0.0.1:28180/v1",
  "api_key": "freeflow",
  "models": ["big-pickle", "nemotron-3.5-lightning-free"]
}
```

### Hermes

Переменные окружения:

```bash
export HERMES_BASE_URL="http://127.0.0.1:28180/v1"
export HERMES_API_KEY="freeflow"
export HERMES_MODEL="big-pickle"
```

### Любой OpenAI-клиент

```bash
export OPENAI_BASE_URL="http://127.0.0.1:28180/v1"
export OPENAI_API_KEY="freeflow"
```

## Модели

30 моделей, контекст до 1M токенов. Полный список — `GET /v1/models`.

### OpenCode Zen (10 моделей)

| ID | Контекст | API |
|----|----------|-----|
| `muse-spark-1.2-contributor-free` | 1M | responses |
| `muse-spark-1.3-contributor-free` | 1M | responses |
| `mimo-v2.6-flash-free` | 1M | chat |
| `nemotron-3-ultra-free` | 1M | chat |
| `nemotron-3.5-lightning-free` | 1M | chat |
| `big-pickle` | 200K | chat |
| `space-bunny-free` | 1M | chat |
| `longcat-2.5-preview-free` | 1M | chat |
| `step-5-preview-free` | 1M | chat |
| `ling-3.1-flash-free` | 256K | chat |

### KiloCode Gateway (15 моделей)

| ID | Контекст |
|----|----------|
| `dots-studio/dots-3-note-preview:free` | 512K |
| `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | 256K |
| `nvidia/nemotron-3-ultra-550b-a55b:free` | 1M |
| `nvidia/nemotron-3.5-lightning:free` | 1M |
| `nvidia/nemotron-3-super-120b-a12b:free` | 256K |
| `cohere/north-mini-code:free` | 256K |
| `poolside/laguna-s-2.1:free` | 256K |
| `poolside/laguna-xs-2.1:free` | 256K |
| `liquid/lfm-2.5-2.6b:free` | 64K |
| `kilo-auto/free` | 256K |
| `openrouter/free` | 200K |
| `stepfun/step-5-preview-free` | 1M |
| `thinkingmachines/inkling-small:free` | 1M |
| `stealth/glyph-cluster` | 256K |
| `inclusionai/ling-3.1-flash` | 256K |

### Cline (5 моделей, требуют аккаунт)

| ID | Контекст | API |
|----|----------|-----|
| `cline-free/deepseek-v4.1-flash` | 1M | chat |
| `cline-free/muse-spark-1.3-contributor` | 1M | responses |
| `z-ai/glm-5.3-flash` | 1M | chat |
| `cline-free/kimi-k3` | 1M | chat |
| `cline-free/solar-pro4` | 512K | chat |

Cline-модели работают по per-user пулу токенов. Пока аккаунт не добавлен, они
возвращают `401 cline_pool_exhausted`. Остальные 25 моделей работают без авторизации.

### Алиасы

Короткие имена для удобства: `nemotron-3.5-lightning`, `north-mini-code`,
`lfm-2.5`, `kilo-auto`, `openrouter`, `space-bunny`, `longcat`, `glyph-cluster`,
`mimo-v2.6-flash`, `inkling-small`, `nemotron-3-super`, `nemotron-3-ultra-550b`,
`nemotron-3-nano-omni`, `step-5-preview`, `ling-3.1-flash`, `dots-3-note-preview`.

## Что делает прокси

Не только пересылает запросы:

- **Фингерпринтинг клиента OpenCode** — эндпоинты Zen требуют заголовки
  `opencode/<version>` и `x-opencode-*`. Прокси подставляет их автоматически.
- **Инжект sextet-инструментов** `{bash, glob, grep, read, edit, write}` —
  бесплатные модели требуют этот набор, чтобы корректно вызывать инструменты.
- **Keyless-доступ к KiloCode** — заголовок `Authorization` удаляется для
  бесплатных моделей NVIDIA, Dots, Cohere, Liquid, StepFun.
- **Трансляция API** — Responses ↔ Chat ↔ Anthropic Messages. Запрос к любому
  пути работает с любой моделью.
- **Починка аргументов инструментов** — free-модели теряют точность схем на
  больших наборах инструментов. Прокси чинит только то, что однозначно следует
  из объявленной схемы (envelope-unwrap, JSON-декодирование, promotion по роли),
  и никогда не завершает обрезанный JSON.
- **Устойчивость** — квота, reasoning-ссылки, оборванные SSE-потоки обрабатываются
  с failover на соседние модели/апстримы.
- **Системные CA** — корректная работа через корпоративные и системные сертификаты.

## Ограничения бесплатного тира

- **Дневные квоты.** Апстримы ограничивают запросы с одного IP. При исчерпании
  модель вернёт `429` — это не поломка прокси, попробуйте другую модель.
- **Cline** требует собственный аккаунт (см. выше).
- **Медленные модели.** Часть моделей (reasoning) тратит много токенов на размышление.
  Если ответ приходит пустым — увеличьте `max_tokens`.

## Разработка

```bash
npm install
npm run check      # typecheck + тесты
npm test           # 75 тестов
npm run typecheck
```

Тесты не ходят в сеть: каждый прогон изолирован во временном data-dir (`test/setup.mjs`).

Структура:

```
server.ts              точка входа
src/proxy.ts           HTTP-сервер и маршрутизация
src/models.ts          каталог 30 моделей
src/catalog.ts         живая проверка каталога
src/tool-translation.ts  трансляция инструментов между API
src/tool-args.ts       починка аргументов по схеме
src/stream-pipe.ts     SSE-пайп и устойчивость потока
src/upstream-health.ts гейтинг и failover апстримов
src/responses.ts       обработка Responses API
```

## Лицензия

MIT
# FreeFlow Proxy

Standalone локальный прокси-сервер для Jin и других coding-агентов.
Предоставляет бесплатный доступ к 30 AI-моделям (OpenCode Zen, KiloCode Gateway, Cline) с контекстными окнами до 1M токенов.

## Особенности
- **OpenCode Zen**: автоматический фингерпринтинг клиента (`opencode/1.18.34`, `x-opencode-*`), инжекция sextet-инструментов `{bash, glob, grep, read, edit, write}` и скрытие placeholder-инструментов из стрима.
- **KiloCode Gateway**: автоматическое удаление заголовка `Authorization` для keyless-доступа к бесплатным моделям NVIDIA, Dots, Cohere, Liquid, StepFun и др.
- **Совместимость с Jin**: стандартные эндпоинты `/v1/chat/completions`, `/v1/responses`, `/v1/models`.

## Быстрый запуск

```bash
# Запуск в фоновом режиме через npm
npm start
# Или напрямую через node
node --experimental-strip-types server.ts
```

Сервер слушает на `http://127.0.0.1:28180/v1`.

## Подключение в Jin

### В интерактивном TUI (`jin`)
1. Выполните `/provider` → `Add provider`
2. Параметры:
   - **Kind**: `openai` (или `responses`)
   - **Name**: `freeflow`
   - **Base URL**: `http://127.0.0.1:28180/v1`
   - **API Key**: `freeflow`
3. Выберите модель через `/model`.

### Через SQLite (однострочник)
```bash
sqlite3 ~/.jin/jin.db "
INSERT OR REPLACE INTO settings (key, value) VALUES 
('providers', json_insert(
  COALESCE((SELECT value FROM settings WHERE key='providers'), '[]'),
  '$[#]',
  json('{\"id\":\"freeflow\",\"name\":\"FreeFlow\",\"kind\":\"openai\",\"base_url\":\"http://127.0.0.1:28180/v1\",\"api_key\":\"freeflow\"}')
));
"
```

### В headless-режиме (`jin -p`)
```bash
JIN_BASE_URL="http://127.0.0.1:28180/v1" \
JIN_API_KEY="freeflow" \
JIN_PROVIDER_KIND="openai" \
JIN_MODEL="nemotron-3.5-lightning-free" \
jin -p "Твой запрос"
```

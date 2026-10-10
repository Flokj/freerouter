# FreeFlow Proxy

A local OpenAI-compatible proxy server. It exposes 30 free models (OpenCode Zen,
KiloCode Gateway, Cline) through a standard API on `127.0.0.1:28180`, so any coding
agent can use them: [Jin](https://github.com/ethanhamilthon/jin), Codex, Pi,
Hermes, Aider, Continue, and others.

Nothing leaves your machine except the requests themselves to the free upstreams.

## Requirements

- Node.js >= 22.19 (the built-in `--experimental-strip-types` flag is used to run
  TypeScript directly, without a build step)

## Clone and run

```bash
git clone https://github.com/trefeon/freeflow-proxy.git
cd freeflow-proxy
npm install
npm start
```

The server comes up on `http://127.0.0.1:28180/v1`:

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

To use a different port, set the `PORT` environment variable:

```bash
PORT=28999 npm start
```

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET`  | `/v1/models` | list all models (OpenAI format) |
| `POST` | `/v1/chat/completions` | Chat Completions |
| `POST` | `/v1/responses` | Responses API |
| `POST` | `/v1/messages` | Anthropic Messages (translated) |
| `GET`  | `/_health` | server status (loopback-only) |

Any authorization key is accepted — the server does not check it. Use `freeflow`
for consistency:

```
Authorization: Bearer freeflow
```

Quick check:

```bash
curl http://127.0.0.1:28180/v1/chat/completions \
  -H 'content-type: application/json' \
  -H 'authorization: Bearer freeflow' \
  -d '{"model":"big-pickle","messages":[{"role":"user","content":"Say OK"}]}'
```

## Connecting agents

In every case: **Base URL** = `http://127.0.0.1:28180/v1`, **API key** = `freeflow`.

### Jin

Jin is a terminal coding agent by the author of this project.

In the TUI:

1. `/provider` → `Add provider`
2. **Kind**: `openai`
3. **Name**: `freeflow`
4. **Base URL**: `http://127.0.0.1:28180/v1`
5. **API Key**: `freeflow`
6. Pick a model with `/model`

In headless mode:

```bash
JIN_BASE_URL="http://127.0.0.1:28180/v1" \
JIN_API_KEY="freeflow" \
JIN_PROVIDER_KIND="openai" \
JIN_MODEL="nemotron-3.5-lightning-free" \
jin -p "Your prompt"
```

Straight into SQLite:

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

In `~/.codex/config.toml`:

```toml
model = "big-pickle"
model_provider = "freeflow"

[model_providers.freeflow]
name = "FreeFlow"
base_url = "http://127.0.0.1:28180/v1"
wire_api = "chat"
```

### Pi

In the Pi provider config:

```json
{
  "name": "freeflow",
  "base_url": "http://127.0.0.1:28180/v1",
  "api_key": "freeflow",
  "models": ["big-pickle", "nemotron-3.5-lightning-free"]
}
```

### Hermes

Environment variables:

```bash
export HERMES_BASE_URL="http://127.0.0.1:28180/v1"
export HERMES_API_KEY="freeflow"
export HERMES_MODEL="big-pickle"
```

### Any OpenAI client

```bash
export OPENAI_BASE_URL="http://127.0.0.1:28180/v1"
export OPENAI_API_KEY="freeflow"
```

## Models

30 models, with context windows up to 1M tokens. The full list is at
`GET /v1/models`.

### OpenCode Zen (10 models)

| ID | Context | API |
|----|---------|-----|
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

### KiloCode Gateway (15 models)

| ID | Context |
|----|---------|
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

### Cline (5 models, account required)

| ID | Context | API |
|----|---------|-----|
| `cline-free/deepseek-v4.1-flash` | 1M | chat |
| `cline-free/muse-spark-1.3-contributor` | 1M | responses |
| `z-ai/glm-5.3-flash` | 1M | chat |
| `cline-free/kimi-k3` | 1M | chat |
| `cline-free/solar-pro4` | 512K | chat |

Cline models draw from a per-user pool of tokens. Until an account is added they
answer `401 cline_pool_exhausted`. The other 25 models work without authentication.

### Aliases

Short names for convenience: `nemotron-3.5-lightning`, `north-mini-code`,
`lfm-2.5`, `kilo-auto`, `openrouter`, `space-bunny`, `longcat`, `glyph-cluster`,
`mimo-v2.6-flash`, `inkling-small`, `nemotron-3-super`, `nemotron-3-ultra-550b`,
`nemotron-3-nano-omni`, `step-5-preview`, `ling-3.1-flash`, `dots-3-note-preview`.

## What the proxy does

More than forwarding requests:

- **OpenCode client fingerprinting** — the Zen endpoints require `opencode/<version>`
  and `x-opencode-*` headers. The proxy sets them automatically.
- **Sextet tool injection** — `{bash, glob, grep, read, edit, write}`. The free
  models need this set to call tools correctly.
- **Keyless KiloCode access** — the `Authorization` header is stripped for the free
  NVIDIA, Dots, Cohere, Liquid and StepFun models.
- **API translation** — Responses ↔ Chat ↔ Anthropic Messages. A request to any
  path works with any model.
- **Tool-argument repair** — free models lose schema fidelity once a request carries
  a full agent tool inventory. The proxy repairs only what follows unambiguously
  from the declared schema (envelope unwrap, JSON decode, promotion by role) and
  never completes truncated JSON.
- **Resilience** — quotas, reasoning references and truncated SSE streams are handled
  with failover to sibling models and upstreams.
- **System CA support** — works correctly behind corporate and system certificates.

## Free-tier limits

- **Daily quotas.** Upstreams rate-limit requests per IP. Once exhausted a model
  answers `429` — that is not a proxy failure, try another model.
- **Cline** requires your own account (see above).
- **Slow models.** Some models (reasoning ones) spend many tokens thinking. If a reply
  comes back empty, raise `max_tokens`.

## Development

```bash
npm install
npm run check      # typecheck + tests
npm test           # 81 tests
npm run typecheck
```

The tests never touch the network: each run is isolated in a temporary data dir
(`test/setup.mjs`).

Layout:

```
server.ts                entry point
src/proxy.ts             HTTP server and routing
src/models.ts            catalog of the 30 models
src/catalog.ts           live catalog verification
src/tool-translation.ts  tool translation between APIs
src/tool-args.ts         schema-driven argument repair
src/stream-pipe.ts       SSE pipe and stream resilience
src/upstream-health.ts   upstream gating and failover
src/responses.ts         Responses API handling
```

## License

MIT# freerouter

# FreeFlow Proxy

A local OpenAI-compatible proxy server. It exposes **35 free models** (OpenCode
Zen, KiloCode Gateway, Cline, OVHcloud AI Endpoints) through a standard API on
`127.0.0.1:28180`, so any coding agent can use them: Jin, Codex, Pi, Hermes,
Aider, Continue, and others.

Nothing leaves your machine except the requests themselves to the free upstreams.

This is a standalone fork: it tracks the shared proxy core of
[`trefeon/pi-freeflow`](https://github.com/trefeon/pi-freeflow) (synced to
**v1.42.1** / `ba02dd0`) and drops the Pi/OMP extension layer, so it runs on its
own without a host.

## Requirements

- Node.js >= 22.19 (the built-in `--experimental-strip-types` flag is used to run
  TypeScript directly, without a build step)

## Clone and run

```bash
git clone https://github.com/Flokj/freerouter.git
cd freerouter
npm install
npm start
```

The server comes up on `http://127.0.0.1:28180/v1`:

```
[freeflow-proxy] Initializing with 35 models...
[freeflow-proxy] Catalog refreshed: 35 models verified
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

On first start the server creates a per-installation access token and writes it
to `~/.pi/agent/token` (mode 0600). Every `/v1/*` and `/_*` request must carry
it as the bearer key — the server answers `401` without it. Only `GET /health`
stays open (liveness probes). The startup banner prints the token and its file
path.

```bash
TOKEN=$(cat ~/.pi/agent/token)   # the per-installation API key
```

```text
Authorization: Bearer <token>
```

Quick check:

```bash
TOKEN=$(cat ~/.pi/agent/token)
curl http://127.0.0.1:28180/v1/chat/completions \
  -H 'content-type: application/json' \
  -H "authorization: Bearer $TOKEN" \
  -d '{"model":"big-pickle","messages":[{"role":"user","content":"Say OK"}]}'
```

## Connecting agents

In every case: **Base URL** = `http://127.0.0.1:28180/v1`, **API key** = the
token from `~/.pi/agent/token` (a 64-character hex string, printed in the
startup banner).

### Jin

Jin is a terminal coding agent by the author of the original project.

In the TUI:

1. `/provider` → `Add provider`
2. **Kind**: `openai`
3. **Name**: `freeflow`
4. **Base URL**: `http://127.0.0.1:28180/v1`
5. **API Key**: the value from `~/.pi/agent/token`
6. Pick a model with `/model`

In headless mode:

```bash
JIN_BASE_URL="http://127.0.0.1:28180/v1" \
JIN_API_KEY="$(cat ~/.pi/agent/token)" \
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
  json('{"id":"freeflow","name":"FreeFlow","kind":"openai","base_url":"http://127.0.0.1:28180/v1","api_key":"<token from ~/.pi/agent/token>"}')
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
  "api_key": "<token from ~/.pi/agent/token>",
  "models": ["big-pickle", "nemotron-3.5-lightning-free"]
}
```

### Hermes

Environment variables:

```bash
export HERMES_BASE_URL="http://127.0.0.1:28180/v1"
export HERMES_API_KEY="$(cat ~/.pi/agent/token)"
export HERMES_MODEL="big-pickle"
```

### Any OpenAI client

```bash
export OPENAI_BASE_URL="http://127.0.0.1:28180/v1"
export OPENAI_API_KEY="$(cat ~/.pi/agent/token)"
```

## Models

35 models, with context windows up to 1M tokens. The full list is at
`GET /v1/models`. The tables below are generated from `src/models.ts`
(`scripts/gen-readme.mjs`), so they stay accurate.

### OpenCode Zen (10 models)

| ID | Context | Max output | API | Thinking | Vision |
|---|---|---|---|---|---|
| `mimo-v2.6-flash-free` | 1M (1,048,576) | 128K (131,072) | chat | minimal,low,medium,high,xhigh | ❌ |
| `nemotron-3-ultra-free` | 1M (1,000,000) | 182,520 | chat | minimal,low,medium,high,xhigh | ❌ |
| `nemotron-3.5-lightning-free` | 1M (1,000,000) | 235,929 | chat | minimal,low,medium,high,xhigh | ❌ |
| `nemotron-3.5-super-vl-free` | 1M (1,048,576) | 235,929 | chat | minimal,low,medium,high,xhigh | ✅ |
| `big-pickle` | 200K (200,000) | 32K (32,000) | chat | high,max | ❌ |
| `longcat-2.5-preview-free` | 1M (1,048,576) | 128K (131,072) | chat | minimal,low,medium,high,xhigh | ✅ |
| `glm-5.3-flash-free` | 1M (1,048,576) | 128K (131,072) | chat | low,high,max | ✅ |
| `beam-free` | 1M (1,048,576) | 128K (131,072) | chat | low,medium,high,xhigh,max | ❌ |
| `deepseek-v4.1-flash-free` | 1M (1,048,576) | 384K (393,216) | chat | low,high,max | ✅ |
| `flint-40b-free` | 256K (262,144) | 64K (65,536) | chat | low,medium,high,xhigh,max | ❌ |

### KiloCode Gateway (15 models, keyless)

| ID | Context | Max output | API | Thinking | Vision |
|---|---|---|---|---|---|
| `dots-studio/dots-3-note-preview:free` | 384K (393,216) | 256K (262,144) | chat | minimal,low,medium,high,xhigh | ✅ |
| `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free` | 256K (262,144) | 64K (65,536) | chat | minimal,low,medium,high,xhigh | ✅ |
| `nvidia/nemotron-3-ultra-550b-a55b:free` | 1M (1,000,000) | 182,520 | chat | minimal,low,medium,high,xhigh | ❌ |
| `nvidia/nemotron-3.5-lightning:free` | 1M (1,000,000) | 235,929 | chat | minimal,low,medium,high,xhigh | ❌ |
| `cohere/north-mini-code:free` | 256K (256,000) | 64K (64,000) | chat | minimal,low,medium,high,xhigh | ❌ |
| `poolside/laguna-s-2.1:free` | 1M (1,048,576) | 128K (131,072) | chat | minimal,low,medium,high,xhigh | ❌ |
| `poolside/laguna-xs-2.1:free` | 256K (262,144) | 32K (32,768) | chat | minimal,low,medium,high,xhigh | ❌ |
| `liquid/lfm-2.5-2.6b:free` | 128K (128,000) | 32K (32,768) | chat | minimal,low,medium,high,xhigh | ❌ |
| `kilo-auto/free` | 256K (256,000) | 10K (10,000) | chat | minimal,low,medium,high,xhigh | ❌ |
| `openrouter/free` | 200K (200,000) | 64K (65,536) | chat | minimal,low,medium,high,xhigh | ✅ |
| `stealth/glyph-cluster` | 256K (256,000) | 256K (256,000) | chat | minimal,low,medium,high,xhigh | ❌ |
| `nvidia/nemotron-3.5-super-vl:free` | 1M (1,000,000) | 128K (131,072) | chat | minimal,low,medium,high,xhigh | ✅ |
| `reflection/beam-free` | 1M (1,048,576) | 128K (131,072) | chat | low,medium,high,xhigh,max | ❌ |
| `recursive/flint-v1.0:free` | 256K (262,144) | 64K (65,536) | chat | minimal,low,medium,high,xhigh | ❌ |
| `xingchen-agi/xing4.0-29b-a4b:free` | 256K (262,144) | 235,929 | chat | minimal,low,medium,high,xhigh | ❌ |

### Cline (1 models, account required)

| ID | Context | Max output | API |
|---|---|---|---|
| `cline/nemotron-3.5-super-vl` | 1M (1,000,000) | 128K (131,072) | chat |

### OVHcloud AI Endpoints (8 models, keyless direct)

| ID | Context | Max output | API |
|---|---|---|---|
| `ovh-free/gpt-oss-120b` | 128K (131,072) | 64K (65,536) | chat |
| `ovh-free/gpt-oss-20b` | 128K (131,072) | 64K (65,536) | chat |
| `ovh-free/Qwen3.5-397B-A17B` | 256K (262,144) | 235,929 | chat |
| `ovh-free/Qwen3.5-9B` | 256K (262,144) | 64K (65,536) | chat |
| `ovh-free/Qwen3.6-27B` | 256K (262,144) | 64K (65,536) | chat |
| `ovh-free/Qwen3.8-27B` | 256K (262,144) | 235,929 | chat |
| `ovh-free/Mistral-Small-3.2-24B-Instruct-2506` | 128K (131,072) | 32K (32,768) | chat |
| `ovh-free/Meta-Llama-3_3-70B-Instruct` | 128K (131,072) | 32K (32,768) | chat |

### Aliases

`dots-3-note-preview` → `dots-studio/dots-3-note-preview:free`, `nemotron-3-nano-omni` → `nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free`, `nemotron-3-ultra-550b` → `nvidia/nemotron-3-ultra-550b-a55b:free`, `nemotron-3.5-lightning` → `nvidia/nemotron-3.5-lightning:free`, `north-mini-code` → `cohere/north-mini-code:free`, `lfm-2.5` → `liquid/lfm-2.5-2.6b:free`, `glm-5.3-flash` → `glm-5.3-flash-free`, `glyph-cluster` → `stealth/glyph-cluster`, `mimo-v2.6-flash` → `mimo-v2.6-flash-free`, `nemotron-3.5-super-vl` → `nemotron-3.5-super-vl-free`, `longcat-2.5-preview` → `longcat-2.5-preview-free`, `longcat` → `longcat-2.5-preview-free`, `beam` → `beam-free`, `deepseek-v4.1-flash` → `deepseek-v4.1-flash-free`, `flint` → `flint-40b-free`, `flint-kilo` → `recursive/flint-v1.0:free`, `beam-kilo` → `reflection/beam-free`, `xing4.0` → `xingchen-agi/xing4.0-29b-a4b:free`, `laguna-s-2.1:free` → `poolside/laguna-s-2.1:free`, `laguna-xs-2.1:free` → `poolside/laguna-xs-2.1:free`, `kilo-auto` → `kilo-auto/free`, `openrouter` → `openrouter/free`, `gpt-oss-120b` → `ovh-free/gpt-oss-120b`, `gpt-oss-20b` → `ovh-free/gpt-oss-20b`, `qwen3.5-397b` → `ovh-free/Qwen3.5-397B-A17B`, `qwen3.5-9b` → `ovh-free/Qwen3.5-9B`, `qwen3.6-27b` → `ovh-free/Qwen3.6-27B`, `qwen3.8-27b` → `ovh-free/Qwen3.8-27B`, `mistral-small-3.2` → `ovh-free/Mistral-Small-3.2-24B-Instruct-2506`, `llama-3.3-70b` → `ovh-free/Meta-Llama-3_3-70B-Instruct`, `cline-super-vl` → `cline/nemotron-3.5-super-vl`

## What the proxy does

More than forwarding requests:

- **Token authorization** — the loopback proxy requires its own per-installation
  bearer token (written to `~/.pi/agent/token`), so other local processes or
  web pages cannot use your free quota. Loopback Host checks included.

- **OpenCode client fingerprinting** — the Zen `/inference` endpoint requires
  `opencode/<version>`, `x-session-id`, a `public` bearer token and other client
  headers. The proxy sets them automatically.
- **Sextet tool injection** — `{bash, glob, grep, read, edit, write}`. The free
  models need this set to call tools correctly.
- **Keyless upstreams** — the `Authorization` header is stripped for the free
  KiloCode models (NVIDIA, Dots, Cohere, Poolside, Liquid, Thinking Machines…),
  and OVHcloud is served directly with no credential at all.
- **API translation** — Responses ↔ Chat ↔ Anthropic Messages. A request to any
  path works with any model.
- **Tool-argument repair** — free models lose schema fidelity once a request carries
  a full agent tool inventory. The proxy repairs only what follows unambiguously
  from the declared schema (envelope unwrap, JSON decode, promotion by role) and
  never completes truncated JSON.
- **Resilience** — quotas, reasoning references and truncated SSE streams are
  handled with failover to sibling models and upstreams.
- **System CA support** — works correctly behind corporate and system certificates.

## Free-tier limits

- **Daily quotas.** Upstreams rate-limit requests per IP. Once exhausted a model
  answers `429` — that is not a proxy failure, try another model.
- **Cline** requires your own account (see above). The other 33 models are keyless.
- **Slow models.** Some models (reasoning ones) spend many tokens thinking. If a
  reply comes back empty, raise `max_tokens`.

## Development

```bash
npm install
npm run check      # typecheck + tests
npm test           # 680 tests, network-free
npm run typecheck
```

The tests never touch the network: each run is isolated in a temporary data dir
(`test/setup.mjs`).

To keep the model tables in this README in sync with the catalog:

```bash
node --experimental-strip-types scripts/gen-readme.mjs   # prints the model tables
```

To refresh the proxy core from the latest `trefeon/pi-freeflow` release, copy
the shared modules from `pi-freeflow/src/` (everything except the extension
layer: `client.ts`, `commands.ts`, `daemon.ts`, `deploy.ts`, `index.ts`,
`probe.ts`, `update-checker.ts`, `updater.ts`) and re-run `npm run check`.

Layout:

```
server.ts                entry point
src/proxy.ts             HTTP server and routing
src/models.ts            catalog of the 35 models
src/catalog.ts           live catalog verification
src/config.ts            upstream endpoints, fingerprint, paths
src/tool-translation.ts  tool translation between APIs
src/tool-args.ts         schema-driven argument repair
src/stream-pipe.ts       SSE pipe and stream resilience
src/upstream-health.ts   upstream gating and failover
src/responses.ts         Responses API handling
```

## License

MIT

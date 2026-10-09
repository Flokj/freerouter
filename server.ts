/**
 * FreeFlow Proxy Server for Jin & other coding agents.
 *
 * Exposes an OpenAI-compatible API on 127.0.0.1:28180:
 * - GET  /v1/models
 * - POST /v1/chat/completions
 * - POST /v1/responses
 * - GET  /_health
 */

import { startProxy } from "./src/proxy.ts";
import { setAliveCatalog, refreshCatalog, getAliveCatalog } from "./src/catalog.ts";
import { ALL_MODELS, getModelUpstream } from "./src/models.ts";
import { HOST, PORT } from "./src/config.ts";

const bindPort = Number(process.env.PORT || PORT || 28180);

// Initialize static verified catalog
const registeredCatalog = ALL_MODELS.map((m) => ({
  ...m,
  source: getModelUpstream(m.id),
}));
setAliveCatalog(registeredCatalog);

console.log(`[freeflow-proxy] Initializing with ${registeredCatalog.length} models...`);

const { server, port } = await startProxy(bindPort);
if (!server) {
  console.error(`[freeflow-proxy] Failed to bind to port ${bindPort}: port already in use`);
  process.exit(1);
}

// Keep server running permanently
server.ref();

console.log(`=======================================================`);
console.log(`  FreeFlow Proxy is active and running!`);
console.log(`  Port: http://${HOST}:${port}/v1`);
console.log(`  Health: http://${HOST}:${port}/_health`);
console.log(`  Models: http://${HOST}:${port}/v1/models`);
console.log(`=======================================================`);

// Background live catalog refresh
refreshCatalog(false)
  .then((alive) => {
    if (alive.length > 0) {
      setAliveCatalog(alive);
      console.log(`[freeflow-proxy] Catalog refreshed: ${alive.length} models verified`);
    }
  })
  .catch((err) => {
    console.warn(`[freeflow-proxy] Background catalog refresh warning:`, err);
  });

function shutdown(signal: string) {
  console.log(`[freeflow-proxy] Received ${signal}, shutting down gracefully...`);
  server?.close(() => {
    console.log(`[freeflow-proxy] Server closed.`);
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

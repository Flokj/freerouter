// Generate accurate README model tables from the live catalog (no hand-typed numbers).
import {
 OPENCODE_MODELS,
 KILO_MODELS,
 CLINE_MODELS,
 OVH_MODELS,
 MODEL_ALIASES,
} from "../src/models.ts";

const nf = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
const fmt = (n) => {
 if (n == null) return "—";
 if (n % 1_000_000 === 0) return `${n / 1_000_000}M (${nf(n)})`;
 if (n % 1_048_576 === 0) return `${n / 1_048_576}M (${nf(n)})`;
 if (n % 1_000 === 0) return `${n / 1_000}K (${nf(n)})`;
 if (n % 1_024 === 0) return `${n / 1_024}K (${nf(n)})`;
 return nf(n);
};

const levels = (m) => {
 const keys = ["off", "minimal", "low", "medium", "high", "xhigh", "max"];
 const supported = keys.filter((k) => m.thinkingLevelMap?.[k] != null);
 if (!supported.length) return "—";
 const all = new Set(["minimal", "low", "medium", "high", "xhigh", "max"]);
 return [...all].every((k) => supported.includes(k)) ? "minimal … max" : supported.join(",");
};
const vision = (m) => (m.input?.includes("image") ? "✅" : "❌");
const api = (m) => (m.api === "openai-responses" ? "responses" : "chat");

console.log("### OpenCode Zen (" + OPENCODE_MODELS.length + " models)");
console.log("");
console.log("| ID | Context | Max output | API | Thinking | Vision |");
console.log("|---|---|---|---|---|---|");
for (const m of OPENCODE_MODELS)
 console.log(`| \`${m.id}\` | ${fmt(m.contextWindow)} | ${fmt(m.maxTokens)} | ${api(m)} | ${levels(m)} | ${vision(m)} |`);

console.log("");
console.log("### KiloCode Gateway (" + KILO_MODELS.length + " models, keyless)");
console.log("");
console.log("| ID | Context | Max output | API | Thinking | Vision |");
console.log("|---|---|---|---|---|---|");
for (const m of KILO_MODELS)
 console.log(`| \`${m.id}\` | ${fmt(m.contextWindow)} | ${fmt(m.maxTokens)} | ${api(m)} | ${levels(m)} | ${vision(m)} |`);

console.log("");
console.log("### Cline (" + CLINE_MODELS.length + " models, account required)");
console.log("");
console.log("| ID | Context | Max output | API |");
console.log("|---|---|---|---|");
for (const m of CLINE_MODELS)
 console.log(`| \`${m.id}\` | ${fmt(m.contextWindow)} | ${fmt(m.maxTokens)} | ${api(m)} |`);

console.log("");
console.log("### OVHcloud AI Endpoints (" + OVH_MODELS.length + " models, keyless direct)");
console.log("");
console.log("| ID | Context | Max output | API |");
console.log("|---|---|---|---|");
for (const m of OVH_MODELS)
 console.log(`| \`${m.id}\` | ${fmt(m.contextWindow)} | ${fmt(m.maxTokens)} | ${api(m)} |`);

console.log("");
console.log("### Aliases");
console.log("");
const aliases = Object.entries(MODEL_ALIASES)
 .map(([a, id]) => `\`${a}\` → \`${id}\``)
 .join(", ");
console.log(aliases);

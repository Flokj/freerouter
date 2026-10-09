/**
 * Core type definitions for pi-freeflow
 */

export type ProviderApi = "openai-completions" | "openai-responses" | "anthropic-messages";
export type Upstream = "opencode" | "kilo" | "cline";

export type ThinkingLevel =
 | "off"
 | "minimal"
 | "low"
 | "medium"
 | "high"
 | "xhigh"
 | "max";

export type ThinkingLevelMap = Partial<Record<ThinkingLevel, string | null>>;

export type ModelInputType = "text" | "image" | "video";

export interface ModelDef {
 id: string;
 name: string;
 reasoning: boolean;
 contextWindow: number;
 maxTokens: number;
 api?: ProviderApi;
 input?: ModelInputType[];
 thinkingFormat?: "openrouter";
 thinkingLevelMap?: ThinkingLevelMap;
}

export type RegisteredModel = ModelDef & {
 source: Upstream;
};

export interface KnownRelay {
 url: string;
 label?: string;
 addedAt?: string;
 /** Shared secret set by /freeflow deploy; proxy sends x-relay-auth only when present. */
 auth?: string;
}
export type RelayMode = "auto" | "on" | "off" | "spread";

export interface RelayState {
 mode?: RelayMode;
 enabled: boolean;
 url: string;
 relays: KnownRelay[];
 hideWidget?: boolean;
}
export type LogLevel = "debug" | "info" | "warn" | "error" | "audit";

export interface DebugState {
 debug: boolean;
 level?: LogLevel;
}

export interface RawModelItem {
 id: string;
 name?: string;
 context_length?: number;
 max_tokens?: number;
 contextWindow?: number;
 maxTokens?: number;
 reasoning?: boolean;
 [key: string]: unknown;
}

export interface CatalogCacheData {
 timestamp: number;
 opencode: string[];
 kilo: string[];
 models?: RegisteredModel[];
 etag?: string;
}

// ── Status surface ──
// The proxy reports relay/gate transitions through an optional sink. In the
// standalone server no host UI is wired, so this stays null and every notify
// is a no-op; the interface keeps those call sites typed and swappable.

export interface ExtensionUIContext {
 notify(message: string, type?: "info" | "warning" | "error"): void;
 setStatus(key: string, status: string | undefined): void;
 input(prompt: string, placeholder?: string): Promise<string | undefined>;
 select(prompt: string, options: string[]): Promise<string | undefined>;
 confirm?(title: string, message?: string): Promise<boolean>;
}

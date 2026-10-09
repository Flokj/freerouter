import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isRelayEligibleModel } from "../src/proxy.ts";
import { resolveCanonicalModelId } from "../src/models.ts";

describe("isRelayEligibleModel", () => {
	it("accepts a registered free model", () => {
		assert.equal(isRelayEligibleModel("big-pickle"), true);
	});

	it("accepts an alias that resolves to a registered model", () => {
		assert.equal(isRelayEligibleModel("mimo-v2.6-flash"), true);
		assert.equal(isRelayEligibleModel("nemotron-3.5-lightning"), true);
	});

	it("rejects a cline model (direct-only, never relayed)", () => {
		assert.equal(isRelayEligibleModel("cline-free/kimi-k3"), false);
		assert.equal(isRelayEligibleModel("z-ai/glm-5.3-flash"), false);
	});

	it("rejects a non-string model but tolerates absent ones", () => {
		assert.equal(isRelayEligibleModel(42), false);
		assert.equal(isRelayEligibleModel(undefined), true);
		assert.equal(isRelayEligibleModel(null), true);
		assert.equal(isRelayEligibleModel("   "), true);
	});
});

describe("alias canonicalization before upstream dispatch", () => {
	// Regression: the model id is forwarded upstream verbatim, and upstreams
	// read an unknown id as a paid model (Kilo: PAID_MODEL_AUTH_REQUIRED). The
	// request body must carry the canonical id, so every catalog alias has to
	// resolve to something the upstream actually serves.
	const ALIASES = [
		"nemotron-3.5-lightning",
		"mimo-v2.6-flash",
		"north-mini-code",
		"lfm-2.5",
		"kilo-auto",
		"openrouter",
		"glyph-cluster",
		"inkling-small",
	];

	it("resolves every shipped alias to a real model id", () => {
		for (const alias of ALIASES) {
			const canonical = resolveCanonicalModelId(alias);
			assert.notEqual(canonical, alias, `${alias} did not resolve`);
			assert.ok(canonical.length > 0, alias);
		}
	});

	it("keeps the canonical id free (never a paid id)", () => {
		for (const alias of ALIASES) {
			assert.equal(isRelayEligibleModel(alias), true, `${alias} -> ${resolveCanonicalModelId(alias)}`);
		}
	});
});
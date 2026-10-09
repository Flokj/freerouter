import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
	ALL_MODELS,
	CLINE_MODELS,
	KILO_MODELS,
	MODEL_ALIASES,
	MODEL_MAP,
	OPENCODE_MODELS,
	getModelDef,
	getModelUpstream,
	isClineModel,
	isKiloModel,
	resolveCanonicalModelId,
} from "../src/models.ts";

describe("model catalog", () => {
	it("registers 30 models", () => {
		assert.equal(ALL_MODELS.length, 30);
		assert.equal(OPENCODE_MODELS.length + KILO_MODELS.length + CLINE_MODELS.length, 30);
	});

	it("exposes every model through MODEL_MAP keyed by id", () => {
		for (const m of ALL_MODELS) {
			assert.equal(MODEL_MAP.get(m.id), m, `${m.id} missing from MODEL_MAP`);
		}
		assert.equal(MODEL_MAP.size, ALL_MODELS.length);
	});

	it("has no duplicate ids across upstreams", () => {
		const seen = new Set();
		for (const m of ALL_MODELS) {
			assert.ok(!seen.has(m.id), `duplicate model id ${m.id}`);
			seen.add(m.id);
		}
	});

	it("gives every model a non-empty name and positive limits", () => {
		for (const m of ALL_MODELS) {
			assert.ok(m.name && m.name.trim(), `${m.id} has no name`);
			assert.ok(m.contextWindow > 0, `${m.id} has no context window`);
			assert.ok(m.maxTokens > 0, `${m.id} has no maxTokens`);
		}
	});

	it("routes each model to a known upstream", () => {
		const sources = new Set(ALL_MODELS.map((m) => getModelUpstream(m.id)));
		for (const s of sources) {
			assert.ok(["opencode", "kilo", "cline"].includes(s), `unknown upstream ${s}`);
		}
	});

	it("classifies kilo and cline models", () => {
		for (const m of KILO_MODELS) assert.equal(isKiloModel(m.id), true, m.id);
		for (const m of CLINE_MODELS) assert.equal(isClineModel(m.id), true, m.id);
		for (const m of OPENCODE_MODELS) {
			assert.equal(isKiloModel(m.id), false, m.id);
			assert.equal(isClineModel(m.id), false, m.id);
		}
	});
});

describe("model aliases", () => {
	it("points every alias at a registered model", () => {
		for (const [alias, target] of Object.entries(MODEL_ALIASES)) {
			assert.ok(MODEL_MAP.has(target), `alias ${alias} -> ${target} not registered`);
		}
	});

	it("resolves an alias to its canonical id", () => {
		for (const [alias, target] of Object.entries(MODEL_ALIASES)) {
			assert.equal(resolveCanonicalModelId(alias), target, alias);
		}
	});

	it("passes an unknown id through unchanged", () => {
		assert.equal(resolveCanonicalModelId("no-such-model"), "no-such-model");
	});

	it("resolves a canonical id to itself", () => {
		for (const m of ALL_MODELS) {
			assert.equal(resolveCanonicalModelId(m.id), m.id, m.id);
		}
	});
});

describe("model lookup", () => {
	it("returns the definition for a known id", () => {
		assert.equal(getModelDef("big-pickle")?.id, "big-pickle");
	});

	it("returns undefined for an unknown id", () => {
		assert.equal(getModelDef("no-such-model"), undefined);
	});
});
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isLoopbackIP } from "../src/health.ts";
import {
	extractExpiredReasoningIds,
	isExpiredReasoningReference,
	isReasoningCallerMismatch,
	responsesConversationKey,
} from "../src/responses.ts";
import { isSubstantial, isTransientModelFailureFrame, SUBSTANTIAL_MIN_BYTES, SUBSTANTIAL_MIN_CHUNKS } from "../src/stream-pipe.ts";
import {
	isFreeTierGate,
	pickFailoverModel,
	rejectionFingerprint,
	sessionKeyOf,
} from "../src/upstream-health.ts";

describe("isLoopbackIP", () => {
	it("accepts loopback forms", () => {
		for (const ip of ["127.0.0.1", "::1", "localhost", "::ffff:127.0.0.1"]) {
			assert.equal(isLoopbackIP(ip), true, ip);
		}
	});

	it("rejects everything else", () => {
		for (const ip of ["", "192.168.1.5", "10.0.0.1", "8.8.8.8", "::2"]) {
			assert.equal(isLoopbackIP(ip), false, ip);
		}
	});

	it("strips a zone index", () => {
		assert.equal(isLoopbackIP("fe80::1%lo0"), false);
	});
});

describe("upstream gate detection", () => {
	const gateBody =
		'{"error":{"code":"FreeTierError","message":"This model can only be used from within OpenCode"}}';

	it("matches a free-tier gate refusal", () => {
		assert.equal(isFreeTierGate(403, gateBody), true);
	});

	it("needs both the code and the message marker", () => {
		assert.equal(isFreeTierGate(403, '{"code":"FreeTierError"}'), false);
		assert.equal(isFreeTierGate(403, '{"message":"only be used from within OpenCode"}'), false);
	});

	it("ignores other statuses and bodies", () => {
		assert.equal(isFreeTierGate(429, gateBody), false);
		assert.equal(isFreeTierGate(403, '{"error":"nope"}'), false);
		assert.equal(isFreeTierGate(403, 42), false);
	});
});

describe("session keys and fingerprints", () => {
	it("reads a non-empty prompt_cache_key", () => {
		assert.equal(sessionKeyOf({ prompt_cache_key: "abc" }), "abc");
	});

	it("returns null for a missing or empty key", () => {
		assert.equal(sessionKeyOf({}), null);
		assert.equal(sessionKeyOf({ prompt_cache_key: "" }), null);
		assert.equal(sessionKeyOf(null), null);
	});

	it("prefers the stable key when fingerprinting", () => {
		assert.equal(rejectionFingerprint({ prompt_cache_key: "k1" }, "/v1/chat/completions"), "k:k1");
	});

	it("hashes content for keyless bodies", () => {
		const body = { model: "m", messages: [{ role: "user", content: "hi" }] };
		const fp = rejectionFingerprint(body, "/v1/chat/completions");
		assert.ok(fp?.startsWith("h:"));
		assert.equal(fp, rejectionFingerprint(body, "/v1/chat/completions"));
		assert.notEqual(fp, rejectionFingerprint({ ...body, messages: [{ role: "user", content: "other" }] }, "/v1/chat/completions"));
	});

	it("returns null when there is nothing to hash", () => {
		assert.equal(rejectionFingerprint({ model: "m" }, "/v1/chat/completions"), null);
		assert.equal(rejectionFingerprint(null, "/v1/chat/completions"), null);
	});
});

describe("pickFailoverModel", () => {
	it("returns a non-empty kilo model id", () => {
		const id = pickFailoverModel("whatever");
		assert.equal(typeof id, "string");
		assert.ok(id.length > 0);
	});
});

describe("reasoning reference handling", () => {
	it("detects a caller mismatch", () => {
		assert.equal(isReasoningCallerMismatch("encrypted_content in the request was not issued to this caller"), true);
		assert.equal(isReasoningCallerMismatch("server_error"), false);
	});

	it("detects an expired reasoning reference", () => {
		assert.equal(isExpiredReasoningReference("the referenced reasoning item rs_abc was not found or has expired"), true);
		assert.equal(isReasoningCallerMismatch("the referenced reasoning item was not found or has expired"), false);
		assert.equal(isExpiredReasoningReference("server_error"), false);
	});

	it("extracts every named reasoning id", () => {
		assert.deepEqual(extractExpiredReasoningIds("rs_1 and rs_2 expired"), ["rs_1", "rs_2"]);
		assert.deepEqual(extractExpiredReasoningIds("nothing here"), []);
	});

	it("reads the responses conversation key", () => {
		assert.equal(responsesConversationKey({ prompt_cache_key: "c1" }), "c1");
		assert.equal(responsesConversationKey({}), null);
		assert.equal(responsesConversationKey("x"), null);
	});
});

describe("stream classification", () => {
	it("treats a turn as substantial only past both thresholds", () => {
		assert.equal(isSubstantial(SUBSTANTIAL_MIN_CHUNKS + 1, SUBSTANTIAL_MIN_BYTES + 1), true);
		assert.equal(isSubstantial(SUBSTANTIAL_MIN_CHUNKS, SUBSTANTIAL_MIN_BYTES + 1), false);
		assert.equal(isSubstantial(SUBSTANTIAL_MIN_CHUNKS + 1, SUBSTANTIAL_MIN_BYTES), false);
	});

	it("resumes only a transient model fault", () => {
		assert.equal(isTransientModelFailureFrame('{"type":"response.failed","status":"failed","error":{"code":"server_error"}}'), true);
	});

	it("never resumes a deterministic verdict", () => {
		for (const marker of ["invalid_request", "rate_limit", "quota", "FreeTierError", "authentication"]) {
			assert.equal(
				isTransientModelFailureFrame(`{"status":"failed","error":{"code":"${marker}","m":"server_error"}}`),
				false,
				marker,
			);
		}
	});

	it("ignores clean terminals", () => {
		assert.equal(isTransientModelFailureFrame('{"type":"response.completed"}'), false);
		assert.equal(isTransientModelFailureFrame(""), false);
	});
});
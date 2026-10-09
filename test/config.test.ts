import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
	ALLOWED_METHODS,
	isSupportedOpenCodeVersion,
	OPENCODE_USER_AGENT,
	OPENCODE_VERSION_FLOOR,
	PATH_TRAVERSAL_PATTERN,
	toOpenCodeUserAgent,
} from "../src/config.ts";

describe("opencode version floor", () => {
	it("rejects versions below the free-tier floor", () => {
		assert.equal(isSupportedOpenCodeVersion("1.16.9"), false);
		assert.equal(isSupportedOpenCodeVersion(OPENCODE_VERSION_FLOOR), true);
		assert.equal(isSupportedOpenCodeVersion("1.20.0"), true);
	});

	it("rejects a non-string version", () => {
		assert.equal(isSupportedOpenCodeVersion(undefined), false);
		assert.equal(isSupportedOpenCodeVersion(118), false);
		assert.equal(isSupportedOpenCodeVersion(null), false);
	});

	it("builds a user agent from a supported version", () => {
		assert.equal(toOpenCodeUserAgent("1.18.34"), "opencode/1.18.34");
	});

	it("pins the shipped user agent to a supported version", () => {
		const pinned = OPENCODE_USER_AGENT.split("/")[1];
		assert.ok(pinned, "user agent carries no version");
		assert.ok(
			isSupportedOpenCodeVersion(pinned),
			`shipped user agent ${pinned} is below the free-tier floor ${OPENCODE_VERSION_FLOOR}`,
		);
	});

	it("returns null for an unsupported version", () => {
		assert.equal(toOpenCodeUserAgent("1.10.0"), null);
		assert.equal(toOpenCodeUserAgent("garbage"), null);
	});
});

describe("path safety", () => {
	it("matches path traversal attempts", () => {
		assert.equal(PATH_TRAVERSAL_PATTERN.test("../etc/passwd"), true);
		assert.equal(PATH_TRAVERSAL_PATTERN.test("v1/../../secret"), true);
		assert.equal(PATH_TRAVERSAL_PATTERN.test("v1/models"), false);
	});

	it("allows only the expected HTTP methods", () => {
		for (const m of ["GET", "POST", "OPTIONS", "HEAD"]) {
			assert.equal(ALLOWED_METHODS.has(m), true, m);
		}
		for (const m of ["DELETE", "PUT", "PATCH", "TRACE"]) {
			assert.equal(ALLOWED_METHODS.has(m), false, m);
		}
	});
});
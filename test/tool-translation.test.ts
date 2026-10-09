import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
	apiForPathname,
	canonicalizeTool,
	isFindToolName,
	isOmpLikeCaller,
	toAnthropicTool,
	toChatTool,
	toResponsesTool,
	upstreamToolNameFor,
} from "../src/tool-translation.ts";

describe("canonicalizeTool", () => {
	it("reads a chat-shaped function tool", () => {
		const c = canonicalizeTool({
			type: "function",
			function: { name: " read ", description: "Read a file", parameters: { type: "object", properties: { p: { type: "string" } } } },
		});
		assert.equal(c?.name, "read");
		assert.equal(c?.description, "Read a file");
		assert.equal(c?.parameters.type, "object");
	});

	it("reads a responses-shaped flat tool", () => {
		const c = canonicalizeTool({ type: "function", name: "edit", description: "d", parameters: { type: "object", properties: {} } });
		assert.equal(c?.name, "edit");
		assert.equal(c?.description, "d");
	});

	it("reads an anthropic-shaped tool", () => {
		const c = canonicalizeTool({ name: "bash", description: "d", input_schema: { type: "object", properties: {} } });
		assert.equal(c?.name, "bash");
	});

	it("returns null for a non-function tool so it rides verbatim", () => {
		assert.equal(canonicalizeTool({ type: "web_search" }), null);
		assert.equal(canonicalizeTool(null), null);
		assert.equal(canonicalizeTool("read"), null);
		assert.equal(canonicalizeTool([{ name: "read" }]), null);
	});

	it("returns null when no name is present", () => {
		assert.equal(canonicalizeTool({ type: "function", description: "d" }), null);
		assert.equal(canonicalizeTool({ type: "function", function: { description: "d" } }), null);
	});

	it("carries strict only when it is a top-level boolean", () => {
		assert.equal(canonicalizeTool({ name: "a", strict: true })?.strict, true);
		assert.equal(canonicalizeTool({ name: "a", strict: "yes" })?.strict, undefined);
	});

	it("defaults parameters to an empty object schema", () => {
		assert.deepEqual(canonicalizeTool({ name: "a" })?.parameters, { type: "object", properties: {} });
	});
});

describe("tool shape conversion", () => {
	const canon = canonicalizeTool({ name: "read", description: "d", parameters: { type: "object", properties: {} }, strict: true });

	it("emits chat shape with a function wrapper", () => {
		const t = toChatTool(canon!);
		assert.equal(t.type, "function");
		assert.equal((t.function as Record<string, unknown>).name, "read");
		assert.equal(t.strict, true);
	});

	it("emits responses shape flat", () => {
		const t = toResponsesTool(canon!);
		assert.equal(t.name, "read");
		assert.equal(t.strict, true);
		assert.ok(!("function" in t));
	});

	it("emits anthropic shape with input_schema", () => {
		const t = toAnthropicTool(canon!);
		assert.equal(t.name, "read");
		assert.ok(t.input_schema);
		assert.equal(t.type, undefined);
	});

	it("omits strict when the caller did not set it", () => {
		const plain = canonicalizeTool({ name: "read", description: "d", parameters: { type: "object", properties: {} } })!;
		for (const out of [toChatTool(plain), toResponsesTool(plain), toAnthropicTool(plain)]) {
			assert.equal(out.strict, undefined);
		}
	});
});

describe("apiForPathname", () => {
	it("maps responses, messages and chat paths", () => {
		assert.equal(apiForPathname("/v1/responses"), "responses");
		assert.equal(apiForPathname("/v1/messages"), "messages");
		assert.equal(apiForPathname("/v1/chat/completions"), "chat");
		assert.equal(apiForPathname("/anything/else"), "chat");
	});
});

describe("find to glob rename", () => {
	it("treats find (any case) as the renamed tool", () => {
		assert.equal(isFindToolName("find"), true);
		assert.equal(isFindToolName("FIND"), true);
		assert.equal(isFindToolName(" Find "), true);
	});

	it("leaves every other name alone", () => {
		assert.equal(isFindToolName("glob"), false);
		assert.equal(isFindToolName("grep"), false);
	});

	it("maps find to glob upstream and trims", () => {
		assert.equal(upstreamToolNameFor("find"), "glob");
		assert.equal(upstreamToolNameFor(" FIND "), "glob");
		assert.equal(upstreamToolNameFor(" read "), "read");
	});
});

describe("isOmpLikeCaller", () => {
	it("detects explicit caller markers", () => {
		for (const marker of ["ask", "task", "todo", "hub", "lsp"]) {
			assert.equal(isOmpLikeCaller(["read", marker]), true, marker);
		}
	});

	it("detects glob without find", () => {
		assert.equal(isOmpLikeCaller(["read", "glob"]), true);
		assert.equal(isOmpLikeCaller(["glob", "find"]), false);
	});

	it("returns false for a plain caller", () => {
		assert.equal(isOmpLikeCaller(["read", "write"]), false);
	});
});
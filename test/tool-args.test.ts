import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildArgRepairSchemas, repairToolArguments, repairToolArgumentsValue } from "../src/tool-args.ts";

// The real-world OMP todo schema, simplified: one declared object-array and
// one declared string-array. Free models reliably get this wrong.
const todoTool = {
	type: "function",
	function: {
		name: "todo",
		parameters: {
			type: "object",
			properties: {
				list: {
					type: "array",
					items: {
						type: "object",
						properties: { phase: { type: "string" }, items: { type: "array", items: { type: "string" } } },
						required: ["phase"],
					},
				},
				note: { type: "array", items: { type: "string" } },
			},
		},
	},
};

const schemas = buildArgRepairSchemas([todoTool]);
const S = () => schemas;

describe("buildArgRepairSchemas", () => {
	it("keys the schema by lowercased caller tool name", () => {
		assert.ok(schemas.has("todo"));
	});

	it("skips tools with no structural property", () => {
		const s = buildArgRepairSchemas([{ name: "read", parameters: { type: "object", properties: { path: { type: "string" } } } }]);
		assert.equal(s.size, 0);
	});

	it("ignores non-function entries", () => {
		assert.equal(buildArgRepairSchemas([{ type: "web_search" }]).size, 0);
	});
});

describe("repairToolArguments", () => {
	it("returns well-formed arguments byte-identical", () => {
		const good = JSON.stringify({ list: [{ phase: "p", items: ["a"] }] });
		assert.equal(repairToolArguments("todo", good, S()), good);
	});

	it("decodes an object-array that arrived as a JSON string", () => {
		const out = repairToolArguments("todo", JSON.stringify({ list: '[{"phase":"p","items":["a"]}]' }), S());
		assert.deepEqual(JSON.parse(out), { list: [{ phase: "p", items: ["a"] }] });
	});

	it("unwraps a single-key envelope around an array", () => {
		const out = repairToolArguments("todo", JSON.stringify({ list: { item: [{ phase: "p", items: [] }] } }), S());
		assert.deepEqual(JSON.parse(out), { list: [{ phase: "p", items: [] }] });
	});

	it("promotes JSON-encoded phases out of a declared string-array", () => {
		const args = { note: ['{"phase":"p1","items":["a"]}', '{"phase":"p2","items":["b"]}'] };
		const out = JSON.parse(repairToolArguments("todo", JSON.stringify(args), S()));
		assert.equal(out.note, undefined);
		assert.deepEqual(out.list, [
			{ phase: "p1", items: ["a"] },
			{ phase: "p2", items: ["b"] },
		]);
	});

	it("adopts invented vocabulary onto declared keys by role", () => {
		// The model encoded a phase object using keys the schema never declared.
		const args = { note: ['{"name":"p1","items":["a"]}'] };
		const out = JSON.parse(repairToolArguments("todo", JSON.stringify(args), S()));
		assert.equal(out.note, undefined);
		assert.deepEqual(out.list, [{ phase: "p1", items: ["a"] }]);
	});

	it("refuses to adopt when the mapping would be ambiguous", () => {
		// Two unknown string keys, two missing string slots: no forced mapping.
		const tool = {
			name: "pair",
			parameters: {
				type: "object",
				properties: {
					a: { type: "string" },
					b: { type: "string" },
					rest: { type: "array", items: { type: "object", properties: { keep: { type: "string" } }, required: ["keep"] } },
				},
			},
		};
		const s = buildArgRepairSchemas([tool]);
		const args = JSON.stringify({ x: "1", y: "2", rest: [{ keep: "k" }] });
		assert.equal(repairToolArguments("pair", args, s), args);
	});

	it("refuses to promote when one element does not validate", () => {
		const args = { note: ['{"phase":"p1","items":["a"]}', "just a label"] };
		const original = JSON.stringify(args);
		assert.equal(repairToolArguments("todo", original, S()), original);
	});

	it("never completes truncated JSON", () => {
		const truncated = '{"list":[{"phase":"p"';
		assert.equal(repairToolArguments("todo", truncated, S()), truncated);
	});

	it("salvages a payload with a fragment of the previous call spliced on", () => {
		const junk = ',"timeout":400}{"list":[{"phase":"p","items":["a"]}]}';
		const out = JSON.parse(repairToolArguments("todo", junk, S()));
		assert.deepEqual(out.list, [{ phase: "p", items: ["a"] }]);
	});

	it("passes arguments through for an unknown tool", () => {
		const args = JSON.stringify({ list: { item: [] } });
		assert.equal(repairToolArguments("nope", args, S()), args);
	});

	it("passes arguments through when no schemas are supplied", () => {
		const args = JSON.stringify({ list: { item: [] } });
		assert.equal(repairToolArguments("todo", args, undefined), args);
		assert.equal(repairToolArguments("todo", args, new Map()), args);
	});

	it("never decodes a declared string property", () => {
		const tool = {
			name: "note",
			parameters: { type: "object", properties: { body: { type: "string" }, meta: { type: "object", properties: {} } } },
		};
		const s = buildArgRepairSchemas([tool]);
		const args = JSON.stringify({ body: '{"keep":"me"}' });
		assert.equal(repairToolArguments("note", args, s), args);
	});
});

describe("repairToolArgumentsValue", () => {
	it("returns the same object reference when nothing changes", () => {
		const args = { list: [{ phase: "p", items: [] }] };
		assert.equal(repairToolArgumentsValue("todo", args, S()), args);
	});

	it("repairs a parsed payload in place", () => {
		const out = repairToolArgumentsValue("todo", { note: ['{"phase":"p1","items":["a"]}'] }, S());
		assert.deepEqual(out, { list: [{ phase: "p1", items: ["a"] }] });
	});

	it("returns the input untouched for a non-object", () => {
		assert.equal(repairToolArgumentsValue("todo", "text", S()), "text");
		assert.equal(repairToolArgumentsValue("todo", null, S()), null);
	});
});
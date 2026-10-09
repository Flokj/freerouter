// Test bootstrap: give every suite an isolated data dir so nothing reads or
// writes the real ~/.pi-freeflow state (relay config, catalog cache, logs).
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const dir = mkdtempSync(join(tmpdir(), "freeflow-test-"));
process.env.PI_FREEFLOW_DATA_DIR = dir;
process.env.HOME = dir;

process.on("exit", () => {
	try {
		rmSync(dir, { recursive: true, force: true });
	} catch {
		// best effort; the OS cleans tmp eventually
	}
});
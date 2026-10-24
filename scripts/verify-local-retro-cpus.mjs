import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
const selected = process.argv[3];
const output = resolve(process.argv[2] ?? "build/retro-cpu-verification");
assert.ok(process.env.GHIDRA_INSTALL_DIR, "Set GHIDRA_INSTALL_DIR first");
const root = resolve(import.meta.dirname, "..");
await mkdir(output, { recursive: true });
const fixtures = [
  {
    cpu: "6510",
    entry: "0x1001",
    hex: "a92f8500a9378501a50160",
    language: "6510:LE:16:default",
    checks: [/STA/, /LDA/, /RTS/],
  },
  {
    cpu: "8500",
    entry: "0x1001",
    hex: "a92f8500a9378501a50160",
    language: "8500:LE:16:default",
    checks: [/STA/, /LDA/, /RTS/],
  },

  {
    cpu: "65c02",
    entry: "0x8001",
    hex: "a92a9c0020dafa8002a90060",
    language: "65C02:LE:16:default",
    checks: [/STZ/, /PHX/, /PLX/, /BRA/],
  },
  {
    cpu: "65816",
    entry: "0x128001",
    hex: "c230a93412a27856e230a92aa205af5634126b",
    language: "65816:LE:16:default",
    checks: [/REP/, /SEP/, /1234/i, /5678/i, /123456/i, /RTL/],
  },
  {
    cpu: "8080",
    entry: "0x8001",
    hex: "3e07cd0c80c601c9000000c603c9",
    language: "8080:LE:16:default",
    checks: [/MVI/, /CALL.*800c/i, /ADI/, /RET/],
  },
  {
    cpu: "6800",
    entry: "0x8001",
    hex: "8607bd800c8b01390101018b0339",
    language: "MC6800:BE:16:default",
    checks: [/LDAA|LDA/, /JSR.*800c/i, /ADDA|ADD/, /RTS/],
  },
];
const env = {
  ...process.env,
  REA_ANALYSIS_PROVIDER: "ghidra",
  REA_LOG_LEVEL: "silent",
};
delete env.REA_GHIDRA_SEED_FILE;
const transport = new StdioClientTransport({
  command: process.execPath,
  args: [join(root, "scripts/rea.mjs"), "mcp"],
  env,
  stderr: "pipe",
});
const client = new Client({
  name: "rea-local-retro-cpu-verifier",
  version: "1",
});
let stderr = "";
transport.stderr?.on("data", (x) => {
  stderr = (stderr + x.toString()).slice(-65536);
});
const reports = [];
try {
  await client.connect(transport);
  for (const f of fixtures.filter(
    (f) => !selected || selected.split(",").includes(f.cpu),
  )) {
    const path = join(output, f.cpu + ".raw");
    const bytes = Buffer.from(f.hex, "hex");
    await writeFile(path, bytes);
    await call("open_binary", {
      path,
      format: "raw-binary",
      architecture: f.cpu,
      entry_point: f.entry,
      provider_id: "ghidra",
    });
    const image = await call("inspect_native_load_image");
    await writeFile(
      join(output, f.cpu + "-mapping.json"),
      JSON.stringify(image, null, 2),
    );
    assert.equal(
      image.normalized_result.status,
      "verified",
      f.cpu + " mapping",
    );
    assert.equal(image.normalized_result.language_id, f.language);
    const fn = await call("analyze_function", { procedure: f.entry });
    await writeFile(
      join(output, f.cpu + "-function.json"),
      JSON.stringify(fn, null, 2),
    );
    const asm = fn.normalized_result.assembly.join("\n");
    for (const pattern of f.checks)
      assert.match(asm, pattern, f.cpu + " instructions");
    if (f.cpu === "6510" || f.cpu === "8500") {
      const pseudo = fn.normalized_result.pseudocode;
      assert.match(
        pseudo,
        /CPU_PORT_DDR/,
        "Port DDR symbol must survive decompilation",
      );
      assert.match(
        pseudo,
        /CPU_PORT_DATA/,
        "Port data symbol must survive decompilation",
      );
      assert.doesNotMatch(
        pseudo,
        /return\s+(?:0x37|55)\s*;/,
        "A volatile port read must not fold to the last stored constant",
      );
    }
    if (f.cpu === "65816") {
      assert.match(asm, /128006: LDX/i); // Three-byte LDA then three-byte LDX in native 16-bit mode.
      assert.match(asm, /12800d: LDX/i); // Two-byte LDA then two-byte LDX after SEP.
    }
    const sha = createHash("sha256").update(bytes).digest("hex");
    assert.equal(fn.subject.digest.sha256, sha);
    assert.equal(
      createHash("sha256")
        .update(await readFile(path))
        .digest("hex"),
      sha,
    );
    await writeFile(
      join(output, f.cpu + ".asm"),
      "; Ghidra listing of self-owned verification fixture\n" + asm + "\n",
    );
    await writeFile(
      join(output, f.cpu + ".c"),
      "/* Ghidra pseudocode, not original source or independently validated semantics. */\n" +
        fn.normalized_result.pseudocode,
    );
    await call("close_binary");
    reports.push({
      cpu: f.cpu,
      language: f.language,
      mapping: "verified",
      assembly: asm,
      pseudocode_returned: typeof fn.normalized_result.pseudocode === "string",
      source_unchanged: true,
    });
    console.log(
      f.cpu + ": real Ghidra mapping, instructions and pseudocode verified",
    );
  }
} catch (error) {
  if (stderr) await writeFile(join(output, "stderr.txt"), stderr);
  throw error;
} finally {
  try {
    await client.close();
  } finally {
    await transport.close();
  }
}
await writeFile(
  join(output, "verification.json"),
  JSON.stringify({ ok: true, mocked: false, reports }, null, 2),
);
async function call(name, args = {}) {
  const result = await client.callTool(
    { name, arguments: args },
    { timeout: 240000 },
  );
  if (result.isError) {
    await writeFile(
      join(output, "last-error.json"),
      JSON.stringify(result, null, 2),
    );
    throw new Error(name + " failed; see last-error.json");
  }
  return (
    result.structuredContent ??
    JSON.parse(result.content.find((c) => c.type === "text").text)
  );
}

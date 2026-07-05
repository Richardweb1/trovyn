import fs from "node:fs";

const source = fs.readFileSync(new URL("../contracts/trovyn.py", import.meta.url), "utf8");
const required = [
  "class Trovyn(gl.Contract)",
  "def compare_items(",
  "def get_latest(self) -> str",
  "def get_count(self) -> int",
  "run_nondet_unsafe",
];
for (const token of required) {
  if (!source.includes(token)) throw new Error(`Contract schema is missing: ${token}`);
}
if (!/def __init__\(self\):/.test(source)) throw new Error("Constructor must not require arguments");
console.log("Trovyn contract schema looks valid.");

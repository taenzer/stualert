import { rm, mkdir, cp } from "node:fs/promises";
import path from "node:path";

const from = path.resolve("web/dist");
const to = path.resolve("dist/public");

await rm(to, { recursive: true, force: true });
await mkdir(to, { recursive: true });
await cp(from, to, { recursive: true });

console.log(`Copied ${from} -> ${to}`);

#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");

const port = process.env.PORT || "4173";
const viteBin = path.join(process.cwd(), "node_modules", "vite", "bin", "vite.js");

const child = spawn(
  process.execPath,
  [viteBin, "preview", "--host", "0.0.0.0", "--port", port],
  {
    stdio: "inherit",
    env: process.env,
  }
);

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

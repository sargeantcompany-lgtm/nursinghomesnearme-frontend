#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const url = require("url");
const { run } = require("react-snap");
const pkg = require(path.join(process.cwd(), "package.json"));

const reactSnap = pkg.reactSnap || {};
const publicUrl = process.env.PUBLIC_URL || pkg.homepage;

function firstExistingPath(paths) {
  for (const p of paths) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }
  return undefined;
}

const executableFromEnv =
  process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || undefined;

const detectedExecutable = firstExistingPath([
  executableFromEnv,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
  "/usr/bin/chromium",
  "/opt/google/chrome/chrome",
]);

const options = {
  publicPath: publicUrl ? url.parse(publicUrl).pathname : "/",
  ...reactSnap,
  ...(detectedExecutable ? { puppeteerExecutablePath: detectedExecutable } : {}),
};

if (detectedExecutable) {
  console.log(`[react-snap] using browser: ${detectedExecutable}`);
} else {
  console.log("[react-snap] no browser path detected, skipping prerender");
  process.exit(0);
}

run(options).catch((error) => {
  console.error(error);
  process.exit(1);
});

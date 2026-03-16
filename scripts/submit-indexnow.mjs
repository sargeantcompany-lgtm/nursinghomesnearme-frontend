import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_HOST = "www.nursinghomesnearme.com.au";
const DEFAULT_KEY = "5e9eaa0a-6c18-4b06-a5b4-8a75a1d2f04a";
const DEFAULT_KEY_LOCATION = `https://${DEFAULT_HOST}/${DEFAULT_KEY}.txt`;
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";

function parseArgs(argv) {
  const args = {
    urls: [],
    fromSitemap: false,
    sitemapPath: path.resolve("public", "sitemap.xml"),
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "--from-sitemap") {
      args.fromSitemap = true;
      continue;
    }

    if (arg === "--url") {
      const value = argv[i + 1];
      if (value) {
        args.urls.push(value);
        i += 1;
      }
      continue;
    }

    if (arg === "--sitemap") {
      const value = argv[i + 1];
      if (value) {
        args.sitemapPath = path.resolve(value);
        i += 1;
      }
    }
  }

  return args;
}

async function getUrlsFromSitemap(sitemapPath) {
  const xml = await fs.readFile(sitemapPath, "utf8");
  const matches = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)];
  return matches.map((match) => match[1].trim()).filter(Boolean);
}

async function submitIndexNow(urlList) {
  const host = process.env.INDEXNOW_HOST || DEFAULT_HOST;
  const key = process.env.INDEXNOW_KEY || DEFAULT_KEY;
  const keyLocation = process.env.INDEXNOW_KEY_LOCATION || DEFAULT_KEY_LOCATION;

  if (!urlList.length) {
    throw new Error("No URLs supplied. Use --from-sitemap or --url <absolute-url>.");
  }

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      host,
      key,
      keyLocation,
      urlList,
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`IndexNow request failed (${response.status}): ${body}`);
  }

  return {
    status: response.status,
    body,
    host,
    keyLocation,
    count: urlList.length,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const urlSet = new Set(args.urls);

  if (args.fromSitemap) {
    const sitemapUrls = await getUrlsFromSitemap(args.sitemapPath);
    for (const url of sitemapUrls) {
      urlSet.add(url);
    }
  }

  const result = await submitIndexNow([...urlSet]);
  console.log(
    `Submitted ${result.count} URL(s) to IndexNow for ${result.host} using ${result.keyLocation}.`
  );
  if (result.body) {
    console.log(result.body);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

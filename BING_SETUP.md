# Bing Setup

This site now has an IndexNow key file hosted at:

- `https://www.nursinghomesnearme.com.au/5e9eaa0a-6c18-4b06-a5b4-8a75a1d2f04a.txt`

## What is already in place

- `public/robots.txt` points to the live sitemap
- `public/sitemap.xml` lists the main public pages and blog URLs
- canonical tags are set through `SeoHead`
- an IndexNow key file is hosted at the site root
- a submission script is available in `scripts/submit-indexnow.mjs`

## Bing Webmaster Tools

1. Verify `https://www.nursinghomesnearme.com.au/`
2. Submit `https://www.nursinghomesnearme.com.au/sitemap.xml`
3. Monitor crawl, index coverage, and URL inspection there

## IndexNow usage

Submit all sitemap URLs:

```bash
npm run bing:indexnow -- --from-sitemap
```

Submit one updated URL:

```bash
npm run bing:indexnow -- --url https://www.nursinghomesnearme.com.au/nursing-homes-robina
```

Submit several updated URLs:

```bash
npm run bing:indexnow -- --url https://www.nursinghomesnearme.com.au/ --url https://www.nursinghomesnearme.com.au/blog
```

## Daily Bing workflow

1. Publish or update a page
2. Update `public/sitemap.xml` if a new public URL was added
3. Deploy the site
4. Run `npm run bing:indexnow -- --url <page-url>` for changed pages
5. Run `npm run bing:indexnow -- --from-sitemap` after bigger content batches
6. Review Bing Webmaster Tools for crawl and indexing issues

## Notes

- The IndexNow key is public by design
- If you ever rotate the key, replace the root `.txt` file and update the script defaults
- Keep the canonical host consistent as `https://www.nursinghomesnearme.com.au`

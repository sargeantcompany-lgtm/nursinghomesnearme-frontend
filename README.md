# Nursing Homes Near Me Frontend

Frontend for `nursinghomesnearme.com.au`, built with React, TypeScript, and Vite.

## What this app includes

- Public marketing pages for aged care placement support
- Placement intake form that creates a client workflow
- Client dashboard login and workflow pages
- Facility login and response pages
- Admin tools for nursing homes and case management
- Blog and suburb landing pages
- Static SEO assets including `robots.txt`, `sitemap.xml`, and prerendering via `react-snap`

## Local development

Install dependencies:

```bash
npm install
```

Run the app locally:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Start the static frontend locally:

```bash
npm start
```

Start the backend locally:

```bash
npm run start:backend
```

Preview the production build:

```bash
npm run preview
```

## Environment

The frontend reads the API base URL from `VITE_API_BASE_URL`.

Example:

```env
VITE_API_BASE_URL=https://your-api-domain.com
```

If `VITE_API_BASE_URL` is empty, the frontend will call same-origin API paths such as `/api/workflow/placement-intake`.

The backend uses:

```env
DATABASE_URL=postgresql://...
APP_SECRET=...
ADMIN_PASSWORD=...
SITE_URL=https://www.nursinghomesnearme.com.au
CLIENT_LOGIN_FROM_EMAIL=hello@yourdomain.com
RESEND_API_KEY=...
ALLOWED_ORIGIN=https://www.nursinghomesnearme.com.au
```

Copy `.env.example` to `.env` and fill in the real values.

## Database and Railway

This repo now includes a lightweight Express API in [server/index.mjs](/c:/Users/aslam/Projects/nursinghomesnearme-frontend/server/index.mjs) and Postgres migrations in [server/migrate.mjs](/c:/Users/aslam/Projects/nursinghomesnearme-frontend/server/migrate.mjs).

Recommended Railway setup:

1. Create a Railway Postgres database.
2. Add `DATABASE_URL` from Railway to your service variables.
3. Add `APP_SECRET`, `ADMIN_PASSWORD`, `SITE_URL`, and `ALLOWED_ORIGIN`.
4. Add `RESEND_API_KEY` and `CLIENT_LOGIN_FROM_EMAIL` if you want live email delivery.
5. Set `VITE_API_BASE_URL` to the backend URL if frontend and backend are on different domains.

The server runs migrations automatically on startup, so a fresh Railway Postgres instance will create the required tables the first time the app boots.

This repo is shared by two Railway services:

- `nursinghomesnearme-frontend` serves `dist`
- `nursinghomesnearme-backend` runs `server/index.mjs`

`nixpacks.toml` switches between those start commands automatically using `RAILWAY_SERVICE_NAME`.

## Important flows

- Placement intake posts to `/api/workflow/placement-intake`
- Client login link requests post to `/api/workflow/request-login-link`
- Facility login link requests post to `/api/facility/auth/request-link`
- Admin case management uses `/api/admin/*`

## Launch checklist

- Confirm `VITE_API_BASE_URL` points to the live API
- Confirm `DATABASE_URL` is connected to Railway Postgres
- Test placement intake creation and dashboard link email delivery
- Test client login, password setup, and dashboard access
- Test facility login link delivery and dashboard access
- Test admin case editing and outbound case emails
- Keep `public/sitemap.xml` aligned with live blog posts and landing pages

## Daily SEO workflow

- Publish one useful article or landing-page improvement each day
- Update on-page title, meta description, internal links, and schema as needed
- Update `public/sitemap.xml` when a new indexable URL is added
- Submit the updated sitemap in Google Search Console and Bing Webmaster Tools
- Run `npm run bing:indexnow -- --url <changed-url>` after important page updates
- Run `npm run bing:indexnow -- --from-sitemap` after larger content batches
- Track which URLs were published, indexed, and improved

See [BING_SETUP.md](/c:/Users/aslam/Projects/nursinghomesnearme-frontend/BING_SETUP.md) for the Bing and IndexNow workflow.

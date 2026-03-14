# Railway Setup

This project now has:

- `nursinghomesnearme-frontend` for the Vite/React site
- `nursinghomesnearme-backend` for the Node/Express API
- a Railway Postgres database for persistent data

## What Goes Where

### Frontend service

Add these variables to the `nursinghomesnearme-frontend` service:

```env
VITE_API_BASE_URL=https://YOUR-BACKEND-DOMAIN
```

Optional:

```env
VITE_ADMIN_TOKEN=
```

Notes:

- `VITE_API_BASE_URL` should point to the backend public URL, not the frontend URL.
- Do not put Zoho passwords, database URLs, or other secrets on the frontend service.

### Backend service

Add these variables to the `nursinghomesnearme-backend` service.

Required:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
APP_ADMIN_PASSWORD=your-admin-password
ADMIN_TOKEN=long-random-secret-token
APP_PUBLIC_BASE_URL=https://www.nursinghomesnearme.com.au
APP_PUBLIC_API_BASE_URL=https://YOUR-BACKEND-DOMAIN
SPRING_MAIL_HOST=smtp.zoho.com.au
SPRING_MAIL_PORT=465
SPRING_MAIL_USERNAME=info@nursinghomesnearme.com.au
SPRING_MAIL_PASSWORD=your-real-zoho-app-password
SPRING_MAIL_SMTP_AUTH=true
SPRING_MAIL_SMTP_SSL_ENABLE=true
SPRING_MAIL_SMTP_STARTTLS_ENABLE=false
APP_ADMIN_NOTIFY_EMAIL=info@nursinghomesnearme.com.au
```

Recommended:

```env
NODE_ENV=production
PORT=3000
```

Optional compatibility vars supported by the backend:

```env
APP_SECRET=
SITE_URL=
ALLOWED_ORIGIN=
CLIENT_LOGIN_FROM_EMAIL=
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SMTP_AUTH=
SMTP_SSL=
SMTP_STARTTLS=
RESEND_API_KEY=
```

Notes:

- The backend already supports your existing `SPRING_MAIL_*`, `APP_*`, and `ADMIN_TOKEN` naming.
- `SPRING_MAIL_PASSWORD` must be the real Zoho app password before email sending will work.
- `DATABASE_URL` must come from Railway Postgres.

## Railway Postgres

1. In Railway, create a new Postgres service in the same project.
2. Open the Postgres service and copy/reference its `DATABASE_URL`.
3. Add `DATABASE_URL` to the backend service.
4. Redeploy the backend.

The backend runs database migrations automatically on startup, so the required tables will be created automatically.

## Deployment Order

1. Create Railway Postgres.
2. Add backend vars to `nursinghomesnearme-backend`.
3. Deploy backend.
4. Add `VITE_API_BASE_URL` to `nursinghomesnearme-frontend`.
5. Redeploy frontend.

## First Live Test

1. Log in to admin.
2. Import suburb location centers with lat/lng.
3. Import nursing homes with suburb and lat/lng.
4. Submit a placement enquiry on the public site.
5. Confirm a case is created in the database.
6. Confirm the dashboard link email sends from Zoho.
7. Confirm the client dashboard shows nearby options.

## Data Flow

- Frontend collects enquiry details
- Backend stores them in Postgres
- Backend uses suburb centers and nursing-home lat/lng to build nearby lists
- Backend sends dashboard and case emails through Zoho SMTP

## Important Reminder

Do not put these on the frontend service:

- `DATABASE_URL`
- `SPRING_MAIL_PASSWORD`
- `SPRING_MAIL_USERNAME`
- any SMTP password
- any admin password
- `ADMIN_TOKEN`

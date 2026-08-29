# Jacinto Construction

Portfolio website and admin console for Jacinto Construction, Chicago area.

Public site in English and Spanish, a photo led project archive browsed by year, a contact page that emails the company, and an admin console where one person can add a project from a phone in a few minutes: name, year, location, project value, description, photos, publish.

Version 2. Changes since the first delivery are listed in `V2_CHANGELOG.md`.

## Who does what

| Role | Address | Where it is set |
| --- | --- | --- |
| Admin login (the only account allowed into `/admin`) | chaidezjason@gmail.com | `ADMIN_EMAILS` in the environment, plus the `admin_users` table in the database (`npm run admin:create`) |
| Contact form recipient (the company inbox) | luisjacinto1107@gmail.com | `CONTACT_TO_EMAIL` in the environment |

The two are separate on purpose. The admin is not presented as the owner anywhere on the site.

## What is in the box

- Next.js 16 (App Router, TypeScript), plain CSS, no UI framework
- Supabase for the database, photo storage and admin login, with a database level admin allow list
- Resend for contact form email delivery
- Netlify for hosting (one documented path, see `docs/DEPLOYMENT.md`)
- Demo mode: the whole site, admin included, runs from a local JSON file with no accounts at all
- Phone photos, including HEIC/HEIF from Android and iPhone, are converted and resized in the browser before upload

## Run it in five minutes

Requirements: Node.js 20.9 or newer (22 recommended) and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Six clearly marked sample projects are already there.

Open http://localhost:3000/admin to try the admin console. In demo mode there is no login and every change is written to `.local-data/db.json` on your machine. Delete that folder (or run `npm run demo:reset`) to start over.

## Connect the real backend

1. Copy `.env.example` to `.env.local`.
2. Fill in the Supabase URL and keys. The moment both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are set, the site switches from demo mode to Supabase and the admin console requires a login.
3. Run `database/migrations/0001_init.sql` and then `database/migrations/0002_v2_corrections.sql` in the Supabase SQL editor.
4. `npm run admin:create -- chaidezjason@gmail.com "a long password"` creates the admin user and registers it in `admin_users`. Nobody else can log in, even with a Supabase account.
5. In Supabase, Authentication, turn off "Allow new users to sign up".
6. `npm run db:seed` loads the sample projects into Supabase (optional). `npm run db:remove-demo` removes them again. The admin console also has a one click button for that.

Full instructions from a blank machine to a live domain: `docs/DEPLOYMENT.md`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript |
| `npm test` | Unit tests (Vitest). Set `TEST_DATABASE_URL` to also run the row level security test against a local Postgres |
| `npm run test:e2e` | Browser tests (Playwright, runs against demo mode) |
| `npm run db:seed` | Insert the sample projects into Supabase |
| `npm run db:remove-demo` | Delete every sample project from Supabase |
| `npm run admin:create` | Create the admin user in Supabase Auth and register it as an admin |
| `npm run demo:reset` | Wipe local demo data |

Browser tests need Chromium once: `npx playwright install chromium`.

The database test needs an empty local Postgres database, for example `TEST_DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/jacinto_test npm test`. It applies both migrations and checks that visitors, signed in strangers and the registered admin get exactly the access they should.

## Where things live

```
src/app/[locale]/        public pages (/ is English, /es is Spanish)
src/app/admin/           admin console
src/app/api/             upload, health check, local media in demo mode
src/components/site/     public components
src/components/admin/    admin components
src/lib/data/            data layer: types, local demo provider, Supabase provider
src/lib/images/          browser side HEIC conversion and resizing
src/lib/i18n/            English and Spanish dictionaries
src/styles/              design tokens and global styles
database/migrations/     Postgres schema, admin allow list, policies, storage bucket
database/seed/           sample projects and default settings
public/brand/            logo files
public/placeholders/     neutral sample images
scripts/                 seed, demo removal, admin user
tests/                   unit, database and browser tests
docs/                    architecture, admin guide, deployment, design system, content guide
```

## Before launch

- Remove the six sample projects (admin console, Projects page, "Remove all sample projects").
- Settings page: confirm the phone, email, location, service area, and the "What we do" list. Only keep what is true. The default copy describes interior work, exterior work, renovations and improvements, project coordination and subcontractor management, and nothing more specific.
- Home page headline and intro, About text, contact text: all editable under Settings.
- `NEXT_PUBLIC_SITE_URL` must be the live domain so links, the sitemap and social previews are correct.
- Resend: until a domain is verified, the contact form can only email the address that owns the Resend account.
- Supabase Auth: "Allow new users to sign up" must be off. Only `admin_users` can use the admin console either way.

## Documentation

- `V2_CHANGELOG.md` every correction in this version, file by file
- `docs/ARCHITECTURE.md` how it is built and why
- `docs/ADMIN_GUIDE.md` for the person adding projects
- `docs/DEPLOYMENT.md` zero to live
- `docs/DESIGN_SYSTEM.md` the visual system as implemented
- `docs/CONTENT_GUIDE.md` how to write titles, descriptions and photo details

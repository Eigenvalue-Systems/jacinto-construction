# V2 changelog

Correction pass on the v1 repository. The visual direction, the page structure, the data providers and the image pipeline are the same code as v1 unless a section below says otherwise. Section numbers follow the correction handoff.

Status words used below: **Done** means implemented and covered by an automated test where one is possible. **Done, not fully tested** and **Partial** say exactly what is missing.

Test commands that were run on the final tree: `npm run lint`, `npm run typecheck`, `npm test` (with and without `TEST_DATABASE_URL`), `npm run build`, `npm run test:e2e` (Chromium desktop 1440 px and Pixel 7 emulation). Results are in the last section.

## 1. Admin account and contact recipient

Files: `.env.example`, `src/lib/email.ts`, `src/lib/supabase/env.ts` (unchanged, already read `ADMIN_EMAILS`), `scripts/create-admin.ts`, `README.md`, `docs/DEPLOYMENT.md`, `tests/unit/util.test.ts`.

How: `.env.example` ships `ADMIN_EMAILS=chaidezjason@gmail.com` and `CONTACT_TO_EMAIL=luisjacinto1107@gmail.com` with a note that they are separate. No email is written into application code; the login check reads `ADMIN_EMAILS`, the contact email reads `CONTACT_TO_EMAIL`. `buildContactEmail(input, env)` was split out of the send function so the recipient can be asserted without a network. `npm run admin:create -- chaidezjason@gmail.com "password"` creates the Auth user and registers it in `admin_users` (section 15). The addresses appear in the docs only as configuration values and as the sample seed email for the public contact page.

Tests: `tests/unit/util.test.ts` "addresses messages to the configured recipient, not the admin" (payload `to` equals the configured recipient), "only allows the configured admin when ADMIN_EMAILS is set" (the contact address is rejected as an admin).

Status: Done.

## 2. Bilingual site with an obvious switch

Files: `src/components/site/SiteHeader.tsx`, `src/components/site/SiteHeader.module.css`, `src/lib/i18n/en.ts`, `src/lib/i18n/es.ts`, `tests/e2e/01-public.spec.ts`.

How: the header link now reads the full word of the other language, `Español` on the English site and `English` on the Spanish site, 15 px at 560 weight with a permanent brick underline, 44 px tall, on every page at every width. It carries a `lang` attribute and a title in the target language ("Ver en Español" / "View in English"). Below 380 px the wordmark hides, not the switch. The phone menu and the footer show `English / Español` with the current one marked. The first visit prompt is unchanged. Spanish routes, dictionaries and fallback (`pick()`) are unchanged; every project and settings text field keeps its optional Spanish twin.

Tests: e2e "the header switch says English or Español in full and switches both ways" (header text both directions, the `html lang` attribute after each switch, footer links), "first visit asks for a language and Español switches to /es", "a Spanish preference redirects the root URL to /es", "admin can be used in Spanish". Unit "falls back to English when a Spanish field is empty".

Status: Done.

## 3. Browse by year, no categories

Files: `src/app/[locale]/projects/page.tsx`, `src/components/site/ProjectIndex.tsx`, `src/components/site/ProjectIndex.module.css`, `src/app/[locale]/projects/projects.module.css`, `src/lib/data/types.ts`, `src/lib/data/local.ts`, `src/lib/data/supabase.ts`, `src/lib/view.ts`, `src/lib/i18n/en.ts`, `src/lib/i18n/es.ts`, `database/migrations/0002_v2_corrections.sql`.

How: the Projects page renders `All` plus the years that have at least one published project, newest first, from `?year=` in the URL (shareable, works without JavaScript, 44 px tap targets). `ProjectFilter` is `{ year?: number }`. Sorting everywhere is year descending, then `display_order` inside the year, then newest created (`sortProjects` in `local.ts`, three `order()` calls in `supabase.ts`). Index rows show number, name, location, year. `project_type` stays in the database for compatibility but is nullable with no default, is never read by the site or the admin, is not in the editor, and null renders fine. Type labels and type filters were removed from both dictionaries.

Tests: e2e "projects index offers All plus the years that have projects, newest first" (asserts the exact filter list `All, 2025, 2024, 2023, 2022, 2021`, that no `Residential` text exists, and that `?year=` filters). Unit "sorts newest year first, then manual order, then newest created". Lifecycle e2e checks `?year=2024` contains the new project and `?year=2021` does not.

Status: Done.

## 4. Project value

Files: `database/migrations/0002_v2_corrections.sql`, `src/lib/data/types.ts`, `src/lib/data/util.ts`, `src/lib/data/local.ts`, `src/lib/data/supabase.ts`, `src/lib/data/seed.ts`, `database/seed/demo-projects.json`, `scripts/seed-demo.ts`, `src/app/admin/actions.ts`, `src/components/admin/ProjectEditor.tsx`, `src/app/admin/projects/page.tsx`, `src/components/site/project/ProjectView.tsx`, `src/lib/view.ts`, `src/lib/i18n/en.ts`, `src/lib/i18n/es.ts`, `tests/unit/util.test.ts`, `tests/e2e/01-public.spec.ts`, `tests/e2e/02-admin.spec.ts`.

How: column `project_value numeric(14,2)` with a `>= 0` check, `projectValue: number | null` on the type, mapped in both providers. The editor field is labelled "Project value (Optional)" with numeric input mode; `parseMoney()` accepts `185000`, `185,000` and `$185000`, rejects text with "Enter the project value as a plain number". Public pages call `formatMoney()` (`Intl.NumberFormat('en-US', currency USD, maximumFractionDigits 0`) and render the metadata row only when a value exists; nothing is shown for blank, no N/A. Spanish pages show the same USD figure under "Valor del proyecto". The admin Projects list shows the value next to each project.

Tests: unit "parses plain numbers, commas and dollar signs", "formats as whole US dollars and stays blank when empty". e2e "project value shows as whole dollars only when it exists" (`$185,000` on one sample, no value row on another). Lifecycle e2e: `185,000` typed, saved as `185000`, shown as `$185,000` in English and Spanish, invalid text rejected, cleared value removes the row.

Status: Done.

## 5. Minimal main form

Files: `src/components/admin/ProjectEditor.tsx`, `src/app/admin/projects/[id]/page.tsx`, `src/app/admin/actions.ts`, `src/styles/admin.css`, `src/lib/i18n/en.ts`, `src/lib/i18n/es.ts`.

How: the editor is one card with Project name, Year, Project value, Location, Description, then the Photos card, then the sticky bar with Save and Publish. Everything else sits in two collapsed sections, Optional details and Spanish translation (sections 6 and 7). Nothing outside the main card is needed to publish.

Tests: lifecycle e2e asserts the five fields are visible, the slug and Spanish fields are hidden until opened, and no project type control exists.

Status: Done.

## 6. Field friction

Files: `src/components/admin/ProjectEditor.tsx`, `src/app/admin/actions.ts`, `src/lib/data/util.ts`, `src/lib/data/types.ts`, `src/lib/data/supabase.ts`, `src/lib/data/local.ts`, `src/lib/i18n/en.ts`, `src/lib/i18n/es.ts`.

How, field by field:

- Project name: required, the only field needed to create the draft.
- Slug: generated from the name; stops following the name once the project is published so links keep working. The field exists only inside Optional details, prefilled, never required.
- Year: a select, current year plus one down to 1980, required, validated 1900 to 2100.
- Location: one text field, required to publish, not required to save a draft. No city, neighborhood or address fields; the `neighborhood` column is no longer read or written.
- Description: one field. `short_description` is generated on every save by `makeExcerpt()` (first paragraph, whole sentences up to about 160 characters, word cut with an ellipsis otherwise) and is not shown in the admin. The first paragraph doubles as the serif statement on the project page.
- Project value: optional (section 4).
- Completion date: removed from the admin, the types, the providers and the public page. The `completion_date` column stays in the database unused; nothing depends on it.
- Featured: a switch inside Optional details, default off. When no project is featured the home page shows the newest projects, so publishing never needs that decision.

Tests: unit "makes a short preview from the first sentences of a description". e2e "publishing needs a location and a description, saving a draft does not", "optional details hold the web address, scope and featured switch", lifecycle e2e (rename after publish keeps the URL, description paragraphs render, excerpt appears on the home page).

Status: Done. Note: the unused `neighborhood` and `completion_date` columns were left in place rather than dropped, so an existing v1 database migrates without data loss.

## 7. Spanish project content as an optional section

Files: `src/components/admin/ProjectEditor.tsx`, `src/app/admin/actions.ts`, `src/lib/data/types.ts`, `src/lib/data/supabase.ts`, `src/lib/data/local.ts`, `database/migrations/0002_v2_corrections.sql`, `src/lib/view.ts`, `src/lib/i18n/en.ts`, `src/lib/i18n/es.ts`.

How: a collapsed "Spanish translation" section with Nombre del proyecto, Descripción, Ubicación and the Spanish scope list. All optional, none needed to publish. New column `location_es`. Empty Spanish fields fall back to English on the Spanish site; the Spanish excerpt is generated from the Spanish description when one exists.

Tests: lifecycle e2e opens `/es/projects/...` for a project with no Spanish text and sees the English name and description with Spanish labels. Unit "falls back to English when a Spanish field is empty".

Status: Done.

## 8. Photo workflow

Files: `src/components/admin/PhotoManager.tsx`, `src/app/api/admin/upload/route.ts`, `src/lib/i18n/en.ts`, `src/lib/i18n/es.ts`, `src/styles/admin.css`.

How: one "Select photos" button, `multiple`, accepting `image/*,.heic,.heif`. Files are prepared and uploaded one after another with a counter ("Uploading 3 of 12 photos", "Converting a phone photo" while a HEIC is decoded). Thumbnails appear as each finishes. The first photo of a project becomes the cover on the server; Set as cover, arrows and drag change cover and order; Publish is in the sticky bar below.

Tests: lifecycle e2e uploads five files in one selection (JPEG landscape and portrait, two more JPEGs, one HEIC), waits for "All photos uploaded.", checks the first is the cover, moves a photo earlier, sets another as cover, publishes, and checks the cover and four gallery links on the public page. "photos and messages pages render" covers the media page.

Status: Done, not fully tested at the top of the range: the automated run uses 5 photos, inside the expected 4 to 15 but not 15. Uploads are sequential so the count only changes the wait.

## 9. Simplified photo items

Files: `src/components/admin/PhotoManager.tsx`, `src/app/api/admin/upload/route.ts`, `src/lib/data/local.ts`, `src/lib/data/supabase.ts`, `src/styles/admin.css`, `src/lib/i18n/en.ts`, `src/lib/i18n/es.ts`.

How: each item shows thumbnail, number, Cover tag, Move earlier / Move later, Set as cover, Remove. Alt text, caption and the gallery / before / after choice are inside an "Optional photo details" disclosure per item. On upload the alt text is set to `{Project name}, project photo {N}` (N is the position in the project), so nothing has to be typed.

Tests: lifecycle e2e asserts the alt field is hidden by default, that photo 5 received `Porch Rebuild Test, project photo 5`, and that reordering keeps each photo's own text.

Status: Done.

## 10. Android HEIC and HEIF intake

Files: `src/lib/images/client.ts`, `src/components/admin/PhotoManager.tsx`, `package.json`, `package-lock.json`, `tests/e2e/fixtures/photo-heic.heic`, `docs/ARCHITECTURE.md`, `docs/ADMIN_GUIDE.md`.

How: `heic-to` 1.5 (libheif compiled to WebAssembly, LGPL 3.0) converts HEIC and HEIF to a JPEG in the browser before the existing resize step. Detection uses the mime type, the extension and the `ftyp` brand in the first 12 bytes, so a file the phone labels `image/octet-stream` is still caught. The library is loaded with a dynamic `import('heic-to/csp')` only when such a file is selected; the decoder is a separate chunk of about 3 MB that never loads for JPEG uploads or for public pages (checked in the build output and the admin page's script list). If a browser fails to decode a file that did not look like HEIC, the same conversion is tried once before the photo is reported as unreadable. Unreadable files are skipped with a message and the rest of the batch continues.

Tests: lifecycle e2e includes a real HEVC encoded `.heic` fixture in the batch and checks it is uploaded, counted, given alt text, and served as JPEG on the public page. Chromium cannot decode HEIC natively, so the test only passes through the conversion path.

Status: Done, not fully tested across devices: automated coverage is Chromium on Linux. Not run on a physical Android phone, iPhone Safari or Firefox. The library is plain WebAssembly with no browser specific code, and `<input accept>` on Android lets the picker return HEIC files, but that end to end check on a real phone remains to be done after deployment.

## 11. Image optimization kept

Files: `src/lib/images/client.ts` (conversion added in front, the rest unchanged), `src/components/site/Picture.tsx` (unchanged).

How: multi file upload, three output sizes (2400, 1200, 480 px, quality 0.86, 0.84, 0.82), EXIF orientation through `createImageBitmap(..., { imageOrientation: 'from-image' })`, metadata stripped by the canvas re-encode, `<img srcset sizes>` with explicit width and height, lazy loading below the fold, cover selection and ordering are the v1 code.

Tests: lifecycle e2e checks `medium.jpg` as the cover source, `thumb.jpg 480w` in the `srcset`, a non zero natural width, and `-full.jpg` links in the gallery.

Status: Done.

## 12. Business copy corrected

Files: `database/seed/default-settings.json`, `database/migrations/0001_init.sql` (settings insert), `database/migrations/0002_v2_corrections.sql` (settings update), `database/seed/demo-projects.json`, `src/lib/i18n/en.ts`, `src/lib/i18n/es.ts`, `docs/CONTENT_GUIDE.md`.

How: the default headline, intro, About text, services list, contact text and meta description now describe interior work, exterior work, renovation and improvements, project coordination and subcontractor management, in English and Spanish. Roofing is gone from the service language; where a sample project mentions roofing it is described as subcontracted work on the same schedule. The About text no longer states training, years in business, crew size, licenses, guarantees or "we do everything ourselves". The `0002` migration rewrites the settings row on an existing v1 database only if the About text still starts with the v1 sentence, so text the owner already edited is not overwritten.

Tests: e2e "home page renders the company, headline, phone link and featured work". No automated test asserts the wording; it was read through.

Status: Done.

## 13. Copy direction

Files: as in section 12.

How: intro "Jacinto Construction handles interior and exterior construction work in the Chicago area, coordinating each project from the work on site through the subcontractors needed to complete it." Services list: Interior work, Exterior work, Renovation and improvements, Project coordination, Subcontractor management. These are settings text, editable in the admin, and are not a filter taxonomy. No hype lines.

Status: Done.

## 14. Admin is not the owner

Files: `database/seed/default-settings.json`, `database/migrations/0001_init.sql`, `database/migrations/0002_v2_corrections.sql`, `README.md`, `docs/*.md`.

How: `owner_name` defaults to empty and is not rendered anywhere on the public site; the About copy is company focused and names nobody. Docs describe `chaidezjason@gmail.com` as the admin login and `luisjacinto1107@gmail.com` as the company inbox, never as one person. The Settings page keeps an optional Owner name field for the future, editable, unused by the templates.

Status: Done.

## 15. Admin authorization at the database

Files: `database/migrations/0002_v2_corrections.sql`, `scripts/create-admin.ts`, `src/lib/data/types.ts`, `src/lib/data/local.ts`, `src/lib/data/supabase.ts`, `src/lib/admin/auth.ts`, `src/app/admin/actions.ts` (sign in), `src/proxy.ts` (unchanged allow list redirect), `tests/db/stub-supabase.sql`, `tests/db/rls.sql`, `tests/unit/rls.test.ts`.

How: table `admin_users (user_id uuid primary key references auth.users, email text unique, created_at)`, RLS on. Function `public.is_admin()` (SQL, stable, security definer, `search_path = public`) returns whether `auth.uid()` is listed. Every admin policy on `projects`, `project_images`, `site_settings`, `contact_messages` (select and delete) and `storage.objects` (insert, update, delete on the bucket) was replaced with `using (public.is_admin()) with check (public.is_admin())`. No policy uses `auth.role() = 'authenticated'` as authorization any more. Public policies are unchanged: published projects and their photos, settings, insert on contact messages. In the app, `checkAdminSession()` requires a session, `isEmailAllowed()` and `repo.isAdmin()` (an RPC to the function); an authenticated stranger is signed out and sent to the login page with a message, and the sign in action does the same check before the session is kept. `npm run admin:create` creates or updates the Auth user and upserts the `admin_users` row; the deployment guide also gives the SQL to do it by hand.

Tests: `tests/unit/rls.test.ts` runs when `TEST_DATABASE_URL` points at an empty local Postgres: it installs a stub of Supabase's `auth` and `storage` schemas, applies `0001` and `0002` (twice, to prove they are safe to re run), then runs `tests/db/rls.sql` which switches roles and JWT claims and asserts that anonymous reads only published rows and can insert a message, that an authenticated user not in `admin_users` reads no drafts, no messages, cannot insert, update or delete projects, images or settings and cannot write to the bucket, and that the registered admin can do all of it. It ends by printing "RLS checks passed". Unit "only allows the configured admin when ADMIN_EMAILS is set" covers the app allow list.

Status: Done, with one gap in test coverage: the RLS proof runs against local PostgreSQL 16 with a stub `auth.uid()` and a stub storage schema, not against a live Supabase project, and the application side sign out of an unauthorized authenticated user has no automated test because the browser suite runs in demo mode without Supabase Auth. Both were exercised by hand against the local database and by reading the code paths. The migration uses only standard Postgres and the Supabase policy shapes from their docs.

## 16. Supabase sign up configuration

Files: `docs/DEPLOYMENT.md` (step 8 and the checklist), `README.md`.

How: the deployment guide instructs, before go live, to turn off "Allow new users to sign up" in Supabase Auth, explains that the database refuses anyone not in `admin_users` even with an account, and the launch checklist repeats it. README says the same under "Before launch".

Status: Done (documentation; the switch itself lives in the Supabase dashboard).

## 17. Netlify

Files: `netlify.toml`, `docs/DEPLOYMENT.md`, `docs/ARCHITECTURE.md`.

How: `netlify.toml` is now only

```toml
[build]
  command = "npm run build"

[build.environment]
  NODE_VERSION = "22"
```

The `[[plugins]]` block referencing `@netlify/plugin-nextjs` is gone and the package is not installed or mentioned anywhere. Netlify detects Next.js from `package.json` and applies its current Next.js runtime on its own. The deployment guide describes exactly that.

Tests: `npm run build` on the final tree. No live Netlify deploy was made from this environment.

Status: Done, not verified on a live Netlify build.

## 18. Contact form

Files: `src/lib/email.ts`, `tests/unit/util.test.ts`, `docs/DEPLOYMENT.md`.

How: the form is unchanged from v1 and already minimal: Name, Phone or email, Message, honeypot, timing check. Messages are always stored in `contact_messages` and emailed through Resend when `RESEND_API_KEY` and `CONTACT_TO_EMAIL` are set; failure to email never loses the message. The deployment guide has the Resend section with the free plan limits and domain verification steps (until a domain is verified Resend only delivers to the account owner's address).

Tests: e2e "contact form validates and stores a message". Unit tests on the email payload (recipient, reply to, escaping, not configured cases).

Status: Done.

## 19. Demo content

Files: `database/seed/demo-projects.json`, `src/lib/data/seed.ts`, `scripts/seed-demo.ts`.

How: the six sample projects are kept, each named and described as a sample, tagged "Sample" on the site and in the admin, `is_demo = true`. Four of them carry a `project_value` (48000, 185000, 62500, 27500) and two are blank, so both paths are exercised. Sample descriptions were reworded to match the corrected positioning (no crew size claims, roofing as subcontracted work). "Remove all sample projects" in the admin and `npm run db:remove-demo` are unchanged and only touch `is_demo` rows.

Tests: e2e "sample projects can be removed in one action", "project value shows as whole dollars only when it exists".

Status: Done.

## 20. Public project page

Files: `src/components/site/project/ProjectView.tsx`, `src/components/site/project/ProjectView.module.css`, `src/lib/view.ts`, `src/lib/i18n/en.ts`, `src/lib/i18n/es.ts`.

How: crumb `Projects / {year}`, name, then a metadata list with Location, Year and Project value (row omitted when blank), the cover, the description (first paragraph as the statement, the rest below), the optional scope list, the gallery, before and after pairs, previous and next. Type and completion date are gone. No empty rows.

Tests: lifecycle e2e checks the metadata list, the two paragraphs, the value row present and later absent. "project page shows details, gallery and a keyboard operable lightbox".

Status: Done.

## 21. Public projects page

Files: `src/app/[locale]/projects/page.tsx`, `src/app/[locale]/projects/projects.module.css`, `src/components/site/ProjectIndex.tsx`, `src/components/site/ProjectIndex.module.css`.

How: heading, one filter row `All` plus existing years newest first, index newest first inside All and by manual order inside a year (section 3). No category filters.

Tests: as in section 3.

Status: Done.

## 22. Photo analysis deferred

Nothing built. No classification, no automatic titles, descriptions or cover selection. `docs/ARCHITECTURE.md` lists it under "Intentionally not built".

Status: Done (nothing to do).

## 23. Future project prep workflow

How: the admin takes exactly the values that workflow produces: a name, a description pasted into one field, year, location, value, a batch of photos, then cover and order by tapping. No field depends on anything generated inside the site.

Status: Done (no code beyond sections 5 to 9).

## 24. Deployment documentation

Files: `README.md`, `docs/DEPLOYMENT.md`, `docs/ADMIN_GUIDE.md`.

How: README opens with a table of the two addresses and where each is configured. The deployment guide names `chaidezjason@gmail.com` as the admin and `luisjacinto1107@gmail.com` as the contact recipient at the top and in the environment table, uses GitHub Desktop as the first path and HTTPS in the terminal path (no SSH keys anywhere), runs both migrations, registers the admin with `npm run admin:create` or the SQL fallback, turns sign ups off, and deploys through Netlify's GitHub import with the minimal config. The admin guide was rewritten around the simplified flow with a Spanish quick guide at the end.

Status: Done.

## 25. Testing

Files: `tests/unit/util.test.ts`, `tests/unit/rls.test.ts`, `tests/db/*.sql`, `tests/e2e/01-public.spec.ts`, `tests/e2e/02-admin.spec.ts`, `tests/e2e/fixtures/photo-3.jpg`, `photo-4.jpg`, `photo-5.jpg`, `photo-heic.heic`.

Coverage of the requested list:

- project value persistence: lifecycle e2e (typed with a comma, saved, reloaded as `185000`)
- project value public formatting: e2e public spec and lifecycle (`$185,000`), unit `formatMoney`
- blank project value: e2e public spec (sample without value shows no row), lifecycle (cleared value), unit
- year only project filtering: e2e public spec, lifecycle `?year=`, unit `sortProjects`
- simplified project creation: lifecycle e2e, "publishing needs a location and a description, saving a draft does not"
- Spanish fallback: lifecycle e2e on `/es/projects/...`, unit `pick`
- admin authorization: `tests/unit/rls.test.ts` with `tests/db/rls.sql`, unit `isEmailAllowed`
- unauthorized authenticated user: `tests/db/rls.sql` (database). The application sign out path is not automated, see section 15
- 4 to 15 image upload: lifecycle e2e with 5 files in one selection
- cover selection: lifecycle e2e
- reorder: lifecycle e2e (photos), "project order buttons change the public order within a year" (projects)
- HEIC/HEIF path: lifecycle e2e with `photo-heic.heic`, Chromium only
- English / Español language switch: e2e "the header switch says English or Español in full and switches both ways"
- admin lifecycle: lifecycle e2e (create, edit, publish, rename, unpublish, preview, duplicate, delete)
- sample removal: e2e "sample projects can be removed in one action"
- contact recipient configuration: unit "addresses messages to the configured recipient, not the admin"

Status: Done, with the two gaps named above (unauthorized user at the app level, HEIC on real devices) and the upload test at 5 photos rather than 15.

## 26. Admin acceptance flow

Log in, New project, name, year, location, value, description, select photos, reorder, change cover, Publish. Reproduced by the lifecycle e2e in demo mode and by hand in the browser. No slug, category, caption, SEO, second description, Spanish text or database concept is needed to publish.

Status: Done, tested in demo mode; the login step itself needs the live Supabase project (section 15).

## 27. Public acceptance flow

Open site, choose a language, Projects, All or a year, open a project, see location, year, value, description, photos, call or write. Covered by the public e2e spec on Chromium desktop and the Pixel 7 profile, including overflow checks at 320, 375, 390, 430, 768, 1024 and 1440 px.

Status: Done on emulated devices; not run on physical Android, iPhone or tablet hardware.

## 28. Visual direction preserved

No redesign. Same tokens, fonts, layout, motion and components. Visible differences from v1 are limited to: the language switch text and underline, the year filter row replacing the type and year rows, the project index columns (location instead of type), the project page metadata (Location, Year, Project value), and the admin editor and photo item layout. Nothing dark, no cards added, no gradients, no effects.

Status: Done.

## Other small changes

- `src/app/[locale]/layout.tsx`: `data-scroll-behavior="smooth"` on `<html>`, which Next.js 16 asks for when the stylesheet uses smooth scrolling. Removes a dev console notice, no visible change.
- `vitest.config.mts`: path alias resolved through `import.meta.url` instead of `__dirname`, which removes a Vite deprecation warning on every test run.
- `tests/unit/rls.test.ts`: applies each migration twice on purpose, so a second run of the SQL in the Supabase editor is known to be harmless.
- `database/seed/demo-projects.json`: sample copy reworded (section 12 and 19).

## 29. Deliverables

This file, the complete repository as a ZIP, and the updated `README.md`, `docs/ARCHITECTURE.md`, `docs/ADMIN_GUIDE.md`, `docs/DEPLOYMENT.md`, `docs/DESIGN_SYSTEM.md`, `docs/CONTENT_GUIDE.md`.

## Not fully completed, in one place

- HEIC/HEIF conversion is proven in Chromium with a real HEVC fixture, not on a physical Android phone, iPhone or in Firefox (section 10).
- The database authorization proof runs on local PostgreSQL with stub Supabase schemas, not on a live Supabase project, and the app level sign out of an authenticated stranger is not covered by an automated test (section 15).
- The upload test uses 5 photos, not 15 (section 8).
- Netlify was not deployed from this environment; the config and docs follow Netlify's current Next.js path (section 17).
- Unused v1 columns `neighborhood`, `completion_date` and the nullable `project_type` remain in the schema by choice, so existing data survives the migration (sections 3 and 6).

## Final verification results

Filled in from the last run on the delivered tree:

- `npm run lint`: clean
- `npm run typecheck`: clean
- `npm test`: 16 tests pass and the database test reports itself skipped without `TEST_DATABASE_URL`; 17 pass with it, against an empty local PostgreSQL 16 database
- `npm run build`: production build succeeds, public pages prerendered with 5 minute revalidation, no warnings
- `npm run test:e2e`: 51 passed, 11 skipped by design (the 8 admin specs on the phone profile, the 3 phone navigation specs on desktop). Desktop Chromium 1440 px: 20 public and 8 admin. Pixel 7 profile: 20 public and 3 phone navigation

- Added live Supabase hardening migrations 0003 and 0004 after deployment audit.

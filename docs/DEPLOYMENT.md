# Deployment

From a blank machine to a live domain. One path: GitHub for the code, Supabase for data and login, Resend for email, Netlify for hosting. Every command is copy and paste. Budget an afternoon the first time.

Every step that mentions a dashboard tells you the setting to look for by name; menus move around, names rarely do.

## 1. Accounts you need

| Service | Used for | Cost to start |
| --- | --- | --- |
| GitHub | holds the code, Netlify deploys from it | free |
| Supabase | database, photo storage, admin login | free |
| Resend | contact form email | free |
| Netlify | hosting | free |
| A domain registrar (Namecheap, Cloudflare, Google Domains successor Squarespace, etc.) | the domain name | about 10 to 20 USD a year |

Two addresses matter and they are different on purpose:

- Admin login for `/admin`: `chaidezjason@gmail.com`. Set in `ADMIN_EMAILS` and registered in the database by `npm run admin:create`.
- Contact form recipient: `luisjacinto1107@gmail.com`. Set in `CONTACT_TO_EMAIL`.

Sign up for GitHub, Supabase and Netlify with the admin's email. For Resend, sign up with the address that should receive contact messages (`luisjacinto1107@gmail.com`) or verify a domain later (step 13).

## 2. Software on your computer

- Node.js 22 LTS from https://nodejs.org (includes npm). Check: `node --version`
- Git from https://git-scm.com. Check: `git --version`
- A code editor (VS Code is fine).

## 3. Repository

Easiest path, no SSH keys: install GitHub Desktop (https://desktop.github.com), sign in, choose **File, Add local repository**, pick the unzipped `jacinto-construction` folder (GitHub Desktop offers to create the repository if it is not one yet), write a summary such as `Jacinto Construction site` and **Commit to main**, then **Publish repository** and keep it **private**.

Terminal path, using HTTPS (no SSH):

```bash
cd jacinto-construction
git init
git add .
git commit -m "Jacinto Construction site"
```

Create an empty private repository on GitHub named `jacinto-construction`, then:

```bash
git remote add origin https://github.com/YOUR_USER/jacinto-construction.git
git branch -M main
git push -u origin main
```

Git asks for your GitHub login the first time; use a personal access token as the password if prompted (GitHub, Settings, Developer settings, Personal access tokens).

## 4. Dependencies

```bash
npm install
```

Try demo mode before touching any service:

```bash
npm run dev
```

http://localhost:3000 is the site, http://localhost:3000/admin the console. Stop it with Ctrl C.

## 5. Environment variables

```bash
cp .env.example .env.local
```

You will fill `.env.local` in as you go. It is ignored by Git and must never be committed. The same values go into Netlify in step 12.

| Variable | Where it comes from |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | the live address, for example `https://jacintoconstruction.com` (use `http://localhost:3000` locally) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase, Project Settings, API Keys (step 6) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | same page, the key that starts with `sb_publishable_` |
| `SUPABASE_SECRET_KEY` | same page, the key that starts with `sb_secret_`. Scripts only. Never put it in Netlify unless you run the scripts there. |
| `ADMIN_EMAILS` | `chaidezjason@gmail.com`. The database keeps its own list too (step 10); both must agree. |
| `RESEND_API_KEY` | Resend, API Keys (step 9) |
| `CONTACT_TO_EMAIL` | the inbox that receives contact messages |
| `CONTACT_FROM_EMAIL` | `Jacinto Construction <onboarding@resend.dev>` until a domain is verified, then `Jacinto Construction <contact@yourdomain.com>` |

## 6. Create the database

1. https://supabase.com/dashboard, **New project**.
2. Name: `jacinto-construction`. Region: **East US (North Virginia)** or the closest to Chicago offered. Generate a database password and store it in a password manager; the scripts do not need it but the CLI does.
3. Wait until the project shows as active.
4. **Project Settings, API Keys**: copy the Project URL, the publishable key and the secret key into `.env.local`.

## 7. Schema migration

Two files, run in order. Simplest path, no extra tools:

1. Open **SQL Editor** in the Supabase dashboard.
2. Paste the whole content of `database/migrations/0001_init.sql`. **Run**. It creates the tables, the `project-images` storage bucket and the default site settings.
3. Paste the whole content of `database/migrations/0002_v2_corrections.sql`. **Run**. It adds the project value column, the `admin_users` table, the `is_admin()` function, and replaces every admin policy so that only registered admins can write.

Both files are safe to run twice.

Alternative with the Supabase CLI (optional):

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
mkdir -p supabase/migrations
cp database/migrations/0001_init.sql supabase/migrations/20250101000000_init.sql
cp database/migrations/0002_v2_corrections.sql supabase/migrations/20250102000000_v2_corrections.sql
supabase db push
```

## 8. Authentication settings

In the Supabase dashboard, **Authentication**:

1. Under sign in settings (the section for email sign in), turn **off** the setting named **Allow new users to sign up**. Do this before the site goes live. With it off, nobody can create an account on their own. The database adds a second lock on top: even a user who somehow has an account cannot read drafts, messages or write anything unless they are listed in `admin_users` (step 10). The intended state is one registered admin and no other accounts.
2. Keep **Confirm email** on or off as you like; the admin creation script creates confirmed users.
3. **URL Configuration**: set **Site URL** to the live address (`https://jacintoconstruction.com`). Add these **Redirect URLs**:
   - `https://jacintoconstruction.com/admin/auth/callback`
   - `http://localhost:3000/admin/auth/callback`
   Password reset links only work for addresses on this list.
4. Optional: **Email Templates**, edit the "Reset password" wording so it says Jacinto Construction.

## 9. Storage bucket

The migration created a public bucket named `project-images` with a size limit of 8 MB per file and image types only. Check under **Storage** that it exists and is marked public. Nothing else to do.

## 10. Create the admin account

With `.env.local` filled in (URL and secret key), run:

```bash
npm run admin:create -- chaidezjason@gmail.com "a long password with several words"
```

This creates the login in Supabase Auth (or updates the password if it exists) and registers the account in the `admin_users` table. Only accounts in that table pass the database checks. `ADMIN_EMAILS` in the environment must list the same address.

Manual alternative: Supabase dashboard, **Authentication, Users, Add user**, create the user with a password and confirm the email, then in the **SQL Editor** run:

```sql
insert into public.admin_users (user_id, email)
select id, email from auth.users where email = 'chaidezjason@gmail.com'
on conflict (user_id) do nothing;
```

To add a second admin later, repeat the same two steps for that address and add it to `ADMIN_EMAILS` (comma separated).

## 11. Local development against the real backend

```bash
npm run dev
```

The demo mode banner is gone, `/admin` asks for a login, and the site is empty until you seed or add projects. Uploads go to the Supabase bucket even from localhost.

## 12. Sample data (optional)

To see the site with content before real projects exist:

```bash
npm run db:seed
```

This inserts the six sample projects marked "Sample" with neutral placeholder images. Remove them later with the button on the admin Projects page or:

```bash
npm run db:remove-demo
```

## 13. Contact form email (Resend)

1. https://resend.com, create an account with the inbox that should receive messages.
2. **API Keys**, create a key with sending permission. Put it in `RESEND_API_KEY`.
3. `CONTACT_TO_EMAIL=luisjacinto1107@gmail.com` and `CONTACT_FROM_EMAIL=Jacinto Construction <onboarding@resend.dev>`.
4. Test: run the site, send a message from `/contact`. It should arrive within a minute and also appear under Admin, Messages.

Limits of the free plan: 100 emails a day, 3,000 a month. Before a domain is verified, Resend only delivers to the address that owns the Resend account. To send to any address and to send from `contact@yourdomain.com`:

1. Resend, **Domains, Add domain**, enter the domain.
2. Add the DNS records Resend shows (one MX, one SPF TXT, one DKIM TXT) at your registrar. Propagation takes minutes to a day.
3. When it shows verified, set `CONTACT_FROM_EMAIL=Jacinto Construction <contact@yourdomain.com>`.

Messages are always stored in the database, so nothing is lost if email is not set up yet.

## 14. Production deployment (Netlify)

1. https://app.netlify.com, **Add new project, Import an existing project**, pick GitHub, authorize Netlify for the repository, pick `jacinto-construction`.
2. Netlify detects Next.js on its own and installs its OpenNext based adapter during the build; nothing is pinned in the repository. `netlify.toml` only sets the build command (`npm run build`) and Node 22. Leave the publish directory at the default Netlify proposes.
3. Before the first deploy, open **Environment variables** for the project and add every variable from section 5 (except `SUPABASE_SECRET_KEY`, which is not needed on the server). `NEXT_PUBLIC_SITE_URL` should already be the final domain.
4. **Deploy**. The first build takes 2 to 4 minutes. The temporary address looks like `https://something.netlify.app`.
5. Open it. Check the home page, a project page, `/es`, `/admin` login, and a photo upload.

Every push to `main` triggers a new deploy. Pull requests get preview deploys that cost nothing.

## 15. Custom domain

1. Netlify, **Domain management, Add a domain**, enter `jacintoconstruction.com` (whatever was bought).
2. Netlify shows the DNS records to create.

## 16. DNS

At the registrar, create:

- `A` record for `@` pointing to Netlify's load balancer IP shown in the dashboard, or, if the registrar supports it, an `ALIAS`/`ANAME` for `@` to the Netlify site address.
- `CNAME` for `www` to `your-site.netlify.app`.

Or move the domain's nameservers to Netlify DNS (Netlify offers this during domain setup) and skip the records above. Propagation takes minutes to a day. Set the primary domain in Netlify to the version you want (`www` or bare); the other redirects.

Then update `NEXT_PUBLIC_SITE_URL` in Netlify to the final `https://` address and trigger a redeploy (Deploys, Trigger deploy). Also update the Supabase Site URL and Redirect URLs from step 8 if they changed.

## 17. HTTPS

Netlify issues a Let's Encrypt certificate automatically once DNS resolves. Check **Domain management, HTTPS**. If it does not appear within an hour, use **Verify DNS configuration** on that page.

## 18. First real project

1. Go to `https://yourdomain.com/admin`, log in as `chaidezjason@gmail.com`.
2. Follow `docs/ADMIN_GUIDE.md`: New project, year, location, project value if wanted, description, select all the photos at once, reorder, pick the cover, Publish.
3. Under **Settings**, review every text: phone, email, service area, headline, About, "What we do". Save.

## 19. Remove the sample data

Admin, Projects, **Remove all sample projects** (or `npm run db:remove-demo`). Confirm `/projects` shows only real work.

## 20. Backups

The free Supabase plan has no automatic backups. Once a month, or after adding many projects:

Database (needs the CLI from step 7 and the database password):

```bash
supabase db dump --linked -f backup-$(date +%Y-%m-%d).sql
```

Photos: Supabase dashboard, **Storage, project-images**, select all, download. Or with the CLI:

```bash
supabase storage cp -r ss:///project-images ./photos-backup --experimental
```

Keep the backups somewhere outside the computer that made them. The Pro plan (25 USD a month) adds daily backups if the site becomes important enough to pay for that.

## 21. Updates

- Content: admin console, no deploy needed.
- Code or dependencies: edit, `npm run lint && npm run typecheck && npm test && npm run build` locally, commit, push. Netlify deploys `main`.
- Dependency updates: `npm outdated`, then `npm update` for minor versions. Check `npm run build` passes before pushing.

## 22. Rollback

Netlify keeps every deploy. **Deploys**, open the last good one, **Publish deploy**. The site switches back instantly. Fix the code, push again when ready.

Database changes made through the admin are not part of a deploy; restore those from a backup (step 20) if ever needed.

## 23. Free tier limits and when charges start

| Service | Free includes | What happens at the limit |
| --- | --- | --- |
| Netlify Free | 300 credits a month: about 15 GB bandwidth, 15 credits per production deploy, compute and requests metered lightly. Deploy previews are free. | Hard limit: the site pauses until the next month. Upgrade to Personal (9 USD) or Pro (20 USD) before that if traffic grows. A small local business site normally uses a fraction of the credits. Keep deploys to code changes; content changes do not deploy. |
| Supabase Free | 500 MB database, 1 GB storage, 5 GB egress, 2 projects, 50,000 monthly active users | Storage fills first: 1 GB is roughly 700 to 900 uploaded photos with three sizes each. Pro is 25 USD a month for 100 GB. |
| Supabase pausing | Free projects pause after 7 days without database activity | The site returns errors until you press Resume in the dashboard. Prevent it with the keep alive job below, or upgrade to Pro. |
| Resend Free | 100 emails a day, 3,000 a month | More than that means a busy contractor; Pro is 20 USD a month. |
| Domain | none | 10 to 20 USD a year at the registrar. |

### Keep the database awake

The repository includes `.github/workflows/keep-database-awake.yml`, which requests `/api/health` once a day. That request reads the database and counts as activity. To turn it on: GitHub repository, **Settings, Secrets and variables, Actions, Variables**, add `SITE_URL` with the live address. Actions must be enabled for the repository. `/api/health` is also a quick way to see that the site and the database are talking: it returns `{"ok":true,...}`.

## Checklist before telling people the address

- [ ] Sample projects removed
- [ ] Settings reviewed: phone, email, location, service area, headline, About, What we do
- [ ] At least four real published projects, some marked featured
- [ ] Sign ups disabled in Supabase Auth, and `admin_users` contains only the intended admin
- [ ] `NEXT_PUBLIC_SITE_URL` is the live domain, redeployed after the change
- [ ] Contact form tested end to end (message arrives at luisjacinto1107@gmail.com and under Messages)
- [ ] Phone link tested from a phone
- [ ] `/es` reviewed by a Spanish speaker
- [ ] Keep alive variable set, or Supabase Pro
- [ ] Backup taken once

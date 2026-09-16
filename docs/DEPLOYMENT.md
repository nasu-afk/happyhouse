# Deploying HappyHouse to Railway

Everything — frontend, backend, and MySQL — runs on Railway. This is both cheaper and simpler than a split Vercel+VPS setup for a site at this scale: no server to patch, HTTPS is automatic per service, and Railway's terms don't restrict commercial use the way Vercel's free tier does.

One architectural fact worth understanding up front: **Railway gives each service its own subdomain** (`*.up.railway.app`), so your frontend and backend are still on different domains from each other, even within the same Railway project. That means the cross-site cookie handling already built into this project (`COOKIE_SAMESITE`) is still necessary — this isn't a VPS-specific workaround, it applies here too.

---

## 1. Git (if you haven't already)

```
cd C:\projects\happyhouse
git init
git add .
git status
```
Confirm `.env`, `backend/.env`, and `frontend/.env.local` are **not** in the list before committing. Then:
```
git commit -m "Initial commit"
```
Create an empty repo on GitHub (no README/license), then:
```
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

---

## 2. Create the Railway project

1. Go to [railway.app](https://railway.app), sign up/log in.
2. **New Project** → **Deploy from GitHub repo** → select your repo.
3. Railway will try to auto-detect a service from the repo root — since this repo has `frontend/` and `backend/` as subfolders rather than a single app at the root, delete whatever it auto-creates and add services manually (next steps). This is normal for a monorepo, not an error.

---

## 3. Add the MySQL database

1. In your project, **+ New** → **Database** → **Add MySQL**.
2. Railway provisions it automatically — no schema yet, that's next.
3. Click into the MySQL service → **Connect** tab. Note the connection details (host, port, user, password, database name) — you'll reference these when configuring the backend service, and need them once to load the schema.

### Load the schema

From your own machine (needs the `mysql` CLI — same one used earlier in this project):
```
mysql -h <MYSQL_HOST> -P <MYSQL_PORT> -u <MYSQL_USER> -p<MYSQL_PASSWORD> <MYSQL_DATABASE> < database/schema.sql
mysql -h <MYSQL_HOST> -P <MYSQL_PORT> -u <MYSQL_USER> -p<MYSQL_PASSWORD> <MYSQL_DATABASE> < database/seed.sql
```
(All four connection values come from the Connect tab in step 3 above. No space between `-p` and the password.)

---

## 4. Add the backend service

1. **+ New** → **GitHub Repo** → same repo again.
2. Once created, go to its **Settings** tab:
   - **Root Directory**: `backend`
   - Railway will detect `backend/Dockerfile` automatically and build from it.
3. Go to the **Variables** tab and add:
   ```
   DB_HOST=${{MySQL.MYSQLHOST}}
   DB_PORT=${{MySQL.MYSQLPORT}}
   DB_USER=${{MySQL.MYSQLUSER}}
   DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}
   DB_NAME=${{MySQL.MYSQLDATABASE}}
   JWT_SECRET_KEY=<generate with: python -c "import secrets; print(secrets.token_hex(32))">
   ENV=production
   COOKIE_SAMESITE=none
   FRONTEND_ORIGIN=<placeholder for now — https://placeholder.up.railway.app>
   CLOUDINARY_CLOUD_NAME=<if you have one>
   CLOUDINARY_API_KEY=<if you have one>
   CLOUDINARY_API_SECRET=<if you have one>
   ```
   The `${{MySQL.MYSQLHOST}}` syntax is Railway's variable referencing — it pulls the value directly from the MySQL service rather than you copy-pasting it (and keeps working automatically if Railway ever rotates those values). Railway autocompletes these when you type `${{`.
4. Go to **Settings** → **Networking** → **Generate Domain**. This gives your backend a public HTTPS URL like `happyhouse-backend-production.up.railway.app` — note it, you need it in the next step.
5. Deploy (Railway does this automatically on save, or trigger manually from the Deployments tab).
6. Verify: visit `https://<your-backend-domain>/api/health` — should return `{"status": "ok"}`.

---

## 5. Add the frontend service

1. **+ New** → **GitHub Repo** → same repo again.
2. **Settings** → **Root Directory**: `frontend`. Railway detects `frontend/Dockerfile`.
3. **Variables** tab:
   ```
   NEXT_PUBLIC_API_URL=https://<your-backend-domain-from-step-4>
   NEXT_PUBLIC_SITE_URL=<placeholder for now>
   ```
4. **Settings** → **Networking** → **Generate Domain**. Note this URL too — this is your real frontend URL.
5. Go back to **Variables** and update `NEXT_PUBLIC_SITE_URL` to this actual domain, then redeploy (Deployments tab → ⋯ → Redeploy) so it's baked into the build — `NEXT_PUBLIC_*` values are inlined at build time, not read at runtime, so changing the variable alone doesn't update an already-built app.

---

## 6. Close the loop — fix the backend's CORS setting

Go back to the **backend** service → **Variables**, update:
```
FRONTEND_ORIGIN=https://<your-actual-frontend-domain-from-step-5>
```
Save — Railway redeploys the backend automatically on variable changes (no rebuild needed for env var changes, just a restart).

---

## 7. Create your admin account

Railway's web dashboard has a **Shell** feature on each service (or use the [Railway CLI](https://docs.railway.com/guides/cli): `railway run` after `railway link`ing to the backend service). Either way, run:
```
python -m scripts.create_admin
```
from within the backend service's environment.

---

## 8. Verify end-to-end

- Visit your frontend URL — homepage should load with real data.
- Go to `/admin/login`, log in. This is the step that proves the cross-domain cookie setup actually works.
- If login redirects straight back to the login page: open browser dev tools → Application → Cookies, check whether `happyhouse_session`/`happyhouse_csrf` were set at all. If not, double-check `FRONTEND_ORIGIN` on the backend exactly matches your frontend's URL (protocol included, no trailing slash) and that `COOKIE_SAMESITE=none` is actually set (Variables tab, not just in a local `.env` you forgot to also set on Railway).

---

## Redeploying after changes

Push to `main` on GitHub — both the frontend and backend Railway services redeploy automatically (each watches the same repo but only rebuilds when files under its own Root Directory change).

**Database schema changes**: `schema.sql`/`seed.sql` only run when you manually pipe them in (step 3) — there's no auto-run-on-boot mechanism on Railway's managed MySQL the way the old Docker Compose setup had. A schema change against a live database needs care — this project doesn't have a migration tool (e.g. Alembic) set up yet, worth adding before making structural changes to a live production database.

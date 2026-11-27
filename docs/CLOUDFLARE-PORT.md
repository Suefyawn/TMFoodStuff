# Moving TmFoodStuff to Cloudflare

TmFoodStuff runs on Vercel and Supabase today. It is moving to Cloudflare (Workers through vinext, D1 with Drizzle,
better-auth, R2 for images), the way YellowPink moved in September 2026. Owner's decision, 31 Oct 2026: a straight
port, no URL changes, with a rollback path at cutover. Vercel and Supabase stay untouched until a week of clean
running on Cloudflare.

## Phases

Each phase is its own row on the Tasks board and its own PR, in this order:

1. **Port 1: full copy of Supabase in R2** (this page's workflows). Nothing else starts before the copy exists and
   restores.
2. **Port 2:** D1 schema written from the dump's schema file, the Workers scaffold on staging and the Drizzle data
   layer.
3. **Port 3:** better-auth (existing customers keep their passwords: the bcrypt hashes are imported), R2 images and
   the cron jobs on Workers. Sentry is removed in this phase.
4. **Port 4:** staging check, SEO parity and the DNS cutover with a rollback.

## The copy (port 1)

`Ops` workflow (`.github/workflows/ops.yml`), action `export`, manual only:

- `tmf.dump`: `pg_dump` custom format of the `public`, `auth` and `storage` schemas.
- `tmf-schema.sql`: the same schemas, schema only, as plain SQL (port 2 reads it).
- `counts.json`: exact row counts per table in `public`, plus `auth.users` and `storage.objects`, and the number of
  storage objects.
- `files.tar.gz`: every file of the public storage buckets. A private bucket stops the export with its name: it
  would need the service role key, which is not a secret on this repo.

They land in the private R2 bucket `tmfoodstuff-backups` at `supabase/<UTC date>/`, and `supabase/latest.json` points
at the newest date. The bucket has no public access and no custom domain. The workflow reads Supabase only.

Secrets it uses: `SUPABASE_DB_URL`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. The public project URL is taken
from the `supabase_url` input, the repo variable `SUPABASE_URL`, or the project ref in `SUPABASE_DB_URL`, and is
masked in the log.

**This repo is public, so its Actions logs are public.** The workflows print file names they chose, sizes, table
names, counts and PASS or FAIL. Never rows, object names, the project URL or a connection string, and never
`upload-artifact`.

## Run it

```
gh workflow run ops.yml -f action=export
gh run watch
gh workflow run verify.yml -f branch=main -f checks=export
gh run watch
```

`Verify`, check `export`: downloads the newest copy, restores the dump into a throwaway Postgres 17 container (with
Supabase's roles and the `extensions` schema created first), recounts every table and compares with `counts.json`, and
checks `files.tar.gz` holds one file per storage object. PASS only when everything matches. Errors from `pg_restore`
are counted but not printed (their text can quote row values); the counts decide.

Scripts: `scripts/port/`.

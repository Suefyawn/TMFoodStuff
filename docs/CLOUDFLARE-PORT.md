# Moving TMFoodStuff to Cloudflare

TMFoodStuff (tmfoodstuff.ae) runs on Vercel and Supabase today. It is moving to Cloudflare (Workers through vinext, D1 with Drizzle,
better-auth, R2 for images), the way YellowPink moved in September 2026. Owner's decision (Tasks board, 31 Oct 2026): a straight
port, no URL changes, with a rollback path at cutover. Vercel and Supabase stay untouched until a week of clean
running on Cloudflare.

## Phases

Each phase is its own row on the Tasks board and its own PR, in this order:

1. **Port 1: full copy of Supabase in R2** (this page's workflows). Nothing else starts before the copy exists and
   restores.
2. **Port 2:** D1 schema written from the dump's schema file, the Workers scaffold on staging and the Drizzle data
   layer.
3. **Port 3:** better-auth (existing customers keep their passwords: the bcrypt hashes are imported), R2 images and
   the cron jobs on Workers. Sentry is removed in this phase (planner, Tasks board, 21 Nov 2026).
4. **Port 4:** staging check, SEO parity and the DNS cutover with a rollback.

## The copy (port 1)

`Ops` workflow (`.github/workflows/ops.yml`), action `export`, manual only:

- `tmf.dump`: `pg_dump` custom format of the `public`, `auth` and `storage` schemas.
- `tmf-schema.sql`: the same schemas, schema only, as plain SQL (port 2 reads it).
- `counts.json`: exact row counts for every table in those schemas, the number of storage objects, and the number
  and total bytes of the downloaded files.
- `files.tar.gz`: every file of the public storage buckets. A private bucket stops the export with its name: it
  would need the service role key, which is not a secret on this repo.

The dump, the schema file and the counts are all read from one database snapshot (a read-only repeatable-read
transaction exports it, `pg_dump --snapshot` and the counts import it), so orders placed during the export cannot make
the counts disagree with the dump. That needs `SUPABASE_DB_URL` to be a direct or session-mode connection (port
5432); the transaction pooler (6543) is refused.

Each run writes a new folder in the private R2 bucket `tmfoodstuff-backups`, `supabase/<UTC date>-<run id>/`, never
overwriting an earlier one. Wrangler uploads at most 300 MiB per file, so every file goes up as 250 MiB parts
(`<file>.part-000`, `-001`...); a small file is a single part. `supabase/latest.json` names the newest folder and
each file's parts and size, and is written only after every part is up. Before uploading, the workflow checks the
bucket has no r2.dev URL and no custom domain, and stops if it has either.

Secrets: `SUPABASE_DB_URL` (only in the dump step), `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (only in the
bucket check and upload steps). Wrangler is pinned. The public project URL for the storage downloads is worked out
from the project ref in `SUPABASE_DB_URL` and masked in the log.

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

`Verify`, check `export`: downloads the newest copy and joins its parts (checking each size), checks the schema file
is not empty, restores the dump into a throwaway Postgres 17 container (with Supabase's roles and the `extensions`
schema created first), recounts every table and compares with `counts.json`, then extracts `files.tar.gz` and checks
the file count and total bytes. PASS only when everything matches. `pg_restore` errors are listed by object type and
schema only, never their text (it can quote row values); the counts decide PASS.

Scripts: `scripts/port/`.

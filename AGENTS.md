# Agent notes for TMFoodStuff

Read README.md and LAUNCH.md first.

## Merging: one risky change per deploy (7 Nov 2026)

These rules bind every merge to `main`, whoever makes it: a scheduled job, a chat or local agent session, or a person
merging by hand. They were adopted after a framework upgrade was merged in one batch with other changes and slowed a
site for hours before anyone noticed.

1. **Framework and runtime upgrades merge alone.** A PR that raises the minor or major version of next, react or
   react-dom, vinext or @vinext/*, vite or @vitejs/*, @cloudflare/*, wrangler, drizzle-orm, better-auth, @supabase/* or
   @sentry/* is never merged together with other PRs. It merges only after the repo's full check passed on the PR's head
   commit: `verify.yml` where the repo has one (including its speed check once that exists), otherwise the repo's branch
   checks (`npm run ci:branch` or CI) plus a staging or preview deploy that was opened and clicked through.
2. **One HIGH risk merge per deploy, and 60 minutes between HIGH merges on the same project.** HIGH means the PR
   changes checkout, cart, payments, order writes, pricing, sign-in or sessions, customer data, the database schema,
   secrets, deploy or build config, or is an upgrade under rule 1.
3. **Watch the deploy.** 45 minutes after a deploy from `main`, time /admin, one product page and checkout (on a site
   without a shop: the home page and /admin) and compare them with the same pages the day before. If any is more than
   50% slower, revert at once with a revert PR of the merge commit, then investigate.
4. **Docs-only PRs** (only `*.md` files and `docs/`) skip rules 1 to 3. Whether they deploy depends on this repo (line
   below): where they do not deploy, merge them any time; where they do, each one still empties the page cache, so ride
   with the next code merge.

In this repo every push to main deploys on Vercel, docs-only ones included.

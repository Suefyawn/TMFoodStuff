-- Applied to the production project via the management API; checked in here
-- for the repo record. Backs the admin notifications settings + email
-- delivery-status feature.

-- Staff/admin notification recipients (per-type toggles). Replaces the single
-- ADMIN_EMAIL env var, which is still honoured as a fallback.
create table if not exists notification_recipients (
  id bigserial primary key,
  email text not null,
  name text,
  notify_new_order boolean not null default true,
  notify_low_stock boolean not null default true,
  notify_daily_digest boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists notification_recipients_email_uniq
  on notification_recipients (lower(email));

-- Resend webhook event log (delivered/opened/clicked/bounced/complained/
-- failed/delivery_delayed/sent/received/...). Powers the dashboard email
-- delivery-status view.
create table if not exists email_events (
  id bigserial primary key,
  resend_email_id text,
  event_type text not null,
  recipient text,
  subject text,
  occurred_at timestamptz,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index if not exists email_events_resend_id_idx on email_events (resend_email_id);
create index if not exists email_events_type_idx on email_events (event_type);
create index if not exists email_events_created_idx on email_events (created_at desc);
create index if not exists email_events_recipient_idx on email_events (lower(recipient));

-- Service-role only (matches the project's other internal tables).
alter table notification_recipients enable row level security;
alter table email_events enable row level security;

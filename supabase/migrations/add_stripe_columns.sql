-- Migration: Stripe payment references on orders
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
--
-- Card orders are created with payment_status 'pending'; the Stripe webhook
-- flips them to 'paid' and records the session / payment-intent ids here.

alter table orders
  add column if not exists stripe_session_id        text,
  add column if not exists stripe_payment_intent_id text;

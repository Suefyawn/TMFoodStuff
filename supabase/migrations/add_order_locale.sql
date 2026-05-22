-- Migration: store the customer's language on each order
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor → New query).
--
-- Lets the status-update emails (out for delivery / delivered), which are sent
-- later from the dashboard, be written in the language the customer used at
-- checkout. 'en' or 'ar'.

alter table orders
  add column if not exists locale text not null default 'en';

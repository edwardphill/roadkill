-- Roadkill database for Supabase. Paste into the Supabase SQL editor and run once.
-- The browser talks to these tables directly, so row-level security below is
-- the only thing enforcing who can write what.

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  observed_at timestamptz not null,
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180),
  accuracy_m integer check (accuracy_m >= 0),
  state_code text not null check (length(state_code) = 2),
  road_name text check (length(road_name) <= 200),
  species text not null,
  species_category text not null,
  sex text not null default 'unknown' check (sex in ('male', 'female', 'unknown')),
  age_class text not null default 'unknown' check (age_class in ('adult', 'juvenile', 'unknown')),
  condition text not null default 'unknown' check (condition in ('fresh', 'bloated', 'decomposed', 'unknown')),
  status text not null default 'reported' check (status in ('reported', 'claimed', 'salvaged', 'gone')),
  -- What the rules said at report time: allowed | permit | notify | prohibited | unclear
  eligibility text not null check (eligibility in ('allowed', 'permit', 'notify', 'prohibited', 'unclear')),
  regs_version text not null,
  reporter_id uuid default auth.uid() references auth.users on delete set null,
  reporter_handle text check (length(reporter_handle) <= 60),
  notes text check (length(notes) <= 1000)
);
create index reports_state_idx on public.reports (state_code);
create index reports_observed_idx on public.reports (observed_at);

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null unique references public.reports on delete cascade,
  claimant_id uuid default auth.uid() references auth.users on delete set null,
  claimant_handle text not null check (length(claimant_handle) between 1 and 60),
  claimed_at timestamptz not null default now(),
  salvaged_at timestamptz,
  permit_number text check (length(permit_number) <= 80),
  acknowledged_rules boolean not null,
  -- meat | hide | antlers | skull | research | other
  intended_use text check (intended_use in ('meat', 'hide', 'antlers', 'skull', 'research', 'other'))
);

alter table public.reports enable row level security;
alter table public.claims enable row level security;

-- Anyone can read reports; signed-in users can add their own. Status changes go
-- through the functions below, so there is no update policy.
create policy "reports are public" on public.reports for select using (true);
create policy "signed-in users log reports" on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'reported');

-- Claims are public except the permit number. Writes only via claim_report().
create policy "claims are public" on public.claims for select using (true);
revoke select on public.claims from anon, authenticated;
grant select (id, report_id, claimant_id, claimant_handle, claimed_at, salvaged_at, intended_use)
  on public.claims to anon, authenticated;

create view public.report_stats with (security_invoker = true) as
  select count(*)::int as reports,
         count(distinct state_code)::int as states,
         (count(*) filter (where status = 'salvaged'))::int as salvaged
  from public.reports;
grant select on public.report_stats to anon, authenticated;

create function public.claim_report(
  p_report_id uuid, p_claimant_handle text, p_permit_number text, p_intended_use text
) returns void language plpgsql security definer set search_path = '' as $$
declare r public.reports;
begin
  if auth.uid() is null then raise exception 'Sign in to claim a pickup.'; end if;
  select * into r from public.reports where id = p_report_id for update;
  if not found then raise exception 'Report not found'; end if;
  if r.status <> 'reported' then raise exception 'Someone already claimed this one.'; end if;
  if r.eligibility = 'prohibited' then raise exception 'This animal can''t legally be salvaged here.'; end if;
  if r.eligibility = 'permit' and coalesce(p_permit_number, '') = '' then
    raise exception 'This state requires a salvage permit. Enter your permit or authorization number.';
  end if;
  insert into public.claims (report_id, claimant_id, claimant_handle, permit_number, acknowledged_rules, intended_use)
    values (p_report_id, auth.uid(), p_claimant_handle, nullif(p_permit_number, ''), true, p_intended_use);
  update public.reports set status = 'claimed' where id = p_report_id;
end $$;

-- Anyone signed in can say an animal is gone; only the claimant can mark it picked up.
create function public.set_report_status(p_report_id uuid, p_status text)
returns void language plpgsql security definer set search_path = '' as $$
declare r public.reports;
begin
  if auth.uid() is null then raise exception 'Sign in to update a report.'; end if;
  select * into r from public.reports where id = p_report_id for update;
  if not found then raise exception 'Report not found'; end if;
  if r.status not in ('reported', 'claimed') then raise exception 'This report is already closed.'; end if;
  if p_status = 'salvaged' then
    if not exists (select 1 from public.claims where report_id = p_report_id and claimant_id = auth.uid()) then
      raise exception 'Only the person who claimed it can mark it picked up.';
    end if;
    update public.claims set salvaged_at = now() where report_id = p_report_id;
  elsif p_status <> 'gone' then
    raise exception 'Unknown status';
  end if;
  update public.reports set status = p_status where id = p_report_id;
end $$;

revoke execute on function public.claim_report, public.set_report_status from public, anon;
grant execute on function public.claim_report, public.set_report_status to authenticated;

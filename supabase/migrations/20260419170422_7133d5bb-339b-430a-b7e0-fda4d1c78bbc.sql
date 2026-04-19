-- GROUPS
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null check (length(name) between 1 and 60),
  challenge_title text check (challenge_title is null or length(challenge_title) between 1 and 80),
  challenge_days integer check (challenge_days is null or (challenge_days between 1 and 365)),
  start_date date not null default current_date,
  invite_slug text not null unique default lower(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.groups enable row level security;

create table public.group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null,
  joined_at timestamptz not null default now(),
  unique (user_id) -- enforce 1 group per user (owned or joined)
);

alter table public.group_members enable row level security;

create table public.group_check_ins (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null,
  date date not null default current_date,
  success boolean not null default true,
  note text check (note is null or length(note) <= 200),
  created_at timestamptz not null default now(),
  unique (group_id, user_id, date)
);

alter table public.group_check_ins enable row level security;

-- HELPER: is user member of group? (security definer to avoid recursive RLS)
create or replace function public.is_group_member(_group_id uuid, _user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.group_members
    where group_id = _group_id and user_id = _user_id
  )
$$;

-- HELPER: does user already belong to any group?
create or replace function public.user_in_any_group(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.group_members where user_id = _user_id)
$$;

-- RLS: groups
create policy "Members view their group"
on public.groups for select
to authenticated
using (public.is_group_member(id, auth.uid()) or owner_id = auth.uid());

create policy "Owner creates group"
on public.groups for insert
to authenticated
with check (owner_id = auth.uid() and not public.user_in_any_group(auth.uid()));

create policy "Owner updates group"
on public.groups for update
to authenticated
using (owner_id = auth.uid());

create policy "Owner deletes group"
on public.groups for delete
to authenticated
using (owner_id = auth.uid());

-- RLS: group_members
create policy "Members view group roster"
on public.group_members for select
to authenticated
using (public.is_group_member(group_id, auth.uid()));

create policy "User joins as self"
on public.group_members for insert
to authenticated
with check (user_id = auth.uid());

create policy "User leaves group"
on public.group_members for delete
to authenticated
using (user_id = auth.uid());

-- RLS: check-ins
create policy "Members view check-ins"
on public.group_check_ins for select
to authenticated
using (public.is_group_member(group_id, auth.uid()));

create policy "User logs own check-in"
on public.group_check_ins for insert
to authenticated
with check (user_id = auth.uid() and public.is_group_member(group_id, auth.uid()));

create policy "User updates own check-in"
on public.group_check_ins for update
to authenticated
using (user_id = auth.uid());

create policy "User deletes own check-in"
on public.group_check_ins for delete
to authenticated
using (user_id = auth.uid());

-- TRIGGER: on group create, auto-add owner as member
create or replace function public.add_owner_as_member()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.group_members (group_id, user_id) values (new.id, new.owner_id);
  return new;
end;
$$;

create trigger trg_add_owner_member
after insert on public.groups
for each row execute function public.add_owner_as_member();

-- TRIGGER: updated_at
create trigger trg_groups_updated
before update on public.groups
for each row execute function public.update_updated_at_column();

-- RPC: join by slug, enforce 1-group rule
create or replace function public.join_group_by_slug(_slug text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _group_id uuid;
begin
  if public.user_in_any_group(auth.uid()) then
    raise exception 'You are already in a group. Leave it before joining another.';
  end if;

  select id into _group_id from public.groups where invite_slug = _slug;
  if _group_id is null then
    raise exception 'Invalid invite link';
  end if;

  insert into public.group_members (group_id, user_id) values (_group_id, auth.uid())
  on conflict do nothing;

  return _group_id;
end;
$$;

-- Indexes
create index idx_group_members_group on public.group_members(group_id);
create index idx_check_ins_group_date on public.group_check_ins(group_id, date desc);
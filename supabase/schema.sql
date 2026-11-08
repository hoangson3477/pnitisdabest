-- Chạy toàn bộ file này trong Supabase SQL Editor (một lần duy nhất).
-- Ứng dụng chỉ truy cập database bằng service role key ở phía server.

create extension if not exists pgcrypto;

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 24),
  device_id uuid not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create index if not exists attempts_device_id_idx
  on public.attempts (device_id);
create index if not exists attempts_started_at_idx
  on public.attempts (started_at desc);

-- Mỗi thiết bị chỉ có tối đa một lượt đang chơi tại một thời điểm.
create unique index if not exists attempts_one_active_per_device
  on public.attempts (device_id)
  where finished_at is null;

create table if not exists public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts (id) on delete cascade,
  question_id text not null,
  variant text not null check (variant in ('true_false', 'choice', 'short')),
  answer jsonb not null,
  correct boolean not null default false,
  points integer not null default 0 check (points >= 0),
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id)
);

create index if not exists attempt_answers_attempt_id_idx
  on public.attempt_answers (attempt_id);

create or replace view public.attempt_scores
with (security_invoker = true) as
select
  a.id,
  a.name,
  a.device_id,
  a.started_at,
  a.finished_at,
  coalesce(sum(aa.points), 0)::integer as score
from public.attempts a
left join public.attempt_answers aa on aa.attempt_id = a.id
group by a.id;

create or replace view public.leaderboard
with (security_invoker = true) as
select
  s.id,
  s.name,
  s.score,
  s.started_at,
  s.finished_at,
  cast(row_number() over (
    order by s.score desc, s.finished_at asc, s.started_at asc, s.id asc
  ) as integer) as rank_no
from public.attempt_scores s
where s.finished_at is not null;

-- Nội dung quiz: bản nháp đang sửa và lịch sử các bản đã xuất bản.
create table if not exists public.content_drafts (
  id smallint primary key default 1 check (id = 1),
  data jsonb not null,
  revision integer not null default 1 check (revision >= 1),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_versions (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists content_versions_created_at_idx
  on public.content_versions (created_at desc);

-- Chặn xuất bản nội dung mới khi đã có lượt chơi, kể cả khi gọi thẳng API.
create or replace function public.guard_content_publish()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (select 1 from public.attempts) then
    raise exception 'Không thể xuất bản nội dung khi đã có lượt chơi.'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists content_versions_guard on public.content_versions;
create trigger content_versions_guard
  before insert on public.content_versions
  for each row execute function public.guard_content_publish();

-- Khóa truy cập trực tiếp từ client. Chỉ service role (server) được đọc/ghi.
alter table public.attempts enable row level security;
alter table public.attempt_answers enable row level security;
alter table public.content_drafts enable row level security;
alter table public.content_versions enable row level security;

revoke all on public.attempts from public, anon, authenticated;
revoke all on public.attempt_answers from public, anon, authenticated;
revoke all on public.attempt_scores from public, anon, authenticated;
revoke all on public.leaderboard from public, anon, authenticated;
revoke all on public.content_drafts from public, anon, authenticated;
revoke all on public.content_versions from public, anon, authenticated;
revoke all on function public.guard_content_publish() from public, anon, authenticated;

grant all on public.attempts to service_role;
grant all on public.attempt_answers to service_role;
grant select on public.attempt_scores to service_role;
grant select on public.leaderboard to service_role;
grant all on public.content_drafts to service_role;
grant all on public.content_versions to service_role;

-- Chạy file này một lần nếu database đã được cài bằng schema.sql phiên bản cũ.
-- Nội dung hiện tại trong src/content vẫn là nội dung mẫu cho đến khi admin
-- xuất bản lần đầu.

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

alter table public.content_drafts enable row level security;
alter table public.content_versions enable row level security;

revoke all on public.content_drafts from public, anon, authenticated;
revoke all on public.content_versions from public, anon, authenticated;
revoke all on function public.guard_content_publish()
  from public, anon, authenticated;

grant all on public.content_drafts to service_role;
grant all on public.content_versions to service_role;

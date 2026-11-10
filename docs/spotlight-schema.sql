+create table public.tfi_site_spotlight (
 slot text primary key check (slot = 'cashed_preview'),
 post_id text not null check (post_id ~ '^[1-9][0-9]{5,24}$'),
 post_url text not null check (post_url = 'https://x.com/thefavindex/status/' || post_id),
 enabled boolean not null default true,
 revision bigint not null default 1,
 updated_at timestamptz not null default now()
);
alter table public.tfi_site_spotlight enable row level security;
revoke all on public.tfi_site_spotlight from public, anon, authenticated;
grant select on public.tfi_site_spotlight to anon, authenticated;
grant insert(slot,post_id,post_url,enabled),update(post_id,post_url,enabled) on public.tfi_site_spotlight to authenticated;
create policy "Read published spotlight" on public.tfi_site_spotlight for select to anon,authenticated using (true);
create policy "Existing admins insert spotlight" on public.tfi_site_spotlight for insert to authenticated with check (exists(select 1 from public.tfi_admins a where a.user_id=(select auth.uid())));
create policy "Existing admins update spotlight" on public.tfi_site_spotlight for update to authenticated using (exists(select 1 from public.tfi_admins a where a.user_id=(select auth.uid()))) with check (exists(select 1 from public.tfi_admins a where a.user_id=(select auth.uid())));
create function public.tfi_spotlight_stamp() returns trigger language plpgsql security invoker set search_path='' as $$ begin new.updated_at=clock_timestamp(); new.revision=old.revision+1; return new; end $$;
revoke all on function public.tfi_spotlight_stamp() from public,anon,authenticated;
create trigger tfi_spotlight_stamp before update on public.tfi_site_spotlight for each row execute function public.tfi_spotlight_stamp();
notify pgrst,'reload schema';

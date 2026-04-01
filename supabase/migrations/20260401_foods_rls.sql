alter table public.foods enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'foods'
      and policyname = 'foods_select_visible'
  ) then
    create policy foods_select_visible
      on public.foods
      for select
      to authenticated
      using (visibility = 'public' or auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'foods'
      and policyname = 'foods_insert_allowed'
  ) then
    create policy foods_insert_allowed
      on public.foods
      for insert
      to authenticated
      with check (
        auth.uid() is not null
        and (
          user_id = auth.uid()
          or (user_id is null and source in ('openfoodfacts', 'mfds', 'usda'))
        )
      );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'foods'
      and policyname = 'foods_update_own'
  ) then
    create policy foods_update_own
      on public.foods
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'foods'
      and policyname = 'foods_delete_own'
  ) then
    create policy foods_delete_own
      on public.foods
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end
$$;

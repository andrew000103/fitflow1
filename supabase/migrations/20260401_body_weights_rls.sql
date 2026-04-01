alter table public.body_weights enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'body_weights'
      and policyname = 'body_weights_select_own'
  ) then
    create policy body_weights_select_own
      on public.body_weights
      for select
      to authenticated
      using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'body_weights'
      and policyname = 'body_weights_insert_own'
  ) then
    create policy body_weights_insert_own
      on public.body_weights
      for insert
      to authenticated
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'body_weights'
      and policyname = 'body_weights_update_own'
  ) then
    create policy body_weights_update_own
      on public.body_weights
      for update
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'body_weights'
      and policyname = 'body_weights_delete_own'
  ) then
    create policy body_weights_delete_own
      on public.body_weights
      for delete
      to authenticated
      using (auth.uid() = user_id);
  end if;
end
$$;

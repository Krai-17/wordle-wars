create table public.ww_rooms (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  created_at timestamptz not null default now()
);
create table public.ww_matches (
  id uuid primary key,
  room_id uuid not null references public.ww_rooms(id) on delete cascade,
  puzzle integer not null check (puzzle > 0),
  played_on date not null,
  result jsonb not null,
  unique (room_id, puzzle), unique (room_id, played_on)
);
alter table public.ww_rooms enable row level security;
alter table public.ww_matches enable row level security;
revoke all on public.ww_rooms, public.ww_matches from anon, authenticated;

create function public.ww_resolve_room(room_token text) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare resolved uuid;
begin
  if room_token is null or room_token !~ '^[a-f0-9]{64}$' then raise exception 'Invalid room token'; end if;
  select id into resolved from public.ww_rooms where token_hash = encode(sha256(convert_to(room_token, 'UTF8')), 'hex');
  if resolved is null then raise exception 'Room not found'; end if;
  return resolved;
end;
$$;
create function public.ww_create_room(room_token text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if room_token is null or room_token !~ '^[a-f0-9]{64}$' then raise exception 'Invalid room token'; end if;
  insert into public.ww_rooms(token_hash) values (encode(sha256(convert_to(room_token, 'UTF8')), 'hex'));
end;
$$;
create function public.ww_load_room(room_token text) returns jsonb
language plpgsql security definer set search_path = public, pg_temp as $$
declare resolved uuid;
begin
  resolved := public.ww_resolve_room(room_token);
  return coalesce((select jsonb_agg(result order by played_on desc) from public.ww_matches where room_id = resolved), '[]'::jsonb);
end;
$$;
create function public.ww_save_match(room_token text, result jsonb) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare resolved uuid; result_id uuid; result_date date; puzzle_number integer;
begin
  resolved := public.ww_resolve_room(room_token);
  if result is null or jsonb_typeof(result) <> 'object' or
    not (result ?& array['id','date','puzzle','kritika','raj','first']) or
    coalesce(result->>'kritika','') not in ('1','2','3','4','5','6','X') or
    coalesce(result->>'raj','') not in ('1','2','3','4','5','6','X') or
    coalesce(result->>'first','') not in ('Kritika','Raj','draw') or
    jsonb_typeof(result->'puzzle') <> 'number' or
    coalesce(result->>'puzzle','') !~ '^[1-9][0-9]*$' or
    coalesce(result->>'date','') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'Invalid result'; end if;
  if (jsonb_typeof(result->'kritika') <> 'number' and result->>'kritika' <> 'X') or
    (jsonb_typeof(result->'raj') <> 'number' and result->>'raj' <> 'X') then raise exception 'Scores must be numbers or X'; end if;
  result_id := (result->>'id')::uuid;
  result_date := (result->>'date')::date;
  puzzle_number := (result->>'puzzle')::integer;
  if result_date > current_date then raise exception 'Future date'; end if;
  insert into public.ww_matches as existing(id,room_id,puzzle,played_on,result)
    values (result_id,resolved,puzzle_number,result_date,
      jsonb_build_object('id',result_id::text,'date',result_date::text,'puzzle',puzzle_number,
        'kritika',result->'kritika','raj',result->'raj','first',result->>'first'))
    on conflict(id) do update set puzzle=excluded.puzzle, played_on=excluded.played_on, result=excluded.result
    where existing.room_id=resolved;
  if not found then raise exception 'Result belongs to another room'; end if;
end;
$$;
create function public.ww_delete_match(room_token text, match_id uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare resolved uuid;
begin
  resolved := public.ww_resolve_room(room_token);
  delete from public.ww_matches where id=match_id and room_id=resolved;
end;
$$;
revoke all on function public.ww_resolve_room(text) from public, anon, authenticated;
revoke all on function public.ww_create_room(text) from public;
revoke all on function public.ww_load_room(text) from public;
revoke all on function public.ww_save_match(text,jsonb) from public;
revoke all on function public.ww_delete_match(text,uuid) from public;
grant execute on function public.ww_create_room(text) to anon, authenticated;
grant execute on function public.ww_load_room(text) to anon, authenticated;
grant execute on function public.ww_save_match(text,jsonb) to anon, authenticated;
grant execute on function public.ww_delete_match(text,uuid) to anon, authenticated;
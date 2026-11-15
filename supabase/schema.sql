-- Fundo Organiza · esquema de base de datos para Supabase (PostgreSQL).
-- Se ejecuta una sola vez en el SQL Editor del proyecto. Es idempotente para las
-- funciones (create or replace); las tablas se crean solo si no existen.
--
-- Seguridad: el navegador usa la clave pública (anon). Por eso:
--   * las tablas tienen RLS y el público solo puede LEER actividades, anuncios,
--     ajustes y la vista participants_public (sin ID UPAO);
--   * toda escritura pasa por funciones SECURITY DEFINER que exigen una sesión
--     válida (token) y validan permisos y reglas de las bases.

create extension if not exists pgcrypto with schema extensions;

create table if not exists settings (key text primary key, value jsonb not null);
create table if not exists activities (id text primary key, data jsonb not null, updated_at timestamptz not null default now());
create table if not exists announcements (id text primary key, data jsonb not null, created_at timestamptz not null default now());

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  group_id text not null,
  team_id text not null,
  discipline_id text not null,
  name text not null,
  upao_id text not null,
  jersey int,
  gender text check (gender in ('F', 'M')),
  status text not null default 'pendiente' check (status in ('pendiente', 'confirmado')),
  created_by text,
  created_at timestamptz not null default now(),
  unique (upao_id, discipline_id),
  unique (discipline_id, team_id, jersey)
);

create table if not exists corrections (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants (id) on delete cascade,
  group_id text not null,
  message text not null,
  status text not null default 'pendiente' check (status in ('pendiente', 'resuelta', 'rechazada')),
  created_at timestamptz not null default now()
);

create table if not exists accounts (
  username text primary key,
  pass_hash text not null,
  role text not null check (role in ('admin', 'delegado')),
  group_id text
);

create table if not exists sessions (
  token uuid primary key default gen_random_uuid(),
  username text not null references accounts (username) on delete cascade,
  expires_at timestamptz not null default now() + interval '14 days'
);

alter table settings enable row level security;
alter table activities enable row level security;
alter table announcements enable row level security;
alter table participants enable row level security;
alter table corrections enable row level security;
alter table accounts enable row level security;
alter table sessions enable row level security;

drop policy if exists "lectura publica" on settings;
drop policy if exists "lectura publica" on activities;
drop policy if exists "lectura publica" on announcements;
create policy "lectura publica" on settings for select to anon, authenticated using (true);
create policy "lectura publica" on activities for select to anon, authenticated using (true);
create policy "lectura publica" on announcements for select to anon, authenticated using (true);
grant select on settings, activities, announcements to anon, authenticated;
-- participants, corrections, accounts y sessions no tienen políticas: nadie las lee directamente.

-- Lista pública de inscritos: sin ID UPAO.
create or replace view participants_public as
  select id, group_id, team_id, discipline_id, name, jersey, gender, status, created_at from participants;
grant select on participants_public to anon, authenticated;

-- Actualización en vivo de lo público.
do $$ begin
  alter publication supabase_realtime add table activities, announcements, settings;
exception when others then null; end $$;

---------------------------------------------------------------- utilidades

create or replace function _gname(g text) returns text language sql immutable as $$
  select case g when 'c1' then '1.er ciclo' when 'c2' then '2.° ciclo' when 'c3' then '3.er ciclo'
    when 'c4' then '4.° ciclo' when 'c5' then '5.° ciclo' when 'c6' then '6.° ciclo' when 'c7' then '7.° ciclo'
    when 'c8' then '8.° ciclo' when 'c9' then '9.° ciclo' when 'c10' then '10.° ciclo' when 'ce' then 'Egresados' else g end
$$;

create or replace function _session(p_token uuid) returns accounts
language plpgsql security definer set search_path = public as $$
declare a accounts;
begin
  select ac.* into a from sessions s join accounts ac on ac.username = s.username
   where s.token = p_token and s.expires_at > now();
  if not found then raise exception 'Tu sesión expiró. Vuelve a iniciar sesión.'; end if;
  return a;
end $$;

create or replace function _admin(p_token uuid) returns accounts
language plpgsql security definer set search_path = public as $$
declare a accounts := _session(p_token);
begin
  if a.role <> 'admin' then raise exception 'Solo la comisión organizadora puede hacer esto.'; end if;
  return a;
end $$;

-- Reglas de inscripción de las bases (capítulos III, V y XIII). Devuelve el error o null.
create or replace function _validate(p_group text, p_team text, p_disc text, p_name text, p_upao text,
  p_jersey int, p_gender text, p_ignore uuid) returns text
language plpgsql stable security definer set search_path = public as $$
declare
  d record; v_other text; v_sports int; v_n int;
begin
  select * into d from (values
    ('futbol', 'Fútbol', 10, true, false, true),
    ('voley', 'Vóley', 8, true, true, true),
    ('basquet', 'Básquet', 8, true, false, true),
    ('gincana', 'Gincana', 10, false, false, false),
    ('futbol_damas', 'Fútbol damas', null, true, false, false),
    ('basquet_damas', 'Básquet damas', null, true, false, false)
  ) t(id, name, mx, jer, gen, sport) where t.id = p_disc;
  if not found then return 'Disciplina no válida.'; end if;
  if p_group not in ('c1','c2','c3','c4','c5','c6','c7','c8','c9','c10','ce') then return 'Ciclo no válido.'; end if;
  if p_disc = 'futbol' and p_group = 'c1' then
    if p_team not in ('c1.1', 'c1.2') then return 'Elige el equipo 1.1 o 1.2.'; end if;
  elsif p_team <> p_group then return 'Equipo no válido.'; end if;

  if coalesce(array_length(regexp_split_to_array(trim(p_name), '\s+'), 1), 0) < 2 then
    return 'Escribe nombres y apellidos completos.'; end if;
  if p_upao !~ '^([0-9]{6}|[0-9]{9})$' then return 'El ID UPAO debe tener 6 o 9 dígitos.'; end if;

  select group_id into v_other from participants
   where upao_id = p_upao and group_id <> p_group and id is distinct from p_ignore limit 1;
  if found then return 'Ese ID ya está inscrito por ' || _gname(v_other) || '. Cada estudiante participa por un solo ciclo.'; end if;
  if exists (select 1 from participants where upao_id = p_upao and discipline_id = p_disc and id is distinct from p_ignore) then
    return 'Ese ID ya está inscrito en ' || d.name || '.'; end if;

  select count(*) into v_sports from participants
   where upao_id = p_upao and discipline_id in ('futbol', 'voley', 'basquet') and id is distinct from p_ignore;
  if d.sport then
    if v_sports >= 2 then return 'Máximo 2 deportes por jugador (fútbol, vóley o básquet).'; end if;
    if exists (select 1 from participants where upao_id = p_upao and discipline_id = 'gincana' and id is distinct from p_ignore) then
      return 'Quien está en la gincana no puede inscribirse en fútbol, vóley ni básquet.'; end if;
  end if;
  if p_disc = 'gincana' and v_sports > 0 then
    return 'Quien está inscrito en fútbol, vóley o básquet no puede inscribirse en la gincana.'; end if;

  if d.mx is not null then
    select count(*) into v_n from participants where discipline_id = p_disc and team_id = p_team and id is distinct from p_ignore;
    if v_n >= d.mx then return 'El equipo ya tiene el máximo de ' || d.mx || ' inscritos en ' || d.name || '.'; end if;
  end if;
  if d.jer then
    if p_jersey is null or p_jersey < 1 or p_jersey > 99 then return 'Indica un número de polo entre 1 y 99.'; end if;
    if exists (select 1 from participants where discipline_id = p_disc and team_id = p_team and jersey = p_jersey and id is distinct from p_ignore) then
      return 'El número ' || p_jersey || ' ya está asignado en este equipo de ' || d.name || '.'; end if;
  end if;
  if d.gen and coalesce(p_gender, '') not in ('F', 'M') then
    return 'Indica si es mujer o varón (el vóley exige mínimo 2 mujeres en cancha).'; end if;
  return null;
end $$;

---------------------------------------------------------------- sesión

create or replace function login(p_user text, p_pass text) returns json
language plpgsql security definer set search_path = public, extensions as $$
declare a accounts; t uuid;
begin
  select * into a from accounts where username = lower(trim(p_user));
  if not found or a.pass_hash <> crypt(p_pass, a.pass_hash) then
    perform pg_sleep(0.5);
    return null;
  end if;
  delete from sessions where expires_at < now();
  insert into sessions (username) values (a.username) returning token into t;
  return json_build_object('token', t, 'role', a.role, 'groupId', a.group_id);
end $$;

create or replace function logout(p_token uuid) returns void
language sql security definer set search_path = public as $$ delete from sessions where token = p_token $$;

create or replace function change_password(p_token uuid, p_old text, p_new text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare a accounts := _session(p_token);
begin
  if a.pass_hash <> crypt(p_old, a.pass_hash) then raise exception 'La contraseña actual no es correcta.'; end if;
  if length(p_new) < 8 then raise exception 'La nueva contraseña debe tener al menos 8 caracteres.'; end if;
  update accounts set pass_hash = crypt(p_new, gen_salt('bf')) where username = a.username;
end $$;

---------------------------------------------------------------- inscripciones

create or replace function my_participants(p_token uuid) returns setof participants
language plpgsql stable security definer set search_path = public as $$
declare a accounts := _session(p_token);
begin
  return query select * from participants where a.role = 'admin' or group_id = a.group_id order by created_at;
end $$;

create or replace function add_participant(p_token uuid, p jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare
  a accounts := _session(p_token);
  v_group text := p->>'groupId';
  v_err text; v_id uuid; v_deadline timestamptz;
begin
  if a.role = 'delegado' then
    if v_group is distinct from a.group_id then raise exception 'Solo puedes inscribir a participantes de tu ciclo.'; end if;
    select (value #>> '{}')::timestamptz into v_deadline from settings where key = 'deadline';
    if v_deadline is not null and now() >= v_deadline then raise exception 'El plazo de inscripción ya venció.'; end if;
  end if;
  v_err := _validate(v_group, p->>'teamId', p->>'disciplineId', p->>'name', trim(p->>'upaoId'),
    (p->>'jersey')::int, p->>'gender', null);
  if v_err is not null then raise exception '%', v_err; end if;
  insert into participants (group_id, team_id, discipline_id, name, upao_id, jersey, gender, created_by)
  values (v_group, p->>'teamId', p->>'disciplineId', regexp_replace(trim(p->>'name'), '\s+', ' ', 'g'),
    trim(p->>'upaoId'), (p->>'jersey')::int, nullif(p->>'gender', ''), a.username)
  returning id into v_id;
  return v_id;
end $$;

create or replace function request_correction(p_token uuid, p_participant uuid, p_message text) returns void
language plpgsql security definer set search_path = public as $$
declare a accounts := _session(p_token); v_group text;
begin
  select group_id into v_group from participants where id = p_participant;
  if not found then raise exception 'Participante no encontrado.'; end if;
  if a.role = 'delegado' and v_group <> a.group_id then raise exception 'Solo puedes pedir correcciones de tu ciclo.'; end if;
  if length(trim(coalesce(p_message, ''))) = 0 then raise exception 'Explica qué se debe corregir.'; end if;
  insert into corrections (participant_id, group_id, message) values (p_participant, v_group, trim(p_message));
end $$;

create or replace function my_corrections(p_token uuid) returns setof corrections
language plpgsql stable security definer set search_path = public as $$
declare a accounts := _session(p_token);
begin
  return query select * from corrections where a.role = 'admin' or group_id = a.group_id order by created_at;
end $$;

create or replace function admin_confirm(p_token uuid, p_ids uuid[]) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform _admin(p_token);
  update participants set status = 'confirmado' where id = any (p_ids);
end $$;

create or replace function admin_remove_participant(p_token uuid, p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform _admin(p_token);
  delete from participants where id = p_id;
end $$;

-- p_patch null = rechazar la solicitud.
create or replace function admin_resolve_correction(p_token uuid, p_id uuid, p_patch jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare c corrections; p participants; v_err text; v_name text; v_upao text; v_jersey int;
begin
  perform _admin(p_token);
  select * into c from corrections where id = p_id;
  if not found then raise exception 'Solicitud no encontrada.'; end if;
  if p_patch is not null then
    select * into p from participants where id = c.participant_id;
    v_name := regexp_replace(trim(coalesce(p_patch->>'name', p.name)), '\s+', ' ', 'g');
    v_upao := trim(coalesce(p_patch->>'upaoId', p.upao_id));
    v_jersey := coalesce((p_patch->>'jersey')::int, p.jersey);
    v_err := _validate(p.group_id, p.team_id, p.discipline_id, v_name, v_upao, v_jersey, p.gender, p.id);
    if v_err is not null then raise exception '%', v_err; end if;
    update participants set name = v_name, upao_id = v_upao, jersey = v_jersey where id = p.id;
  end if;
  update corrections set status = case when p_patch is null then 'rechazada' else 'resuelta' end where id = p_id;
end $$;

---------------------------------------------------------------- programación y anuncios

create or replace function admin_save_activity(p_token uuid, p_data jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform _admin(p_token);
  insert into activities (id, data) values (p_data->>'id', p_data)
  on conflict (id) do update set data = excluded.data, updated_at = now();
end $$;

create or replace function admin_delete_activity(p_token uuid, p_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform _admin(p_token);
  delete from activities where id = p_id and coalesce((data->>'custom')::boolean, false);
end $$;

create or replace function admin_save_announcement(p_token uuid, p_data jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform _admin(p_token);
  insert into announcements (id, data) values (p_data->>'id', p_data)
  on conflict (id) do update set data = excluded.data;
end $$;

create or replace function admin_delete_announcement(p_token uuid, p_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform _admin(p_token);
  delete from announcements where id = p_id;
end $$;

create or replace function admin_set_setting(p_token uuid, p_key text, p_value jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform _admin(p_token);
  insert into settings (key, value) values (p_key, p_value) on conflict (key) do update set value = excluded.value;
end $$;

-- Solo las funciones públicas quedan expuestas.
revoke execute on function _gname(text), _session(uuid), _admin(uuid),
  _validate(text, text, text, text, text, int, text, uuid) from public, anon, authenticated;

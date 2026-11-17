-- Fundo Organiza · esquema de base de datos para Supabase (PostgreSQL).
-- Se puede ejecutar varias veces en el SQL Editor: crea lo que falta, agrega
-- columnas nuevas y reemplaza las funciones. No borra datos.
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
  dni text,
  email text,
  created_by text,
  created_at timestamptz not null default now(),
  unique (upao_id, discipline_id)
);
-- Las bases permiten que dos jugadores del mismo equipo usen el mismo número.
alter table participants drop constraint if exists participants_discipline_id_team_id_jersey_key;

alter table participants add column if not exists dni text;
alter table participants add column if not exists email text;

-- Resultado que reporta el delegado de cada ciclo del partido.
create table if not exists score_reports (
  activity_id text not null references activities (id) on delete cascade,
  group_id text not null,
  report jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (activity_id, group_id)
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
alter table score_reports enable row level security;

drop policy if exists "lectura publica" on settings;
drop policy if exists "lectura publica" on activities;
drop policy if exists "lectura publica" on announcements;
drop policy if exists "lectura publica" on score_reports;
create policy "lectura publica" on settings for select to anon, authenticated using (true);
create policy "lectura publica" on activities for select to anon, authenticated using (true);
create policy "lectura publica" on announcements for select to anon, authenticated using (true);
create policy "lectura publica" on score_reports for select to anon, authenticated using (true);
grant select on settings, activities, announcements, score_reports to anon, authenticated;
-- participants, corrections, accounts y sessions no tienen políticas: nadie las lee directamente.

-- Lista pública de inscritos: sin ID UPAO.
create or replace view participants_public as
  select id, group_id, team_id, discipline_id, name, jersey, gender, status, created_at from participants;
grant select on participants_public to anon, authenticated;

-- Actualización en vivo de lo público (cada tabla por separado: si ya está, se ignora).
do $$ begin alter publication supabase_realtime add table activities; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table announcements; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table settings; exception when others then null; end $$;
do $$ begin alter publication supabase_realtime add table score_reports; exception when others then null; end $$;

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

-- Reglas de inscripción (capítulo III de las bases y aclaraciones de la comisión).
-- Devuelve el error o null.
drop function if exists _validate(text, text, text, text, text, int, text, uuid);
create or replace function _validate(p_group text, p_team text, p_disc text, p_name text, p_upao text,
  p_dni text, p_email text, p_jersey int, p_ignore uuid) returns text
language plpgsql stable security definer set search_path = public as $$
declare
  d record; v_other text; v_sports int; v_n int;
begin
  select * into d from (values
    ('futbol', 'Fútbol', 10, true, true),
    ('voley', 'Vóley', 8, true, true),
    ('basquet', 'Básquet', 8, true, true),
    ('gincana', 'Gincana', 10, false, false),
    ('futbol_damas', 'Fútbol damas', null, false, false),
    ('basquet_damas', 'Básquet damas', null, false, false),
    ('ajedrez', 'Ajedrez', null, false, false)
  ) t(id, name, mx, jer, sport) where t.id = p_disc;
  if not found then return 'Disciplina no válida.'; end if;
  if p_group not in ('c1','c2','c3','c4','c5','c6','c7','c8','c9','c10','ce') then return 'Ciclo no válido.'; end if;
  if p_disc = 'futbol' and p_group = 'c1' then
    if p_team not in ('c1.1', 'c1.2') then return 'Elige el equipo A (1.1) o B (1.2).'; end if;
  elsif p_team <> p_group then return 'Equipo no válido.'; end if;

  if trim(coalesce(p_name, '')) !~ '^\S+(\s*,\s*|\s+)\S+' then
    return 'Escribe el nombre completo: Apellidos, Nombres (por ejemplo: Rojas Cruz, Ana María).'; end if;
  if coalesce(p_upao, '') !~ '^([0-9]{6}|[0-9]{9})$' then return 'El ID UPAO debe tener 6 o 9 dígitos.'; end if;
  if coalesce(p_dni, '') !~ '^[0-9]{8}$' then return 'El DNI debe tener 8 dígitos.'; end if;
  if lower(coalesce(p_email, '')) !~ '^[a-z0-9._%+-]+@upao\.edu\.pe$' then
    return 'Usa el correo institucional (termina en @upao.edu.pe).'; end if;

  if exists (select 1 from participants where upao_id = p_upao and dni is not null and dni <> p_dni and id is distinct from p_ignore) then
    return 'Ese ID UPAO ya está registrado con otro DNI.'; end if;
  if exists (select 1 from participants where dni = p_dni and upao_id <> p_upao and id is distinct from p_ignore) then
    return 'Ese DNI ya está registrado con otro ID UPAO.'; end if;
  select group_id into v_other from participants
   where upao_id = p_upao and group_id <> p_group and id is distinct from p_ignore limit 1;
  if found then return 'Ese ID ya está inscrito por ' || _gname(v_other) || '. Cada estudiante participa por un solo ciclo.'; end if;
  if exists (select 1 from participants where upao_id = p_upao and discipline_id = p_disc and id is distinct from p_ignore) then
    return 'Ese ID ya está inscrito en ' || d.name || '.'; end if;

  select count(*) into v_sports from participants
   where upao_id = p_upao and discipline_id in ('futbol', 'voley', 'basquet') and id is distinct from p_ignore;
  if d.sport then
    if v_sports >= 2 then return 'Máximo 2 deportes por jugador (fútbol, vóley o básquet).'; end if;
  end if;

  if d.mx is not null then
    select count(*) into v_n from participants where discipline_id = p_disc and team_id = p_team and id is distinct from p_ignore;
    if v_n >= d.mx then return 'El equipo ya tiene el máximo de ' || d.mx || ' inscritos en ' || d.name || '.'; end if;
  end if;
  if d.jer then
    if p_jersey is null or p_jersey < 1 or p_jersey > 99 then return 'Indica un número de polo entre 1 y 99.'; end if;
  end if;
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

-- Cuentas para la comisión: listar y restablecer contraseñas olvidadas.
create or replace function admin_list_accounts(p_token uuid) returns table (username text, role text, group_id text)
language plpgsql stable security definer set search_path = public as $$
begin
  perform _admin(p_token);
  return query select a.username, a.role, a.group_id from accounts a order by a.role, a.username;
end $$;

-- Genera una contraseña temporal y cierra las sesiones abiertas de esa cuenta.
create or replace function admin_reset_password(p_token uuid, p_user text) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare me accounts := _admin(p_token); v_pass text; v_chars text := 'abcdefghjkmnpqrstuvwxyz23456789'; i int;
begin
  if p_user = me.username then raise exception 'Para tu propia cuenta usa «Cambiar mi contraseña».'; end if;
  if not exists (select 1 from accounts where username = p_user) then raise exception 'Cuenta no encontrada.'; end if;
  v_pass := '';
  for i in 1..12 loop
    v_pass := v_pass || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
    if i in (4, 8) then v_pass := v_pass || '-'; end if;
  end loop;
  update accounts set pass_hash = crypt(v_pass, gen_salt('bf')) where username = p_user;
  delete from sessions where username = p_user;
  return v_pass;
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
    trim(p->>'dni'), lower(trim(p->>'email')), (p->>'jersey')::int, null);
  if v_err is not null then raise exception '%', v_err; end if;
  insert into participants (group_id, team_id, discipline_id, name, upao_id, dni, email, jersey, created_by)
  values (v_group, p->>'teamId', p->>'disciplineId', regexp_replace(trim(p->>'name'), '\s+', ' ', 'g'),
    trim(p->>'upaoId'), trim(p->>'dni'), lower(trim(p->>'email')), (p->>'jersey')::int, a.username)
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
declare c corrections; p participants; v_err text; v_name text; v_upao text; v_dni text; v_email text; v_jersey int;
begin
  perform _admin(p_token);
  select * into c from corrections where id = p_id;
  if not found then raise exception 'Solicitud no encontrada.'; end if;
  if p_patch is not null then
    select * into p from participants where id = c.participant_id;
    v_name := regexp_replace(trim(coalesce(p_patch->>'name', p.name)), '\s+', ' ', 'g');
    v_upao := trim(coalesce(p_patch->>'upaoId', p.upao_id));
    v_dni := trim(coalesce(p_patch->>'dni', p.dni));
    v_email := lower(trim(coalesce(p_patch->>'email', p.email)));
    v_jersey := coalesce((p_patch->>'jersey')::int, p.jersey);
    v_err := _validate(p.group_id, p.team_id, p.discipline_id, v_name, v_upao, v_dni, v_email, v_jersey, p.id);
    if v_err is not null then raise exception '%', v_err; end if;
    update participants set name = v_name, upao_id = v_upao, dni = v_dni, email = v_email, jersey = v_jersey where id = p.id;
  end if;
  update corrections set status = case when p_patch is null then 'rechazada' else 'resuelta' end where id = p_id;
end $$;

---------------------------------------------------------------- llaves y resultados

-- Equipo de un lado del partido: fijo, ganador de otro partido o cupo de la llave
-- (pase directo / semifinal). Mismo criterio que src/data/bracket.ts.
create or replace function _resolve_side(p jsonb) returns text
language plpgsql stable security definer set search_path = public as $$
declare v text; d text; ov text; ws text[]; rest text[];
begin
  if p ? 'team' then return p->>'team'; end if;
  if p ? 'winner' then
    select data->>'winnerTeam' into v from activities where id = p->>'winner';
    return v;
  end if;
  if p ? 'slot' then
    d := p->>'of';
    select array_agg(data->>'winnerTeam' order by id) into ws
      from activities where data->>'disciplineId' = d and data->>'stage' = '2.ª ronda';
    if ws is null or array_position(ws, null) is not null then return null; end if;
    rest := array_remove(ws, 'none');
    if coalesce(array_length(rest, 1), 0) < 3 then
      -- Con dobles W.O. no hay semifinal: el primero pasa a la final.
      return case p->>'slot' when 'direct' then coalesce(rest[1], 'none') when 'semiA' then coalesce(rest[2], 'none') else 'none' end;
    end if;
    -- Con tres ganadores, el pase directo lo confirma la comisión (según el árbitro).
    select value->>d into ov from settings where key = 'directOverride';
    if ov is null or not (ov = any (rest)) then return null; end if;
    if p->>'slot' = 'direct' then return ov; end if;
    rest := array_remove(rest, ov);
    return case when p->>'slot' = 'semiA' then rest[1] else rest[2] end;
  end if;
  return null;
end $$;

-- Calcula el ganador (winnerTeam) de un partido finalizado.
create or replace function _finalize(d jsonb) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare t0 text; t1 text; w text; s0 int; s1 int;
begin
  if not (d ? 'sides') or d->>'status' is distinct from 'finalizado' then return d - 'winnerTeam'; end if;
  t0 := _resolve_side(d->'sides'->0);
  t1 := _resolve_side(d->'sides'->1);
  if t0 = 'none' or t1 = 'none' then
    w := case when t0 = 'none' then t1 else t0 end;
  elsif t0 is null or t1 is null then
    w := null;
  elsif coalesce((d->>'wo')::boolean, false) then
    w := case when d->>'winner' in (t0, t1, 'none') then d->>'winner' end;
  elsif jsonb_typeof(d->'score') = 'array' then
    s0 := (d->'score'->>0)::int; s1 := (d->'score'->>1)::int;
    w := case when s0 > s1 then t0 when s1 > s0 then t1 when d->>'winner' in (t0, t1) then d->>'winner' end;
  end if;
  return case when w is null then d - 'winnerTeam' else d || jsonb_build_object('winnerTeam', w) end;
end $$;

-- Recalcula los ganadores en orden de hora (primero las rondas anteriores).
create or replace function _recompute() returns void
language plpgsql security definer set search_path = public as $$
declare r record; v jsonb;
begin
  for r in select id, data from activities where data ? 'sides' order by data->>'start', id loop
    v := _finalize(r.data);
    if v is distinct from r.data then update activities set data = v, updated_at = now() where id = r.id; end if;
  end loop;
end $$;

-- El delegado registra el resultado de un partido de su ciclo. Si los delegados de
-- ambos ciclos coinciden, el partido se cierra solo; si no, queda en disputa.
create or replace function report_score(p_token uuid, p_activity text, p_report jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare
  a accounts := _session(p_token);
  d jsonb; t0 text; t1 text; g0 text; g1 text; v_unit text; s0 int; s1 int; v_wo boolean; v_w text;
  v_rep jsonb; n int; m int;
begin
  if a.role <> 'delegado' then raise exception 'Solo los delegados registran resultados; la comisión edita el partido directamente.'; end if;
  select data into d from activities where id = p_activity for update;
  if not found or not (d ? 'sides') then raise exception 'Partido no encontrado.'; end if;
  if d->>'status' in ('finalizado', 'cancelado') then
    raise exception 'Este partido ya está cerrado. Si hay un error, avisa a la comisión organizadora.'; end if;
  t0 := _resolve_side(d->'sides'->0);
  t1 := _resolve_side(d->'sides'->1);
  if t0 is null or t1 is null or t0 = 'none' or t1 = 'none' then raise exception 'Aún no se definen los dos equipos de este partido.'; end if;
  g0 := split_part(t0, '.', 1); g1 := split_part(t1, '.', 1);
  if a.group_id not in (g0, g1) then raise exception 'Solo puedes registrar resultados de partidos de tu ciclo.'; end if;

  v_unit := case d->>'disciplineId' when 'voley' then 'Sets' when 'basquet' then 'Puntos' when 'basquet_damas' then 'Puntos' else 'Goles' end;
  v_wo := coalesce((p_report->>'wo')::boolean, false);
  v_w := nullif(p_report->>'winner', '');
  if v_wo then
    if v_w is null or v_w not in (t0, t1, 'none') then raise exception 'Indica quién gana por W.O.'; end if;
    s0 := 0; s1 := 0;
  else
    s0 := (p_report->'score'->>0)::int; s1 := (p_report->'score'->>1)::int;
    if s0 is null or s1 is null or s0 < 0 or s1 < 0 or s0 >= 300 or s1 >= 300 then raise exception 'Marcador no válido.'; end if;
    if v_unit = 'Sets' and (greatest(s0, s1) <> 2 or least(s0, s1) > 1) then raise exception 'En vóley gana quien llega a 2 sets (2-0 o 2-1).'; end if;
    if v_unit = 'Puntos' and s0 = s1 then raise exception 'En básquet no hay empate: se define por punto de oro.'; end if;
    if s0 = s1 then
      if v_w is null or v_w not in (t0, t1) then raise exception 'Empate: indica quién ganó en penales.'; end if;
    else v_w := null; end if;
  end if;
  v_rep := jsonb_build_object('score', jsonb_build_array(s0, s1), 'wo', v_wo)
    || case when v_w is null then '{}'::jsonb else jsonb_build_object('winner', v_w) end;
  insert into score_reports (activity_id, group_id, report) values (p_activity, a.group_id, v_rep)
  on conflict (activity_id, group_id) do update set report = excluded.report, updated_at = now();

  select count(*), count(distinct report) into n, m from score_reports where activity_id = p_activity and group_id in (g0, g1);
  -- En 1.1 vs 1.2 los dos equipos son del mismo ciclo: basta un reporte.
  if (g0 = g1 and n < 1) or (g0 <> g1 and n < 2) then return 'esperando'; end if;
  if m = 1 then
    d := d || jsonb_build_object('status', 'finalizado', 'wo', v_wo, 'dispute', false);
    d := case when v_wo then d - 'score' else d || jsonb_build_object('score', jsonb_build_array(s0, s1)) end;
    d := case when v_w is null then d - 'winner' else d || jsonb_build_object('winner', v_w) end;
    update activities set data = d, updated_at = now() where id = p_activity;
    perform _recompute();
    return 'confirmado';
  end if;
  update activities set data = d || '{"dispute": true}'::jsonb, updated_at = now() where id = p_activity;
  return 'disputa';
end $$;

---------------------------------------------------------------- programación y anuncios

create or replace function admin_save_activity(p_token uuid, p_data jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  perform _admin(p_token);
  insert into activities (id, data) values (p_data->>'id', p_data)
  on conflict (id) do update set data = excluded.data, updated_at = now();
  perform _recompute();
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
  perform _recompute();
end $$;

-- Solo las funciones públicas quedan expuestas.
revoke execute on function _gname(text), _session(uuid), _admin(uuid),
  _validate(text, text, text, text, text, text, text, int, uuid),
  _resolve_side(jsonb), _finalize(jsonb), _recompute() from public, anon, authenticated;

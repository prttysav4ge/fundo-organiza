# Fundo Organiza

Plataforma web para organizar y seguir eventos universitarios en el Fundo UPAO.
Primera versión: **Día de Integración ICSI – ISIA 2026** (sábado 21 de noviembre de 2026).

Los equipos, el cronograma, los fixtures y las reglas vienen de las bases oficiales del evento.

Los datos viven en **Supabase** (PostgreSQL): son compartidos, se actualizan en vivo y cada
celular guarda una copia para mostrarla sin señal. Las reglas de inscripción y los permisos se
aplican en el servidor (`supabase/schema.sql`).

## Base de datos

1. En Supabase › SQL Editor, ejecuta `supabase/schema.sql` y luego `supabase/seed.sql`.
2. Crea las cuentas con contraseñas propias (no se guardan en el repositorio):

```sql
insert into accounts (username, pass_hash, role, group_id) values
  ('admin', extensions.crypt('CONTRASEÑA', extensions.gen_salt('bf')), 'admin', null),
  ('delegado10', extensions.crypt('CONTRASEÑA', extensions.gen_salt('bf')), 'delegado', 'c10');
```

`node scripts/gen-seed.ts` regenera `seed.sql` a partir de `src/data/seed.ts`.
La conexión está en `src/config.ts` (solo la clave pública *anon*).

## Qué incluye

- **Estudiantes (sin cuenta):** eligen su ciclo y ven sus partidos, las actividades generales,
  resultados, anuncios y el mapa interactivo del Fundo.
- **Competencias:** fútbol, vóley y básquet con llave de eliminación que avanza sola (ganadores,
  W.O., penales, pase directo a la final según las bases); gincana con tabla de puntos (5/3/2/1);
  fútbol y básquet damas; ajedrez blitz abierto (campeón individual); concurso tecnológico (información).
- **Delegados de ciclo:** inscriben con nombre, ID UPAO y número de polo. Se aplican las reglas de
  las bases: plazo de inscripción, máximo 2 deportes, gincana excluyente, un solo ciclo por
  estudiante, número único por equipo y cupos por deporte. Lo enviado no se edita: se solicita corrección.
- **Comisión organizadora:** estados, marcadores, horarios y lugares (con detección de cruces),
  puestos de la gincana, pase directo en caso de empate, confirmación de inscripciones,
  correcciones, anuncios por ciclo y actividades adicionales.

El ID UPAO solo lo ven el delegado y la comisión; las listas públicas muestran nombre y número.

Versión de demostración sin servidor: `VITE_LOCAL=1 npm run build` (cuentas `admin` / `admin2026`,
`delegado10` / `ciclo10`, etc.).

## Desarrollo

```bash
npm install
npm run dev
```

`npm run build` genera el sitio estático en `dist/`.

## Estructura

- `src/data/seed.ts` — datos del evento (equipos, sedes, disciplinas, fixture, reglas).
- `src/data/bracket.ts` — lógica de llaves, pase directo y tabla de gincana.
- `src/data/store.tsx` — capa de datos y validaciones (a reemplazar por un backend).
- `src/components/FundoMap.tsx` — croquis SVG interactivo.
- `src/pages/` — vistas públicas (`public.tsx`) y de gestión (`manage.tsx`).

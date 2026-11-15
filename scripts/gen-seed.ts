// Genera supabase/seed.sql con la programación inicial y los ajustes del evento.
// Uso: node scripts/gen-seed.ts   (Node 22.18+ ejecuta TypeScript directamente)
import { writeFileSync } from 'node:fs'
import { EVENT, seed } from '../src/data/seed.ts'

const q = (v: unknown) => `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`
const s = seed()
const lines = [
  '-- Datos iniciales del Día de Integración ICSI – ISIA 2026. Generado por scripts/gen-seed.ts.',
  '-- Solo inserta lo que falta: no pisa resultados ni anuncios ya guardados.',
  `insert into settings (key, value) values ('deadline', ${q(EVENT.deadline)}), ('directOverride', '{}'::jsonb) on conflict (key) do nothing;`,
  ...s.activities.map((a) => `insert into activities (id, data) values ('${a.id}', ${q(a)}) on conflict (id) do nothing;`),
  ...s.announcements.map((n, i) => `insert into announcements (id, data, created_at) values ('${n.id}', ${q(n)}, now() - interval '${i} minutes') on conflict (id) do nothing;`),
]
writeFileSync(new URL('../supabase/seed.sql', import.meta.url), lines.join('\n') + '\n')
console.log(`seed.sql: ${s.activities.length} actividades, ${s.announcements.length} anuncios`)

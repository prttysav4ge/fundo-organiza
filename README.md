# Fundo Organiza

Plataforma web para organizar y seguir eventos universitarios en el Fundo UPAO.
Primera versión: Día de Integración de Ingeniería de Sistemas e Inteligencia Artificial.

**Estado: prototipo funcional con datos de demostración** (se guardan en el navegador; aún no hay backend).

## Qué incluye

- Selección de ciclo sin cuenta y panel personalizado (en curso, próximos, resultados, anuncios).
- Mapa interactivo del Fundo: cada zona muestra su programación, actividad en curso y si tu ciclo juega allí.
- Cronograma con filtros, secciones por disciplina (partidos o tabla de puntos) y listas de inscritos.
- Delegados: inscriben participantes de su ciclo; no editan lo enviado, solicitan corrección.
- Administración: estados, marcadores, horarios y lugares (con detección de cruces), confirmación de
  inscripciones, correcciones y anuncios por ciclo.

Cuentas de prueba: `admin` / `admin2026`; delegados `delegado1`…`delegado10` / `ciclo1`…`ciclo10`.

## Desarrollo

```bash
npm install
npm run dev
```

`npm run build` genera el sitio estático en `dist/`.

## Estructura

- `src/data/` — modelo (`types.ts`), datos demo (`seed.ts`) y capa de datos (`store.tsx`, a reemplazar por un backend).
- `src/components/FundoMap.tsx` — croquis SVG interactivo.
- `src/pages/` — vistas públicas (`public.tsx`) y de gestión (`manage.tsx`).

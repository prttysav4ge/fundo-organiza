# Fundo Organiza

Plataforma web para organizar y seguir eventos universitarios en el Fundo UPAO.
Primera versión: **Día de Integración ICSI – ISIA 2026** (sábado 21 de noviembre de 2026).

Los equipos, el cronograma, los fixtures y las reglas vienen de las bases oficiales del evento.

> **Importante:** los datos se guardan en el navegador de cada dispositivo (`localStorage`).
> Todavía no hay backend compartido, así que lo que registra un delegado o la comisión no se
> ve en otros celulares. Tampoco el login es seguro: las cuentas son provisionales.

## Qué incluye

- **Estudiantes (sin cuenta):** eligen su ciclo y ven sus partidos, las actividades generales,
  resultados, anuncios y el mapa interactivo del Fundo.
- **Competencias:** fútbol, vóley y básquet con llave de eliminación que avanza sola (ganadores,
  W.O., penales, pase directo a la final según las bases); gincana con tabla de puntos (5/3/2/1);
  fútbol y básquet damas; concurso tecnológico (información).
- **Delegados de ciclo:** inscriben con nombre, ID UPAO y número de polo. Se aplican las reglas de
  las bases: plazo de inscripción, máximo 2 deportes, gincana excluyente, un solo ciclo por
  estudiante, número único por equipo y cupos por deporte. Lo enviado no se edita: se solicita corrección.
- **Comisión organizadora:** estados, marcadores, horarios y lugares (con detección de cruces),
  puestos de la gincana, pase directo en caso de empate, confirmación de inscripciones,
  correcciones, anuncios por ciclo y actividades adicionales.

El ID UPAO solo lo ven el delegado y la comisión; las listas públicas muestran nombre y número.

Cuentas provisionales: `admin` / `admin2026`; `delegado1`…`delegado10` / `ciclo1`…`ciclo10`;
`delegadoe` / `egresados`.

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

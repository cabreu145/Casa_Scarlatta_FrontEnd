# BUG-013 - DiagnÃ³stico de asignaciÃ³n de clases a coach

## Resumen del bug
En `Admin > Clases` se asigna coach en UI, pero en `Coach Dashboard` no siempre se reflejan clases asignadas. AdemÃ¡s, aparecen repeticiones por dÃ­as y mÃ©tricas inconsistentes.

## RelaciÃ³n con BUG-010/011/012
- BUG-013 es raÃ­z funcional de bloque coach/admin.
- Impacta directamente:
  - BUG-010: "Todas mis clases esta semana" vacÃ­o/inconsistente.
  - BUG-011: mÃ©tricas coach hardcodeadas/no dinÃ¡micas.
  - BUG-012: "Clases de hoy" no muestra asignadas.

ConclusiÃ³n: sin cerrar BUG-013, BUG-010/011/012 seguirÃ¡n inestables.

## Flujo admin actual (hallazgo)
Archivos:  
- `D:/Casa_Scarlatta_FrontEnd/frontend/src/pages/admin/AdminPanel.jsx`  
- `D:/Casa_Scarlatta_FrontEnd/frontend/src/pages/admin/sections/ClasesSection.jsx`

Comportamiento detectado:
1. Alta/ediciÃ³n de clase en admin usa `agregarClase/editarClase` de `clasesStore` (local Zustand + persist), no endpoint backend.
2. AsignaciÃ³n de coach en admin:
   - Resuelve coach por nombre (`coaches.find(c => c.nombre === claseForm.coach)`).
   - Guarda `coachId` y `coachNombre` locales en objeto clase.
3. Importador de clases tambiÃ©n asigna coach por matching de nombre parcial (`coachRaw`), no por ID backend robusto.
4. No hay `POST/PUT /api/v1/clases` en este flujo cuando flags API estÃ¡n activos.

ImplicaciÃ³n:
- En modo API, backend es source of truth para clases, pero admin sigue mutando solo estado local.
- Lo asignado en admin no llega a backend y no puede consumirse coherentemente por otras vistas/usuarios/sesiÃ³n.

## Flujo coach actual (hallazgo)
Archivo:
- `D:/Casa_Scarlatta_FrontEnd/frontend/src/pages/coach/CoachPanel.jsx`

Comportamiento detectado:
1. `CoachPanel` consume `clases` desde `clasesStore` (no consulta ocurrencias).
2. Filtra "mis clases" con lÃ³gica hÃ­brida local:
   - compara `c.coachId` con `coachData.id` de `coachesStore`.
   - o compara `c.coachNombre` con `coachData.nombre` / `usuario.nombre`.
3. `coachData` proviene de `coachesStore` mock/local, no de entidad backend de coach autenticado.
4. Tablas/metricas usan clases base (class-level) y derivaciÃ³n local de fechas por `dia`/`fecha`.

ImplicaciÃ³n:
- Dependencia fuerte de nombres y IDs locales no canÃ³nicos.
- Riesgo alto de mismatch `coachId` local (`coach-...`) vs backend (`int`).

## Fuentes de datos detectadas
- Local/mock:
  - `coachesStore` (`COACHES_MOCK`, ids `coach-...`)
  - `clasesStore` (persist local, `agregarClase/editarClase`)
- API/backend:
  - `clasesApiService.getClasesApi()` (lectura)
  - `occurrencesApiService.getOccurrencesByClassApi()` (lectura)

Hallazgo clave:
- Admin/Coach no estÃ¡n plenamente alineados con flujo API occurrence-based ya aplicado en cliente.

## Uso de backend vs mock/localStorage
- Lectura clases API existe en partes cliente.
- Flujo admin de asignaciÃ³n de coach: local-only.
- Flujo coach dashboard: local/hÃ­brido, sin endpoint dedicado por coach ni ocurrencias por rango como fuente principal.

## Â¿Se usa coach_id real?
Parcial y no robusto:
- `classAdapter` mapea `coach_id` backend a `coachId`.
- Pero `CoachPanel` compara contra `coachesStore.id` (`coach-...`) y/o nombre.
- Resultado: matching inestable, dependiente de coincidencia textual.

## Â¿Se usa occurrence_id / class_occurrences?
No en dashboard coach actual:
- `CoachPanel` renderiza por clase base.
- SegmentaciÃ³n semanal y "hoy" se deriva localmente por `dia/fecha`.
- No usa `occurrence_id` como identidad de sesiÃ³n ni consume ocurrencias reales del rango.

## RepeticiÃ³n por dÃ­as (causa probable)
Causa mixta:
1. Frontend:
   - DerivaciÃ³n local de ocurrencias semanales desde `dia` para clases recurrentes (sin instancia real).
   - Uso de `class_id`/clase base para vistas semanales puede replicar visualmente clases en distintos dÃ­as/rangos.
2. Contrato/flujo backend no integrado en coach/admin:
   - Falta consumir `class_occurrences` como source of truth en dashboard coach.

## ClasificaciÃ³n del problema
**Mixto (frontend + integraciÃ³n backend requerida)**.

No es frontend-only porque:
- Para cierre robusto de coach/admin se requiere operar sobre contratos backend reales (clases/ocurrencias/asignaciÃ³n coach por ID canÃ³nico).
- Actualmente admin no persiste asignaciÃ³n en backend en modo API.

## Propuesta de soluciÃ³n mÃ­nima (siguiente implementaciÃ³n)
1. En modo API (`VITE_USE_API_CLASSES=true`):
   - Admin clases debe crear/editar clases vÃ­a backend (no solo store local).
   - Persistir `coach_id` canÃ³nico backend.
2. Coach dashboard:
   - Base de lectura por ocurrencias reales (`/clases/{id}/ocurrencias` o endpoint agregado futuro).
   - Filtrar clases del coach por `coachId` canÃ³nico (no por nombre).
   - MÃ©tricas derivadas de dataset real semanal/hoy.
3. Mantener fallback local solo con flags API `false`.

## Riesgos
- Mismatch de identidad coach entre usuario auth y entidad coach backend.
- Duplicidad temporal de fuentes (store local + API) durante transiciÃ³n.
- Regresiones en filtros por semana/hoy si no se normaliza timezone/fecha.

## Tests necesarios
1. Admin API mode:
   - alta/ediciÃ³n de clase persiste `coach_id` en backend.
2. Coach panel API mode:
   - "todas mis clases semana" usa dataset real y no queda vacÃ­o si hay asignaciones.
   - "clases de hoy" filtra por fecha real de ocurrencia.
   - no matching por nombre como criterio principal.
3. RepeticiÃ³n:
   - una ocurrencia no se replica en dÃ­as incorrectos.
4. Fallback:
   - con flags false, flujo local no se rompe.

## RecomendaciÃ³n de siguiente paso
Abrir implementaciÃ³n por fases:
1. Corregir BUG-013 (persistencia + matching de coach por ID canÃ³nico + ocurrencias en coach).
2. Luego cerrar BUG-010/011/012 sobre esa base.

Conviene coordinaciÃ³n paralela con backend para confirmar:
- mapeo canÃ³nico `user(coach)` <-> `coach.id`,
- endpoints de lectura Ã³ptimos para dashboard coach por rango.
## Actualizacion implementacion (2026-05-30)
- Se integró `GET /api/v1/coaches/me/agenda?from&to` en frontend para CoachPanel en API mode.
- CoachPanel ahora consume `agenda.occurrences` por rango semanal como fuente principal en API mode.
- "Clases de hoy" y "Todas mis clases esta semana" derivan de `occurrence_date` real, no de matching por nombre.
- Se agregaron estados de loading/error/empty para agenda coach.
- Fallback local con `clasesStore/coachesStore` se mantiene solo cuando flags API están en false.
- Pendiente restante BUG-013: confirmar persistencia admin->backend de asignación coach_id en modo API (subpaso separado).
## Actualizacion 2026-05-30 (cierre admin API mode)
- Admin > Clases en API mode ya persiste asignación de coach con backend:
  - crear: `POST /api/v1/clases` con `coach_id` canónico.
  - editar: `PUT /api/v1/clases/{id}` con `coach_id` canónico.
- En API mode, `coachNombre` queda solo para presentación.
- Tras crear/editar en API mode se refresca clases desde backend (`loadClasesFromApi`).
- Fallback local (`agregarClase/editarClase`) se mantiene solo con `VITE_USE_API_CLASSES=false`.
- Con esto BUG-013 queda cerrado funcionalmente frontend (coach + admin).

- Estado posterior: BUG-010 cerrado frontend sobre esta base (tabla semanal coach ya consume genda.occurrences).


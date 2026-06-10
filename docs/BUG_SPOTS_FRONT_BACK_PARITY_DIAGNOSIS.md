# BUG-SPOTS Front/Back Parity Diagnosis

## Scope
- Objetivo: validar paridad entre mapa mock actual de frontend y catalogo real de spots backend antes de integrar holds.
- Estado: diagnostico solamente. No cambia flujo de reservas, Mercado Pago ni backend.

## Frontend files found
- `src/features/clases/SeatSelector.jsx`
- `src/features/clases/SeatSelector.module.css`
- `src/pages/cliente/ClientPanel.jsx`
- `src/pages/Reservar.jsx`
- `src/pages/Clases.jsx`
- `src/pages/admin/AdminPanel.jsx`
- `src/pages/cliente/profileFormUtils.js` no aplica al mapa, pero confirmo que no toca flujo de spots.

## Frontend STRYDE layout
Current STRYDE renderer in `SeatSelector.jsx` is not bike-based. It renders:
- 4 rear bench positions
- 1 coach zone in center
- 5 front bench positions
- 6 treadmill positions

Total visible positions: 15 + coach zone.

| Front label | Orden visual | Fila/Zona | Tipo visual | Comentario |
| --- | ---: | --- | --- | --- |
| 06 | 1 | Fila trasera | Bench | Rear row, left to right |
| 07 | 2 | Fila trasera | Bench | Rear row |
| 08 | 3 | Fila trasera | Bench | Rear row |
| 09 | 4 | Fila trasera | Bench | Rear row |
| COACH | - | Zona central | Badge especial | No es spot |
| 05 | 5 | Fila delantera | Bench | Front row, rightmost in code order |
| 04 | 6 | Fila delantera | Bench | Front row |
| 03 | 7 | Fila delantera | Bench | Front row |
| 02 | 8 | Fila delantera | Bench | Front row |
| 01 | 9 | Fila delantera | Bench | Front row, leftmost in code order |
| 06 | 10 | Fila inferior | Treadmill | Tread row, left to right |
| 05 | 11 | Fila inferior | Treadmill | Tread row |
| 04 | 12 | Fila inferior | Treadmill | Tread row |
| 03 | 13 | Fila inferior | Treadmill | Tread row |
| 02 | 14 | Fila inferior | Treadmill | Tread row |
| 01 | 15 | Fila inferior | Treadmill | Tread row |

Estados visuales en frontend STRYDE:
- available
- occupied
- selected
- tu lugar
- no hay estado visual propio para held / held_by_me / inactive en el mock actual

## Frontend SLOW layout
Current SLOW renderer in `SeatSelector.jsx` is mat-based, but count and numbering do not match backend seed.

Total visible spots: 9 + coach zone.

| Front label | Orden visual | Fila/Zona | Tipo visual | Comentario |
| --- | ---: | --- | --- | --- |
| 01 | 1 | Fila frontal | Mat | Left side of front row |
| 03 | 2 | Fila frontal | Mat | Front row |
| COACH | - | Zona central | Badge especial | No es spot |
| 07 | 3 | Fila frontal | Mat | Right side of front row |
| 09 | 4 | Fila frontal | Mat | Right side of front row |
| 02 | 5 | Fila trasera | Mat | Back row |
| 04 | 6 | Fila trasera | Mat | Back row |
| 06 | 7 | Fila trasera | Mat | Back row |
| 08 | 8 | Fila trasera | Mat | Back row |
| 10 | 9 | Fila trasera | Mat | Back row |

Estados visuales en frontend SLOW:
- available
- occupied
- selected
- tu lugar
- no hay estado visual propio para held / held_by_me / inactive en el mock actual

## Backend spot seed / contract
Backend seed is explicit in `app/db/init_db.py` and docs/tests.

### Backend STRYDE seed
- spots `01` to `10`
- `equipment_type = bike`
- row/col/x/y:
  - rows 1 and 2
  - row 1: 01-05, cols 1-5
  - row 2: 06-10, cols 1-5
  - x = `10 * idx`
  - y = `20` for 01-05, `40` for 06-10

| Backend spot_id | Label | Discipline | Equipment type | Row | Col | X | Y | Status |
| ---: | --- | --- | --- | --: | --: | --: | --: | --- |
| 1 | 01 | stryde | bike | 1 | 1 | 10 | 20 | available |
| 2 | 02 | stryde | bike | 1 | 2 | 20 | 20 | available |
| 3 | 03 | stryde | bike | 1 | 3 | 30 | 20 | available |
| 4 | 04 | stryde | bike | 1 | 4 | 40 | 20 | available |
| 5 | 05 | stryde | bike | 1 | 5 | 50 | 20 | available |
| 6 | 06 | stryde | bike | 2 | 1 | 60 | 40 | available |
| 7 | 07 | stryde | bike | 2 | 2 | 70 | 40 | available |
| 8 | 08 | stryde | bike | 2 | 3 | 80 | 40 | available |
| 9 | 09 | stryde | bike | 2 | 4 | 90 | 40 | available |
| 10 | 10 | stryde | bike | 2 | 5 | 100 | 40 | available |

### Backend SLOW seed
- spots `01` to `08`
- `equipment_type = mat`
- row/col/x/y:
  - rows 1 and 2
  - row 1: 01-04, cols 1-4
  - row 2: 05-08, cols 1-4
  - x = `15 * idx`
  - y = `25` for 01-04, `45` for 05-08

| Backend spot_id | Label | Discipline | Equipment type | Row | Col | X | Y | Status |
| ---: | --- | --- | --- | --: | --: | --: | --: | --- |
| 11 | 01 | slow | mat | 1 | 1 | 15 | 25 | available |
| 12 | 02 | slow | mat | 1 | 2 | 30 | 25 | available |
| 13 | 03 | slow | mat | 1 | 3 | 45 | 25 | available |
| 14 | 04 | slow | mat | 1 | 4 | 60 | 25 | available |
| 15 | 05 | slow | mat | 2 | 1 | 75 | 45 | available |
| 16 | 06 | slow | mat | 2 | 2 | 90 | 45 | available |
| 17 | 07 | slow | mat | 2 | 3 | 105 | 45 | available |
| 18 | 08 | slow | mat | 2 | 4 | 120 | 45 | available |

## Comparison

### STRYDE
- Frontend count: 15 visible positions + coach zone.
- Backend count: 10 spots.
- Labels mismatch: frontend shows benches and treadmills with labels 06-01 in both sections; backend uses simple 01-10 bike labels.
- Equipment mismatch: frontend has `bench` and `treadmill`; backend only `bike`.
- Layout mismatch: frontend needs front/rear bench + treadmill rows; backend only exposes row/col/x/y for a 2-row bike map.
- Metadata available in backend: row, col, x, y are enough for a simpler grid, but not enough to reproduce current STRYDE decorative renderer 1:1.

### SLOW
- Frontend count: 9 visible positions + coach zone.
- Backend count: 8 spots.
- Labels mismatch: frontend uses 01,03,07,09 on front row and 02,04,06,08,10 on back row; backend uses 01-08 only.
- Equipment mismatch: frontend uses `mat`, which matches backend, but frontend numbering/layout does not.
- Layout mismatch: frontend expects central coach gap and 9 positions; backend seed is 8 spots in a 2x4 grid.
- Metadata available in backend: row, col, x, y are enough for a 2-row mat grid, but not enough to keep current 9-position renderer unchanged.

## Gaps classified
- A) Backend OK, frontend can adapt: yes, for basic 2-row render with row/col/x/y.
- B) Backend seed/layout needs adjust: no strong signal from seed; seed is internally consistent and tested.
- C) Frontend mock incomplete/incorrect: yes, STRYDE and SLOW both diverge from backend counts and labels.
- D) SLOW needs visual definition: yes, if product wants coach gap or 9-position premium layout.
- E) Missing backend visual metadata: yes, if product wants to preserve current premium layout exactly.

## Date and credits diagnostics
- `null · 16:00` probable cause:
  - UI builds summary from `cls.dia` / `fecha` + `cls.hora`.
  - When `fecha` or `dia` is null in API-mode mapped item, fallback string becomes `null · 16:00`.
  - Most likely source is class/occurrence mapping, not seat renderer itself.
- `0 creditos restantes` probable cause:
  - `resolveFinancialUiState` returns `creditsBalance ?? 0` when `activeMembership` is missing.
  - During API bootstrap or transient financial load, this can briefly resolve to 0 before `financialState`/`activeMembership` settle.
  - If state is `no_membership`, UI will also show 0 with no membership active.

## Recommendation
- Current backend seed is internally consistent and validated by tests/docs.
- Frontend current SeatSelector is legacy/mock layout and does not match backend parity.
- Best next step: adapt frontend renderer to backend spot catalog and statuses, or define a new visual spec if product wants preserve premium STRYDE/SLOW layout.
- For holds integration, frontend should consume backend `row/col/x/y` and render `available / held / held_by_me / reserved / inactive`.

## Notes on backend capture
- Live API capture from shell was blocked by token mismatch in this environment.
- Seed code and backend tests were used as authoritative contract evidence for parity diagnosis.

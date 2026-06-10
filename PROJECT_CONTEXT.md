# PROJECT_CONTEXT.md

## Descripcion General De La Plataforma
Casa Scarlatta FrontEnd es una SPA web para operacion de un estudio fitness/boutique. Incluye experiencia publica (home, clases, marca), experiencia de cliente (reservas, perfil, pagos), experiencia de coach y panel administrativo (operacion completa, POS, finanzas, reportes, configuracion).

## Objetivo Del Negocio / Proposito Del Sistema
El sistema busca centralizar la operacion del estudio en una sola interfaz:
- Captacion y presentacion de la marca (sitio publico).
- Gestion de reservas de clases por clientes.
- Control de cupos, lista de espera y asistencia.
- Venta de paquetes/productos en recepcion (POS).
- Seguimiento financiero y actividad operativa.

## Stack Tecnologico
- Frontend: React 19, React DOM 19.
- Build/dev: Vite 8.
- Routing: react-router-dom 7.
- Estado global: Zustand + persist middleware (localStorage).
- Data layer: servicios locales + mocks (backend no conectado en runtime).
- Fetch/cache: @tanstack/react-query presente (uso real minimo actualmente).
- Formularios/validacion: react-hook-form + zod + resolvers.
- UI/motion: CSS Modules, CSS global, Framer Motion, Lucide React.
- Charts/reporting: chart.js + react-chartjs-2 + xlsx.
- Notificaciones: react-hot-toast.
- Testing: Vitest + Testing Library + jsdom.

## Arquitectura Y Patrones Utilizados
- SPA por rutas con layout dinamico segun contexto (publico vs dashboards).
- Separacion por capas:
  - `pages/` para pantallas.
  - `features/` para modulos funcionales.
  - `components/` para UI/layout reutilizable.
  - `stores/` (Zustand) para estado por dominio.
  - `services/` para reglas de negocio/orquestacion.
- Patron frontend-first/mock-driven:
  - Reglas de negocio en servicios (`reservasService`, `ventaService`, etc.).
  - Persistencia local como fuente activa (no API real en flujo principal).
- Control de acceso por rol con `AuthContext` + `ProtectedRoute`.

## Estructura De Carpetas
Raiz:
- `frontend/`: aplicacion principal React/Vite.
- `rules/`: documentacion de lineamientos (parte desalineada con estado actual).
- `AGENTS.md`: reglas de sesion (actualmente estilo caveman).
- Carpetas de tooling/skills agregadas por instalacion de caveman:
  - `.agents/`, `.cursor/`, `.windsurf/`, `.clinerules/`, `.opencode/`, `.github/`
  - `skills-lock.json` (lock de skills instaladas)

Dentro de `frontend/src`:
- `pages/`: vistas publicas y dashboards (`admin`, `cliente`, `coach`).
- `features/`: subdominios (clases, home, pagos, paquetes).
- `components/`: `ui/`, `layout/`, `auth/`.
- `stores/`: estado por dominio (auth, clases, reservas, usuarios, finanzas, etc.).
- `services/`: logica de negocio transversal.
- `data/`: mocks y contratos de datos locales.
- `constants/`, `utils/`, `hooks/`, `context/`, `styles/`.

## Componentes O Modulos Principales
- Auth:
  - `context/AuthContext.jsx`
  - `stores/authStore.js`
  - `components/auth/ProtectedRoute.jsx`
- Reservas/clases:
  - `services/reservasService.js`
  - `stores/clasesStore.js`, `stores/reservasStore.js`, `stores/listaEsperaStore.js`
  - `features/clases/*` (incluye `SeatSelector`)
- Dashboard cliente:
  - `pages/cliente/ClientPanel.jsx`
- Dashboard admin:
  - `pages/admin/AdminPanel.jsx` + secciones (`sections/*`)
- POS/finanzas:
  - `services/ventaService.js`
  - `stores/transaccionesStore.js`, `stores/cortesStore.js`, `stores/gastosStore.js`
- Configuracion/branding:
  - `stores/configuracionStore.js`

## Flujo General De La Aplicacion
1. App inicia en `main.jsx` con `ErrorBoundary`, `QueryClientProvider`, `AuthProvider` y `Toaster`.
2. `App.jsx` enruta:
- Publico: navbar + footer + transiciones.
- Dashboard: rutas protegidas por rol (`cliente`, `coach`, `admin`).
3. Login/registro usa `AuthContext` (actualmente contra `mockUsers` + store usuarios).
4. Cliente reserva clase:
- UI llama `reservasService.reservarClase`.
- Servicio valida reglas, crea reserva, ajusta cupos/creditos, notifica y simula email.
5. Admin opera POS:
- `procesarVentaService` registra transaccion y actualiza paquete/creditos si aplica.
6. Datos persisten localmente en multiples claves de localStorage (Zustand persist).

## APIs, Servicios E Integraciones
Estado actual:
- API real no activa para flujos core.
- `constants/api.js` define endpoints REST objetivo.
- `lib/http.js` existe pero funciones retornan `null` (fetch comentado).

Integraciones internas activas:
- Plugin de Vite `upload-foto` expone endpoint local dev `POST /api/upload-foto` y escribe en `public/fotos/`.
- Servicio de email simulado (`services/emailService.js`) via `console.info`.

Integraciones previstas (comentadas/documentadas):
- Auth, reservas, finanzas, configuracion, email por backend REST.

## Manejo De Estado (Si Aplica)
- Patron principal: Zustand por dominio, generalmente con `persist`.
- Ejemplos de claves persistidas:
  - `casa-scarlatta-auth`
  - `casa-scarlatta-clases`
  - `casa-scarlatta-reservas`
  - `casa-scarlatta-usuarios`
  - `casa-scarlatta-paquetes-v2`
  - `casa-scarlatta-transacciones`
- Hay limpieza versionada en `main.jsx` con `cs-version` para invalidar ciertas claves.

## Configuracion Y Variables De Entorno
- No se detecta uso real de `VITE_API_*` en runtime de servicios actuales.
- Solo referencia de entorno detectada en `loggerService` (`import.meta.env.DEV`).
- La URL base API activa en codigo es placeholder fijo en `constants/api.js` (`http://localhost:3000`).

## Build / Ejecucion / Deployment
Desde `frontend/package.json`:
- `npm run dev` -> Vite dev server.
- `npm run build` -> build produccion.
- `npm run preview` -> preview local build.
- `npm run test` / `npm run test:watch` -> Vitest.

Hallazgos deployment:
- `frontend/start-server.cmd` usa ruta absoluta antigua (`C:\Users\cadmus\...`) y puede estar obsoleto/no portable.

## Convenciones De Codigo Detectadas
- Alias `@` configurado en Vite para `src`.
- Uso intensivo de comentarios guia en espanol en servicios/stores.
- UI en espanol; naming tecnico mixto (ingles/espanol) segun modulo.
- Componentes en PascalCase (`ClientPanel.jsx`, `ProtectedRoute.jsx`).
- Stores y servicios en camelCase/kebab segun archivo (`reservasService.js`, `authStore.js`).
- CSS Modules por pantalla/componente + estilos globales.
- Convencion operativa adicional detectada en raiz por `AGENTS.md`:
  - Estilo de respuesta \"caveman\" para asistentes/agentes en sesiones habilitadas.

## Dependencias Importantes
- `react`, `react-dom`, `react-router-dom`
- `zustand`
- `@tanstack/react-query`
- `framer-motion`
- `react-hook-form`, `zod`
- `react-hot-toast`
- `chart.js`, `react-chartjs-2`, `xlsx`
- `date-fns`, `lucide-react`

## Riesgos Tecnicos / Deuda Tecnica Detectada
- Alto acoplamiento a mocks/localStorage en logica core (riesgo al migrar backend).
- Capa HTTP y endpoints definidos pero no operativos (deuda de integracion).
- React Query instalado globalmente, casi sin adopcion en features.
- Documentacion `rules/` parcialmente desalineada (habla de monorepo con backend no presente en este repo actual).
- `start-server.cmd` no portable por rutas absolutas de otro entorno.
- Riesgo de consistencia entre stores (ej. creditos en `authStore` y `usuariosStore`) si no se centraliza fuente unica al migrar backend.
- Ruido de repositorio: archivos/carpetas de skills y reglas multi-agente en raiz pueden introducir ambiguedad de gobernanza si no se versionan con criterio.

## Notas De Onboarding Para Futuros Desarrolladores
- Entrar por `frontend/src/App.jsx` y `frontend/src/main.jsx` para mapa de ejecucion.
- Entender primero servicios clave antes de tocar UI:
  - `reservasService.js`
  - `ventaService.js`
  - `usuariosService.js`
- Tratar `stores/*` como estado productivo actual (persistido en localStorage).
- Antes de conectar backend:
  - Definir contrato final de datos (clases, reservas, usuarios, transacciones).
  - Activar `lib/http.js` y migrar servicio por servicio.
- Probar rutas por rol:
  - `/cliente/dashboard`
  - `/coach/dashboard`
  - `/admin/dashboard`

## Suposiciones E Inferencias Del Analisis
- El backend de produccion existe o se planea fuera de este repo, pero este frontend hoy opera en modo local/mock.
- `rules/*.md` parecen heredados de otro proyecto/base (cabreudev) y no representan 100% el estado actual.
- El objetivo de negocio principal es operacion integral de estudio fitness (no solo sitio marketing).
- La migracion a API real fue planeada cuidadosamente (hay marcadores `[BACKEND]`), pero esta incompleta.

## Claude-Mem fallback strategy
Contexto actual:
- `claude-mem` worker puede estar `running` mientras Chroma falle (`CHROMA_SYNC`, `MCP error -32000`).
- En ese estado, semantic search no es confiable.

Estrategia operativa estable en este repo:
1. Intentar consulta normal de memoria.
2. Si aparece `CHROMA_SYNC` o `MCP error -32000`, usar recuperacion por titulo exacto (keyword path), no semantic.
3. Priorizar lectura de memoria: `Casa Scarlatta - Project Knowledge Base`.

Comando base (PowerShell) para fallback por titulo exacto:
```powershell
$status = npx claude-mem status
$port = ($status | Select-String -Pattern 'Port:\s*(\d+)').Matches[0].Groups[1].Value
$q = [uri]::EscapeDataString('Casa Scarlatta - Project Knowledge Base')
Invoke-RestMethod -Uri "http://127.0.0.1:$port/api/search?query=$q&limit=50" -Method Get
```

Politica:
- No depender de semantic search para decisiones criticas hasta reparar Chroma.
- Para memoria de proyecto, usar siempre titulo exacto anterior como fuente primaria de contexto.

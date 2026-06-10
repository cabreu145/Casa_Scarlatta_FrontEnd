# AI_MEMORY_USAGE.md

## Estado Actual De Claude-Mem
Fecha: 2026-05-28

- Worker: operativo (`npx claude-mem status` muestra `running`).
- Chroma/MCP: inestable por `CHROMA_SYNC` y `MCP error -32000: Connection closed`.
- Impacto: semantic search puede fallar o devolver resultados incompletos.

## Que Funciona
- Servicio `claude-mem` responde estado.
- Fallback por keyword via API `/api/search` funciona.
- Recuperacion de memoria conocida por titulo exacto funciona con:
  - `Casa Scarlatta - Project Knowledge Base`

## Que No Funciona
- Semantic search sobre Chroma no es confiable mientras persista `-32000`.
- Flujos que dependen de embedding/vector retrieval pueden caer o degradar.

## Recuperar Memoria Por Titulo Exacto
Objetivo: evitar semantic search y forzar lookup por cadena exacta del titulo.

PowerShell:
```powershell
$status = npx claude-mem status
$port = ($status | Select-String -Pattern 'Port:\s*(\d+)').Matches[0].Groups[1].Value
$title = 'Casa Scarlatta - Project Knowledge Base'
$q = [uri]::EscapeDataString($title)
$resp = Invoke-RestMethod -Uri "http://127.0.0.1:$port/api/search?query=$q&limit=50" -Method Get
$resp | ConvertTo-Json -Depth 8
```

Validacion esperada:
- Respuesta con `Found 1 result(s)` y linea con titulo exacto.
- Si hay multiples resultados, seleccionar el que coincida exactamente con `Title`.

## Como Actualizar Knowledge Base
Politica de actualizacion (sin depender de semantic search):
1. Leer `PROJECT_CONTEXT.md` y `CHANGE_CONTEXT.md`.
2. Consolidar cambios relevantes de arquitectura/stack/flujo/deuda.
3. Guardar actualizacion de memoria manteniendo titulo canonico:
   - `Casa Scarlatta - Project Knowledge Base`
4. Verificar recuperacion por titulo exacto con comando anterior.

## Advertencia Operativa
- No depender de semantic search hasta reparar Chroma.
- Para contexto tecnico/funcional de Casa Scarlatta, usar fallback por titulo exacto como ruta primaria.

## Comandos Utiles De Diagnostico
```powershell
# Estado worker
npx claude-mem status

# Logs recientes del worker (ajusta fecha si aplica)
Get-Content "$HOME/.claude-mem/logs/claude-mem-2026-05-28.log" -Tail 200

# Probe profundo Chroma (usa puerto real)
$status = npx claude-mem status
$port = ($status | Select-String -Pattern 'Port:\s*(\d+)').Matches[0].Groups[1].Value
Invoke-RestMethod -Uri "http://127.0.0.1:$port/api/chroma/status?deep=1" -Method Get | ConvertTo-Json -Depth 8

# Consulta que normalmente activa semantic search (puede fallar con -32000)
npx claude-mem search "¿Cuál es el contexto técnico y funcional de Casa Scarlatta?"
```

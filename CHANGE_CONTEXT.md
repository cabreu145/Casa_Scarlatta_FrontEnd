# CHANGE_CONTEXT.md

## Delta Detectado (Memoria Persistida vs Estado Actual Del Repositorio)

Fecha: 2026-05-28

## Resumen
No se detectaron cambios estructurales en arquitectura funcional core (SPA React/Vite, flujo de reservas, deuda de integracion backend) respecto a la memoria persistida.

Si se detecto delta en la raiz del repositorio: adicion de artefactos de skills/reglas multi-agente asociados a instalacion de Caveman.

## Cambios Encontrados
- Nuevos artefactos en raiz (actualmente untracked en git):
  - `.agents/`
  - `.cursor/`
  - `.windsurf/`
  - `.clinerules/`
  - `.opencode/`
  - `.github/`
  - `AGENTS.md`
  - `skills-lock.json`
- Regla activa en `AGENTS.md`: estilo de interaccion "caveman".

## Impacto
- No cambia la logica de negocio del frontend ni el stack core.
- Si afecta contexto operativo de agentes/assistants y puede influir en colaboracion automatizada.
- Puede introducir ruido documental/operativo si no se define politica de versionado de estos artefactos.

## Acciones Aplicadas
- `PROJECT_CONTEXT.md` actualizado para reflejar:
  - presencia de carpetas de tooling/skills en raiz.
  - convencion operativa caveman en `AGENTS.md`.
  - riesgo adicional de gobernanza por artefactos multi-agente.

## Memoria Actualizada
Se agrego memoria delta sobre:
- artefactos caveman/skills en raiz.
- ausencia de cambios en arquitectura funcional core.

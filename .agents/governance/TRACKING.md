# 📊 TABLERO DE CONTROL Y SEGUIMIENTO EN VIVO (TRACKING)
## PROYECTO: StarCorsair — MMORPG Espacial sobre Superficie Planetaria

**Metodología:** Spec-Driven Development (SDD) & Git Flow  
**Documento Rector:** [ARCHITECTURE.md](../../ARCHITECTURE.md)  
**Compendio Maestro:** [COMPENDIO_SPEC.md](COMPENDIO_SPEC.md)  
**Diagnóstico Inicial:** [AUDITORIA_HALLAZGOS.md](../../AUDITORIA_HALLAZGOS.md)  
**Supervisor / Product Owner:** Humano  
**Servicios Locales de Inspección (cuando inicie el desarrollo):**
- Cliente 3D (Vite + R3F): `http://localhost:5173`
- Servidor Autoritativo (Colyseus): `http://localhost:2567`
- Base de Datos (PostgreSQL / Docker): `localhost:5432`

**Última Actualización:** 2026-11-19

---

## 📈 RESUMEN GENERAL DE PROGRESO

```text
PROGRESO GLOBAL DEL PROYECTO: [░░░░░░░░░░░░░░░░░░░░] 0% (0 / 0 Tareas de Código)

• PREPARACIÓN (Fase 1 — Saneamiento .agents/):      [██████████] 100% (4/4 Pasos) ➔ ESTADO: CERRADO ✅
• PREPARACIÓN (Fase 2 — ARCHITECTURE.md v1.1):      [██████████] 100% (5/5 Reglas) ➔ ESTADO: CERRADO ✅
• PREPARACIÓN (Fase 3 — Monorepo & Git Flow):       [░░░░░░░░░░]   0% (Pendiente) ➔ ESTADO: SIGUIENTE ⏳
• SPRINT 1 (Vertical Slice Autoritativo):           [░░░░░░░░░░]   0% (Por definir) ➔ ESTADO: PENDIENTE ⏳
```

---

## 🧹 FASE 1 (Pre-Sprint): Saneamiento del Ecosistema `.agents/`
* **Meta:** Eliminar contaminación de proyectos anteriores, resolver conflictos normativos y alinear reglas, roles, skills y plantillas exclusivamente a **StarCorsair** y `ARCHITECTURE.md`.
* **Estado:** 🟢 **COMPLETADO (4 / 4 Pasos)**

- [x] **Paso 1.1:** Purga de `respuestas/sprint_0_hardening/`, `respuestas/sprint_1_mejoras/`, regla conflictiva `sdd_workflow.md` y rol duplicado `03_arquitecto_frontend_react.md`; reparación de `respuestas/README.md`.
- [x] **Paso 1.2:** Alineación de `02_sdd_consultative_workflow.md`, `03_tracking_gates_protocol.md`, `template/README_SETUP.md` y `skills/software-architect/SKILL.md`.
- [x] **Paso 1.3:** Reescritura de `roles/README.md` y los 9 roles del Squad para el dominio MMORPG 3D.
- [x] **Paso 1.4:** Actualización de plantillas multi-servicio (`template/`) y reinicio limpio de `COMPENDIO_SPEC.md` y `TRACKING.md` en `0%` de código.

---

## 🏗️ FASE 2 (Pre-Sprint): Refinamiento de `ARCHITECTURE.md` (v1.1)
* **Meta:** Cerrar los 5 vacíos de producción MMORPG detectados en `MOD-03` antes de crear el monorepo.
* **Estado:** 🟢 **COMPLETADO (5 / 5 Reglas integradas)**

- [x] **Regla 7:** Terreno planetario determinista compartido en `/shared/src/terrain/` (`getTerrainHeight`).
- [x] **Regla 8:** Capa Adapter `@colyseus/schema` en `/server/src/schemas/` sin acoplar `/shared`.
- [x] **Regla 9:** Política RAM (ticks 20–30 Hz) vs PostgreSQL/Prisma transaccional (prohibido Prisma dentro del tick loop).
- [x] **Regla 10:** Autenticación JWT en `onAuth`, bloqueo de sesión única por `pilotId` y rate-limiting/anti-cheat WebSocket.
- [x] **Regla 11:** Presupuesto de red (throttling de inputs a 20–30 Hz) y partición espacial AOI en `/shared/src/spatial/`.

---

## 📋 PRÓXIMOS BLOQUES (Aprobación Paso a Paso)
- [ ] **Fase 3 — Cimientos del Monorepo & Git Flow:** `.gitignore`, inicialización Git Flow (previa autorización), workspaces (`/shared`, `/server`, `/client`), `tsconfig.base.json`, ESLint con fronteras de importación, Vitest y `docker-compose.yml` (PostgreSQL).
- [ ] **Sprint 1 — Vertical Slice Server-Authoritative:** Definir backlog atómico `TSK-XX` tras aprobar Fase 3.

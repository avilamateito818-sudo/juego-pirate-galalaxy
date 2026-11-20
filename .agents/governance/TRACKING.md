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
PROGRESO GLOBAL DEL PROYECTO: [██████████░░░░░░░░░░] 50% (Sprint 1 Completo — Esperando Gate 1)

• PREPARACIÓN (Fase 1 — Saneamiento .agents/):      [██████████] 100% (4/4 Pasos)  ➔ ESTADO: CERRADO ✅
• PREPARACIÓN (Fase 2 — ARCHITECTURE.md v1.1):      [██████████] 100% (5/5 Reglas) ➔ ESTADO: CERRADO ✅
• PREPARACIÓN (Fase 3 — Monorepo & Git Flow):       [██████████] 100% (3/3 Pasos)  ➔ ESTADO: CERRADO ✅
• SPRINT 1 (Vertical Slice Jugable — Kalabesh):     [██████████] 100% (3/3 Tareas) ➔ ESTADO: CERRADO & APROBADO ✅
• SPRINT 2 (Auth JWT, Sesión Única & Prisma DB):    [░░░░░░░░░░]   0% (0/3 Tareas) ➔ ESTADO: SIGUIENTE ⏳
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

## 📦 FASE 3 (Pre-Sprint): Cimientos del Monorepo & Git Flow (`TSK-00`)
* **Meta:** Inicializar Git Flow (`main`, `release`, `develop`), conectar remoto y construir el esqueleto compilable y probado del monorepo (`/shared`, `/server`, `/client`).
* **Estado:** 🟢 **COMPLETADO & VERIFICADO (`build` ✅ | `lint` ✅ | `test` 6/6 ✅)**
* **Rama:** `feature/TSK-00-monorepo-scaffold` *(pendiente de autorización de commit/merge a `develop`)*

- [x] **Paso 3.1:** Auditoría de herramientas locales (`node v24.14.1`, `npm 11.11.0`, `git 2.56.1`, `docker 29.8.2`) y creación de `.gitignore`.
- [x] **Paso 3.2:** Inicialización de Git Flow (`main`, `release`, `develop`), conexión de `origin` y push inicial autorizado.
- [x] **Paso 3.3:** Esqueleto completo del monorepo (`npm workspaces`, `tsconfig.base.json`, `eslint.config.mjs` con fronteras automáticas, `docker-compose.yml`, `.env.example`, `@starcorsair/shared`, `@starcorsair/server` con Colyseus + Prisma, `@starcorsair/client` con R3F + Tailwind + Zustand).

---

## 🏃‍♂️ SPRINT 1: Vertical Slice Server-Authoritative (Kalabesh)
* **Meta:** Vuelo 3D multijugador sincronizado con Colyseus, enemigos IA con Target-Lock, combate autoritativo (`1–8`), drops de crionita/energía/planos y Hangar Orbital.
* **Estado:** 🟢 **CERRADO & APROBADO ✅ (`build` ✅ | `lint` ✅ | `test` 10/10 ✅ | `43/43 módulos` ✅)**
* **Puerta Humana (Gate 1):** 🔓 Abierta y aprobada por el Humano el 2026-11-19.

- [x] **`[TSK-01]`** Conexión Colyseus en vivo, nave 3D estilizada (`ShipMesh`), campo estelar puro (`Starfield`), vuelo WASD/Shift predicho + reconciliado con `@starcorsair/shared` e interpolación multijugador (`PlayerController`, `planetClient`).
- [x] **`[TSK-02]`** Enemigos IA Mantis (Explorador, Interceptor, Cosechador) con `stepEnemyAI` puro en `/shared`, Target-Lock (clic o `Tab`) + Target Frame + Radar táctico, habilidades autoritativas (`1` Bláster, `3` Reparador, `4` Postquemador, `5` Escudo, `6` Cohete, `7` Pulso EMP) con energía/cooldowns en `/server`, rayos láser/ondas/explosiones 3D y audio procedural Web Audio.
- [x] **`[TSK-03]`** Drops autoritativos de Crionita, Orbes de Energía y Planos al destruir enemigos + `2` Colector Gravitacional + `8` Órbita / Hangar con 3 naves desbloqueables (`Vega Interceptor`, `Vega Storm-X`, `Vega Bastion Heavy`) validadas en `/server`.

---

## 🧭 SPRINT 2 (Segunda Mitad — Producción & Persistencia Real):
* **Meta:** Conectar autenticación JWT, bloqueo de sesión única por piloto, persistencia transaccional en PostgreSQL con Prisma, misiones y segundo planeta/sistema.
* **Estado:** ⏳ **PENDIENTE (Esperando apertura de Gate 1)**

- [ ] **`[TSK-04]`** Auth JWT (Registro/Login) + verificación en `onAuth` de Colyseus + bloqueo de sesión única por `pilotId` (Regla 10).
- [ ] **`[TSK-05]`** Persistencia transaccional en PostgreSQL vía Prisma (crionita, planos, naves compradas, autosave y `onLeave` fuera del tick loop — Regla 9) + `prisma/seed.ts`.
- [ ] **`[TSK-06]`** Sistema de Misiones de Kalabesh + segundo planeta / mapa estelar + despliegue Docker productivo.

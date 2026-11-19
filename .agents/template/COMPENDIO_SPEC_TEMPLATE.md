# COMPENDIO MAESTRO DE ESPECIFICACIÓN TÉCNICA (SPEC)
## PROYECTO: StarCorsair — [Nombre del Sprint / Versión]

**Versión:** 0.1.0-DRAFT  
**Fecha:** [YYYY-MM-DD]  
**Documento Rector:** [ARCHITECTURE.md](../../ARCHITECTURE.md)  
**Árbitro & Autor:** CTO Lead (`StarCorsair-CTO-Lead`)  
**Aprobador:** Product Owner Humano  

---

## 1. Resumen Ejecutivo y Alcance
* **Tipo de Juego:** MMORPG de combate espacial en tercera persona sobre superficie planetaria y órbita (sucesor moderno de *Pirate Galaxy*).
* **Objetivo del Ciclo / MVP:** [Descripción concreta del hito jugable y verificable]
* **Fuera de Alcance en este Ciclo:** [Qué queda explícitamente diferido para evitar *scope creep*]

---

## 2. Matriz de Decisiones del Squad (`.agents/governance/respuestas/<nombre_sprint>/`)
| Disciplina | Rol Responsable | Entregable del Sprint | Estado |
| :--- | :--- | :--- | :---: |
| **Game Design & Negocio** | `StarCorsair-Product-Owner` | `respuestas/<sprint>/respuesta_requerimientos_negocio.md` | ⏳ Pendiente |
| **Planificación Ágil** | `StarCorsair-Scrum-Master` | `respuestas/<sprint>/respuesta_scrum_master.md` | ⏳ Pendiente |
| **Backend & `/shared`** | `StarCorsair-Backend-Architect` | `respuestas/<sprint>/respuesta_arquitecto_software.md` | ⏳ Pendiente |
| **Frontend 3D** | `StarCorsair-Frontend-Architect` | `respuestas/<sprint>/respuesta_arquitecto_frontend.md` | ⏳ Pendiente |
| **UI/UX Sci-Fi HUD** | `StarCorsair-UIUX-Designer` | `respuestas/<sprint>/respuesta_disenador_ui_ux.md` | ⏳ Pendiente |
| **Infraestructura & DevOps** | `StarCorsair-DevOps-Engineer` | `respuestas/<sprint>/respuesta_ingeniero_devops.md` | ⏳ Pendiente |
| **QA & Anti-Cheat** | `StarCorsair-QA-Security-Auditor` | `respuestas/<sprint>/respuesta_auditor_qa_seguridad.md` | ⏳ Pendiente |

---

## 3. Ficha Técnica del Monorepo
* **`/shared`:** TypeScript estricto puro (tipos, constantes de armas/naves/planetas, fórmulas deterministas de combate, movimiento y terreno).
* **`/server`:** Node.js + TypeScript + Colyseus (salas autoritativas a tick fijo) + PostgreSQL con Prisma ORM.
* **`/client`:** React + Vite + TailwindCSS + React Three Fiber / Three.js + Zustand + `colyseus.js`.
* **Testing & Calidad:** Vitest (pruebas deterministas en `/shared` e integración en `/server`) + ESLint con reglas de fronteras.

---

## 4. Arquitectura Tiempo Real y Flujo Autoritativo
```text
[/client: React Three Fiber + Zustand]
     │  1. Predicción local con /shared (inputSeq)
     │  2. Envío throttled de Inputs (WebSocket / Colyseus)
     ▼
[/server: Colyseus Room — Fixed Timestep 20–30 Hz]
     │  3. Validación Anti-Cheat + Simulación pura vía /shared
     │  4. Sincronización delta (@colyseus/schema adapter)
     ├──► Snapshots autoritativos + lastProcessedSeq ──► [/client: Reconciliación & Interpolación]
     ▼  5. Solo eventos críticos / transacciones económicas / autosave
[PostgreSQL vía Prisma ORM]
```

---

## 5. Contratos de Red, Persistencia y Terreno
* **Mensajes WebSocket (Colyseus):** [Lista de comandos cliente→servidor y eventos servidor→cliente]
* **Estado en RAM vs PostgreSQL:** [Qué vive en memoria de sala y qué se persiste en transacciones Prisma]
* **Terreno Planetario Determinista:** [Parámetros/función compartida en `/shared/src/terrain/`]

---

## 6. Convenciones de Desarrollo y Git Flow
* **Ramas Permanentes:** `main` (producción), `release` (staging), `develop` (integración continua).
* **Ramas Efímeras Atómicas:** `feature/TSK-XX-<slug>` nacidas de `develop` (nunca commits directos sobre ramas principales).
* **Autorización Git:** Prohibido `git add .`, `commit`, `push` o `merge` sin consulta y aprobación previa del Humano.

---

## 7. Dictamen Final del CTO
* **Veredicto Técnico:** `[BORRADOR / PENDIENTE DE APROBACIÓN]`
* **Condición para Inicio de Código:** Aprobación explícita del Product Owner Humano.

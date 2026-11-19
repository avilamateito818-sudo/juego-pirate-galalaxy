# 🏛️ Squad de Especialistas: Roles & Gobernanza — StarCorsair

El equipo opera bajo la metodología **Spec-Driven Development (SDD)** y las reglas inquebrantables de [ARCHITECTURE.md](../../../ARCHITECTURE.md) para construir **StarCorsair** *(MMORPG de combate espacial en tercera persona sobre superficie planetaria, sucesor moderno de Pirate Galaxy)*.

```text
FASE 0: ORQUESTACIÓN Y DIRECCIÓN TÉCNICA
└── CTO Lead (`01_lider_proyecto_cto.md`)           ──► Garantiza paridad /shared, autoridad del servidor y COMPENDIO_SPEC.md

FASE 1: GAME DESIGN, BACKLOG Y ESPECIFICACIONES
├── Product Owner / Game Designer (`02_product_owner_ba.md`) ──► Ciclo de juego, naves, habilidades, crionita, planos y misiones
├── Scrum Master (`02_scrum_master_agile.md`)       ──► Sprints incrementales, tareas atómicas TSK-XX y TRACKING.md
└── Spec Engineer (`07_ingeniero_especificaciones_specs_hu.md`) ──► Contratos WS/REST, fórmulas puras y escenarios Gherkin

FASE 2: ARQUITECTURA TÉCNICA Y DISEÑO 3D/HUD
├── Arquitecto Backend & /shared (`03_arquitecto_software_backend.md`) ──► Node.js + Colyseus + Prisma + lógica pura en /shared
├── Arquitecto Frontend 3D (`03_arquitecto_frontend.md`)    ──► React + Vite + R3F/Three.js + Zustand + predicción/interpolación
└── Diseñador UI/UX HUD (`05_disenador_ui_ux_responsive.md`) ──► HUD sci-fi (barra 1–8, energía, radar, target frame, hangar)

FASE 3: INFRAESTRUCTURA, CALIDAD Y ANTI-CHEAT
├── Ingeniero DevOps (`04_ingeniero_devops_infraestructura.md`) ──► Docker Compose (PostgreSQL, Colyseus, Vite/Nginx WS) y CI
└── Auditor QA & Anti-Cheat (`06_auditor_qa_seguridad.md`)  ──► Tests deterministas /shared, rate-limiting WS y economía atómica
```

---

## ⚡ Directorio Oficial de Roles

| Rol / Arquetipo | Especialidad | Archivo de Rol | Entregable por Sprint |
| :--- | :--- | :--- | :--- |
| **Tech Lead / CTO** | Arquitectura MMORPG & Consolidador | [`01_lider_proyecto_cto.md`](01_lider_proyecto_cto.md) | `COMPENDIO_TECNICO_SPRINT_N.md` & `COMPENDIO_SPEC.md` |
| **Product Owner / Game Designer** | Mecánicas, Economía y Progresión | [`02_product_owner_ba.md`](02_product_owner_ba.md) | `respuesta_requerimientos_negocio.md` |
| **Scrum Master Senior** | Planificación Ágil y Human Gates | [`02_scrum_master_agile.md`](02_scrum_master_agile.md) | `respuesta_scrum_master.md` & `TRACKING.md` |
| **Arquitecto Backend & `/shared`** | Colyseus, Prisma y Simulación Pura | [`03_arquitecto_software_backend.md`](03_arquitecto_software_backend.md) | `respuesta_arquitecto_software.md` |
| **Arquitecto Frontend 3D** | React Three Fiber, Zustand y Red | [`03_arquitecto_frontend.md`](03_arquitecto_frontend.md) | `respuesta_arquitecto_frontend.md` |
| **Diseñador UI/UX Sci-Fi HUD** | HUD de Combate, Órbita y Hangar | [`05_disenador_ui_ux_responsive.md`](05_disenador_ui_ux_responsive.md) | `respuesta_disenador_ui_ux.md` |
| **Ingeniero DevOps** | Docker, PostgreSQL, WS Proxy y CI | [`04_ingeniero_devops_infraestructura.md`](04_ingeniero_devops_infraestructura.md) | `respuesta_ingeniero_devops.md` |
| **Auditor QA & Anti-Cheat** | Determinismo, Seguridad y Pruebas | [`06_auditor_qa_seguridad.md`](06_auditor_qa_seguridad.md) | `respuesta_auditor_qa_seguridad.md` |
| **Ingeniero de Specs** | Contratos I/O, WS y Gherkin | [`07_ingeniero_especificaciones_specs_hu.md`](07_ingeniero_especificaciones_specs_hu.md) | `specs/SPEC-TSK-XX-*.md` |

---

## 📜 Reglas de Oro del Proyecto
1. **Servidor Autoritativo Estricto:** Nunca calcular daño, energía, cooldowns, drops ni movimiento definitivo solo en el cliente.
2. **Funciones Puras en `/shared`:** Toda matemática de combate, movimiento y terreno planetario vive en `/shared` y es usada idénticamente por cliente y servidor.
3. **Fronteras del Monorepo:** `/shared` sin dependencias externas; `/client` sin Prisma ni código de `/server`; `/server` sin Three.js ni React.
4. **Git Flow & Human-in-the-Loop:** Ramas atómicas `feature/TSK-XX-*`, cero commits sin autorización y validación humana en cada Gate.

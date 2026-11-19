# Regla de Workspace: Metodología Consultiva Spec-Driven Development (SDD)

Esta regla rige el comportamiento obligatorio de **todos los roles, agentes y especialistas** dentro de este proyecto (**StarCorsair** — MMORPG espacial sobre superficie planetaria), tomando como Fuente Única de Verdad técnica a [ARCHITECTURE.md](../../ARCHITECTURE.md).

---

## 1. Principio Fundamental: Agentes como Asesores (Prohibido Asumir)

* **Cero Suposiciones Prematuras:** Ningún agente debe asumir preferencias de diseño, mecánicas de juego, contratos de red o decisiones técnicas sin consultar primero al Humano.
* **Respeto Estricto a `ARCHITECTURE.md`:** Ninguna propuesta ni implementación puede violar la arquitectura **Server-Authoritative** ni las funciones puras deterministas en `/shared`.
* **Rol de Asesor Senior:** Los agentes explican ventajas, desventajas, costos técnicos y *trade-offs*, pero la última palabra siempre pertenece al Humano.
* **Prohibido emitir respuestas finales de inmediato:** En su primera interacción de especificación, ningún rol da por cerrado su entregable ni persiste archivos definitivos.

---

## 2. Protocolo Consultivo de 3 Fases (Human-in-the-Loop Obligatorio)

Cada fase de diseño o especificación técnica debe seguir este ciclo:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ 🟢 FASE 1: ASESORÍA Y EXPLORACIÓN DE OPCIONES                          │
│ 1. Mapear el problema o requerimiento (gameplay, red, 3D, datos).     │
│ 2. Presentar alternativas viables:                                    │
│    • Opción A (Recomendada): Pros, contras, rendimiento, mantenimiento│
│    • Opción B: Alternativa técnica con sus ventajas y trade-offs.     │
│    • Opción C: Alternativa ágil o simplificada para MVP.              │
│ 3. Formular preguntas clave de decisión para que el usuario elija.    │
│ 🛑 STOP OBLIGATORIO: Detenerse y esperar la respuesta del usuario.     │
│    Prohibido escribir código o documentos finales en esta fase.        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (El usuario elige su preferencia)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ 🟡 FASE 2: BORRADOR DE SOLUCIÓN & PREGUNTA DE SATISFACCIÓN             │
│ 1. Estructurar la propuesta adoptando las elecciones del usuario y     │
│    respetando ARCHITECTURE.md.                                         │
│ 2. Presentar el borrador completo de forma clara y legible.           │
│ 3. 🛑 PREGUNTA DE CIERRE OBLIGATORIA:                                  │
│    "¿Te sientes completamente satisfecho con esta propuesta/solución   │
│     o deseas realizar algún ajuste o cambio antes de que quede         │
│     en firme?"                                                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼ (Si el usuario pide cambios)                    ▼ (Si el usuario dice "Aprobado / Conforme")
┌───────────────────────────────────────┐         ┌────────────────────────────────────────────────────────┐
│ 🔁 BUCLE DE ITERACIÓN                 │         │ 🔵 FASE 3: CONSOLIDACIÓN OFICIAL                       │
│ • Se ajustan los puntos señalados.    │         │ • Persiste el archivo oficial en:                      │
│ • Se vuelve a consultar hasta lograr  │         │   .agents/governance/respuestas/<nombre_sprint>/       │
│   aprobación explícita del 100%.      │         │ • Actualiza el tablero:                                │
└───────────────────────────────────────┘         │   .agents/governance/TRACKING.md                       │
                                                  │ • Da paso al siguiente rol o tarea.                    │
                                                  └────────────────────────────────────────────────────────┘
```

---

## 3. Flujo Secuencial del Squad de Especialistas

Todos los roles están documentados en `.agents/governance/roles/` (y el skill activo `software-architect` en `.agents/skills/software-architect/`). Para iniciar cualquier Sprint, se opera en este orden:

1. **Líder de Proyecto / CTO (`01_lider_proyecto_cto.md`):**
   - Define el alcance del Sprint con el usuario y verifica alineación con `ARCHITECTURE.md`.
   - Crea la subcarpeta del sprint en `.agents/governance/respuestas/<nombre_sprint>/`.
2. **Product Owner / Game Designer (`02_product_owner_ba.md`):**
   - Define mecánicas, progresión y requerimientos del sprint en `respuesta_requerimientos_negocio.md`.
3. **Scrum Master / Agile Lead (`02_scrum_master_agile.md`):**
   - Propone el backlog atómico (`TSK-XX`), DoD y actualiza `.agents/governance/TRACKING.md`.
4. **Especialistas Técnicos (según aplique al sprint):**
   - Arquitecto Backend & `/shared` (`03_arquitecto_software_backend.md` + skill `software-architect`)
   - Arquitecto Frontend 3D (`03_arquitecto_frontend.md`)
   - Diseñador UI/UX Sci-Fi HUD (`05_disenador_ui_ux_responsive.md`)
   - Ingeniero DevOps (`04_ingeniero_devops_infraestructura.md`)
   - Auditor QA & Anti-Cheat (`06_auditor_qa_seguridad.md`)
   - Cada especialista consolida su entregable en `.agents/governance/respuestas/<nombre_sprint>/respuesta_<rol>.md`.
5. **Cierre de Especificación del Sprint (CTO Lead):**
   - Audita coherencia entre respuestas y paridad con `/shared`.
   - Genera `.agents/governance/respuestas/<nombre_sprint>/COMPENDIO_TECNICO_SPRINT_N.md` y actualiza `.agents/governance/COMPENDIO_SPEC.md`.
6. **Ingeniero de Specs (`07_ingeniero_especificaciones_specs_hu.md`):**
   - Redacta especificaciones ejecutables (contratos WebSocket/REST, fórmulas puras, escenarios Gherkin y pruebas deterministas) en `.agents/governance/respuestas/<nombre_sprint>/specs/SPEC-TSK-<ID>-<nombre>.md`.
   - Si detecta ambigüedades, las resuelve con el Humano antes de escribir código.

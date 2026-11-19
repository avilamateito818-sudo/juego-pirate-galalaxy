# 📊 TABLERO DE CONTROL Y SEGUIMIENTO EN VIVO (TRACKING)
## PROYECTO: StarCorsair — MMORPG Espacial sobre Superficie Planetaria

**Metodología:** Spec-Driven Development (SDD) & Git Flow  
**Documento Rector:** [ARCHITECTURE.md](../../ARCHITECTURE.md)  
**Supervisor / Product Owner:** Humano  
**Equipo de Desarrollo:** Squad de Especialistas IA  
**Servicios Locales de Inspección:**
- Cliente 3D (Vite + R3F): `http://localhost:5173`
- Servidor Autoritativo (Colyseus): `http://localhost:2567`
- Base de Datos (PostgreSQL / Docker): `localhost:5432`

**Última Actualización:** [YYYY-MM-DD]

---

## 📈 RESUMEN GENERAL DE PROGRESO

```text
PROGRESO GLOBAL DEL PROYECTO: [░░░░░░░░░░░░░░░░░░░░] 0% (0 / 0 Tareas)

• SPRINT 0 (Cimientos del Monorepo & DB):           [░░░░░░░░░░] 0% (0/0) ➔ ESTADO: PENDIENTE ⏳
• SPRINT 1 (Vertical Slice: /shared + Vuelo 3D):    [░░░░░░░░░░] 0% (0/0) ➔ ESTADO: PENDIENTE ⏳
• SPRINT 2 (Combate 1–8, Energía e IA):             [░░░░░░░░░░] 0% (0/0) ➔ ESTADO: PENDIENTE ⏳
• SPRINT 3 (Loot, Crionita, Planos & Hangar DB):    [░░░░░░░░░░] 0% (0/0) ➔ ESTADO: PENDIENTE ⏳
```

---

## 🏃‍♂️ SPRINT 0: Cimientos del Monorepo, Fronteras y PostgreSQL
* **Meta:** [Describir la meta tangible y verificable del Sprint]
* **Estado del Sprint:** ⏳ **PENDIENTE**
* **Puerta Humana (Gate 0):** 🔒 *Bloqueada. Requiere validación local del Humano al finalizar todas las tareas.*

### Tareas Atómicas del Sprint 0:
- [ ] **`[TSK-01]`** [Descripción de la tarea]  
  *Paquete:* `/shared` | *Rama:* `feature/TSK-01-<slug>` | *Rol:* `StarCorsair-Backend-Architect` | *Estado:* Pendiente

---

## 🚪 PROTOCOLO DE PUERTAS HUMANAS (HUMAN GATES)

Al completar la última tarea de cada Sprint:
1. La IA detiene la ejecución autónoma.
2. Se verifica que los tests deterministas de `/shared` (Vitest) y el chequeo de tipos/fronteras estén en verde.
3. Los servicios locales aplicables quedan operativos (`:5173`, `:2567`, `:5432`).
4. La IA presenta el checklist de inspección visual y de red para validación del Humano.
5. Tras la aprobación humana, se registra:
   `Puerta Humana (Gate N): 🔓 Abierta y aprobada por el Humano el YYYY-MM-DD.`

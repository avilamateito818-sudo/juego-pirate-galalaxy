# Regla de Workspace: Protocolo de Tablero TRACKING en Vivo & Human Verification Gates

Esta regla rige el control de avance y la supervisión humana en este proyecto (**StarCorsair**):

---

## 1. El Tablero de Control Dinámico (`.agents/governance/TRACKING.md`)

El proyecto mantiene su archivo de seguimiento en vivo en:
`.agents/governance/TRACKING.md`

### Estructura Mandatoria del Tablero:
1. **Barra de Progreso ASCII Global:** Indicador visual dinámico del avance del proyecto:
   ```text
   PROGRESO GLOBAL: [████████████░░░░░░░░] 60% (12 / 20 Tareas)
   ```
2. **Resumen de Sprints:** Estado de cada ciclo (`PENDIENTE`, `EN PROGRESO`, `CERRADO & APROBADO ✅`).
3. **Tareas Atómicas (`TSK-XX`) con Criterios de Aceptación:** Cada tarea tiene su checkbox (`[ ]` o `[x]`), descripción clara, paquete/archivos afectados (`/shared`, `/server`, `/client`) y rol responsable.
4. **Actualización en Tiempo Real:** Se actualiza `TRACKING.md` inmediatamente después de completar cada tarea atómica.

---

## 2. Human Verification Gates (Puertas de Validación Humana)

Al finalizar la última tarea de cada Sprint, se activa obligatoriamente un **Human Verification Gate**:

```text
[Sprint N en Desarrollo] ──► [Última Tarea Lista] ──► 🛑 HUMAN GATEKEEPER (PAUSA TOTAL)
                                                           │
                                                           ├─► 1. Servicios locales activos (Client + Server + DB)
                                                           ├─► 2. Tests deterministas de /shared en verde
                                                           ├─► 3. Checklist de inspección visual y de red
                                                           └─► 4. Pregunta de aprobación al Humano
                                                                     │
                                           ┌─────────────────────────┴────────────────────────┐
                                           ▼ (Si hay observaciones)                           ▼ (Si el Humano dice "Aprobado")
                               ┌─────────────────────────────┐                    ┌─────────────────────────────┐
                               │ Ajustes en Sprint N         │                    │ 🔓 Gate N Superado          │
                               │ Se itera en caliente        │                    │ Sprint N: CERRADO ✅        │
                               └─────────────────────────────┘                    │ Se habilita Sprint N+1      │
                                                                                  └─────────────────────────────┘
```

### Reglas Inviolables del Gate:
1. **Detención Obligatoria:** La IA **no puede iniciar tareas del siguiente Sprint** de forma autónoma.
2. **Entorno Local Operativo:** Los servicios aplicables al sprint deben estar operativos para inspección real del Humano:
   - Cliente 3D (Vite + R3F): `http://localhost:5173`
   - Servidor Autoritativo (Colyseus): `http://localhost:2567`
   - Base de Datos (PostgreSQL / Docker): `localhost:5432`
3. **Checklist de Verificación:** Se indican explícitamente las pruebas en pantalla (vuelo, combate, sincronización entre 2 pestañas, consola sin errores, tests de `/shared` pasando).
4. **Registro del Gate:** Cuando el Humano aprueba, se actualiza `TRACKING.md` marcando:
   `Puerta Humana (Gate N): 🔓 Abierta y aprobada por el Humano el YYYY-MM-DD.`

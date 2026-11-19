# 🧭 GUÍA INTERNA DEL ECOSISTEMA `.agents/` — PROYECTO STARCORSAIR

Este directorio `.agents/` organiza exclusivamente la gobernanza, reglas de desarrollo, roles del squad y seguimiento de **este proyecto** (MMORPG espacial sobre superficie planetaria), subordinado siempre a [ARCHITECTURE.md](../../ARCHITECTURE.md).

---

## 🛠️ 1. Estructura Actual de `.agents/`

```text
.agents/
├── rules/                               # Reglas obligatorias del workspace
│   ├── 01_git_flow_policy.md            # Git Flow (main/release/develop + feature/TSK-XX-*) y cero commits sin permiso
│   ├── 02_sdd_consultative_workflow.md  # Metodología Consultiva SDD (3 fases + orden de roles)
│   └── 03_tracking_gates_protocol.md    # Tablero TRACKING en vivo y Human Verification Gates
│
├── skills/                              # Skills técnicos activos en este workspace
│   └── software-architect/              # Arquitecto del monorepo MMORPG (/shared, Colyseus, Prisma, R3F)
│
├── governance/                          # Documentación viva de este proyecto
│   ├── TRACKING.md                      # Tablero en vivo con barras de progreso y Gates
│   ├── COMPENDIO_SPEC.md                # Especificación técnica maestra consolidada
│   ├── roles/                           # Fichas de rol del Squad adaptadas al MMORPG 3D
│   └── respuestas/                      # Histórico inmutable por sprint (respuestas/<nombre_sprint>/)
│
└── template/                            # Plantillas base para nuevos sprints/documentos de este proyecto
    ├── TRACKING_TEMPLATE.md
    ├── COMPENDIO_SPEC_TEMPLATE.md
    └── README_SETUP.md                  # Esta guía
```

---

## 📋 2. Ciclo de Trabajo por Sprint (Reglas Consistentes)

1. **Marco Técnico Inviolable:** Todo diseño y tarea respeta [ARCHITECTURE.md](../../ARCHITECTURE.md) (servidor autoritativo en `/server`, lógica pura determinista en `/shared`, render/predicción en `/client`).
2. **Inicio de Sprint:** Se crea la carpeta `.agents/governance/respuestas/<nombre_sprint>/` y cada rol involucrado aplica el protocolo consultivo de 3 fases antes de guardar su `respuesta_<rol>.md` dentro de esa subcarpeta.
3. **Compendio y Specs:** Al cerrar el diseño del sprint, se compila `COMPENDIO_TECNICO_SPRINT_N.md`, se actualiza `.agents/governance/COMPENDIO_SPEC.md` y se redactan las specs ejecutables en `respuestas/<nombre_sprint>/specs/SPEC-TSK-<ID>-<nombre>.md`.
4. **Desarrollo por Rama Atómica:** Cada tarea (`TSK-XX`) nace en su propia rama desde `develop`:
   `git checkout -b feature/TSK-XX-<slug> develop` *(nunca `feature/sprint-*`, y siempre pidiendo autorización humana antes de ejecutar comandos de Git).*
5. **Human Verification Gate:** Al terminar la última tarea del sprint, se levantan los servicios locales (`client` `:5173`, `server` `:2567`, `postgres` `:5432`), se ejecutan los tests de `/shared` y se espera aprobación explícita del Humano antes de continuar.

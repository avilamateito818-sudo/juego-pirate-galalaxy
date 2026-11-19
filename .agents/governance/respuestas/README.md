# 📁 Repositorio Histórico de Respuestas por Sprint (SSOT)

Este directorio almacena el histórico inmutable de respuestas de cada especialista, especificaciones ejecutables y compendios técnicos consolidados de cada Sprint para el proyecto **StarCorsair** *(nombre provisional — MMORPG de combate espacial sobre superficie planetaria)*.

---

## 🗂️ Estructura por Sprints

Para preservar el orden y evitar la sobreescritura entre ciclos, **cada Sprint cuenta con su propia subcarpeta** gestionada por el **CTO Lead**:

```text
.agents/governance/respuestas/
├── README.md                              # Este catálogo general
└── sprint_1_<nombre>/                     # Subcarpeta creada al iniciar el Sprint 1
    ├── respuesta_lider_proyecto.md
    ├── respuesta_requerimientos_negocio.md
    ├── respuesta_scrum_master.md
    ├── respuesta_arquitecto_software.md
    ├── respuesta_arquitecto_frontend.md
    ├── respuesta_disenador_ui_ux.md
    ├── respuesta_ingeniero_devops.md
    ├── respuesta_auditor_qa_seguridad.md
    ├── COMPENDIO_TECNICO_SPRINT_1.md      # Compendio consolidado del Sprint 1
    └── specs/
        └── SPEC-TSK-XX-<nombre>.md        # Especificaciones ejecutables (Gherkin + contratos)
```

---

## 🔄 Protocolo de Inicialización de un Nuevo Sprint

1. **Inicio con el CTO Lead:** Todo nuevo sprint inicia dialogando con el **CTO Lead** tomando como referencia inquebrantable [ARCHITECTURE.md](../../../ARCHITECTURE.md).
2. **Creación de Subcarpeta:** Se crea `.agents/governance/respuestas/<nombre_sprint>/`.
3. **Generación de Respuestas:** Cada rol consultado durante el sprint guarda su entregable aprobado dentro de dicha subcarpeta (nunca en la raíz de `respuestas/`).
4. **Consolidación del Compendio:** Al concluir la ronda de roles, se compila `COMPENDIO_TECNICO_SPRINT_N.md` dentro de la subcarpeta y se actualiza el compendio maestro global [COMPENDIO_SPEC.md](../COMPENDIO_SPEC.md).

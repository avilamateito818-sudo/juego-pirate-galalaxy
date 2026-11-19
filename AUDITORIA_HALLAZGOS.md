# AUDITORÍA TÉCNICA INTEGRAL & DIAGNÓSTICO DEL PROYECTO

- **Rol:** Desarrollador Senior / Principal Engineer (Toma de proyecto para puesta a punto hacia producción)
- **Fecha:** 2026-11-18
- **Workspace auditado:** `c:/Users/avima/Downloads/juego pirate/agents`
- **Alcance del barrido:** Inspección completa de todos los archivos actuales del repositorio (`ARCHITECTURE.md` y el ecosistema completo de `.agents/`: reglas, roles, skills, plantillas, gobernanza e históricos).
- **Estado de ejecución:** **Solo diagnóstico (sin modificaciones aplicadas).**

---

## 1. Resumen Ejecutivo

El repositorio se encuentra en **Fase 0 (pre-código)**: aún no existen los paquetes del monorepo (`/client`, `/server`, `/shared`), `package.json`, `docker-compose.yml` ni repositorio Git inicializado.

Sin embargo, el barrido completo de `.agents/` frente a `ARCHITECTURE.md` revela **5 fallas críticas**, **4 fallas moderadas** y **oportunidades clave de arquitectura y optimización** que **deben resolverse antes de escribir la primera línea de código**. Actualmente, `.agents/` contiene artefactos activos y contradictorios heredados de **dos proyectos externos distintos** (*El Bodegón de los Trajes* en PHP/Nginx y *CST Bodegón Trajes* en NestJS/Ant Design), lo que rompería la coherencia del desarrollo y violaría las reglas de `ARCHITECTURE.md` desde el primer sprint.

| Severidad | Cantidad | Estado Actual |
| :--- | :---: | :--- |
| 🔴 **Crítica (Bloqueante)** | 5 | Impiden arrancar el desarrollo de forma limpia y segura |
| 🟠 **Moderada (Riesgo Técnico)** | 4 | Generan deuda técnica, ambigüedades y retrabajo |
| 🟢 **Mejoras y Optimizaciones** | 7 | Clave para rendimiento 60 FPS, escalabilidad MMORPG y calidad en producción |

---

## 2. Fallas Críticas (Bloqueantes antes de Codificar)

### 🔴 CRIT-01 — Contaminación severa de dominio y mezcla de 2 proyectos ajenos en `.agents/`
- **Ubicación:**
  - `.agents/governance/COMPENDIO_SPEC.md`
  - `.agents/governance/TRACKING.md`
  - `.agents/governance/roles/*.md` (los 10 archivos de roles)
  - `.agents/governance/respuestas/` (30 archivos distribuidos en `sprint_0_hardening/` y `sprint_1_mejoras/` + 11 `SPEC-TSK-*.md`)
- **Hallazgo:**
  Dentro del workspace del MMORPG espacial conviven activos de **dos proyectos ajenos sin limpiar**:
  1. **El Bodegón de los Trajes (Tunja):** Landing + CRUD en **PHP 8.3 FPM + Nginx + HTML/Vanilla JS + JSON con `LOCK_EX`**. Incluso `TRACKING.md` reporta el proyecto como **100% completado (15/15 tareas)**.
  2. **CST Bodegón Trajes:** ERP/facturación en **NestJS 11 + TypeORM + React 19 + Ant Design 6**, con specs de cuadre de caja, métodos de pago, bots de WhatsApp y sistema de turnos.
- **Impacto:** Cualquier agente o desarrollador que consulte `.agents/` para guiarse tomará decisiones erróneas de negocio, stack y arquitectura. Además, el tablero `TRACKING.md` y el `COMPENDIO_SPEC.md` quedan inutilizables como Fuente Única de Verdad (SSOT).
- **Acción recomendada:** Purgar o archivar los 30 entregables históricos heredados en `respuestas/`, reiniciar `TRACKING.md` y `COMPENDIO_SPEC.md` para el MMORPG espacial, y reescribir los roles de `.agents/governance/roles/` al dominio de videojuegos en tiempo real.

---

### 🔴 CRIT-02 — Regla de workspace en conflicto directo con `ARCHITECTURE.md`
- **Ubicación:** `.agents/rules/sdd_workflow.md`
- **Hallazgo:**
  Esta regla impone explícitamente:
  - Proyecto: **CST BODEGÓN TRAJES**.
  - Backend: **NestJS 11 + TypeORM** (contradice `Node.js + Colyseus + Prisma` de `ARCHITECTURE.md`).
  - Frontend: **React 19 + Ant Design 6 + React Query** (contradice `React Three Fiber / Three.js + Zustand + TailwindCSS` de `ARCHITECTURE.md`).
  - SSOT: exige leer documentos inexistentes (`docs/Funcionalidades Release v1.0.md`, `docs/Auditoria_PRE_RELEASE_v1.0.md`, `docs/Plan-Desarrollo-Responsive.md`).
- **Impacto:** Conflicto normativo de primer nivel. Un agente siguiendo `.agents/rules/sdd_workflow.md` violaría automáticamente `ARCHITECTURE.md`.
- **Acción recomendada:** Eliminar la duplicidad entre `sdd_workflow.md` y `02_sdd_consultative_workflow.md`, dejando una sola regla SDD alineada 100% con `ARCHITECTURE.md` como SSOT técnico.

---

### 🔴 CRIT-03 — Ausencia de Git inicializado y de `.gitignore` frente a política estricta de Git Flow
- **Ubicación:** Raíz del proyecto y `.agents/rules/01_git_flow_policy.md`
- **Hallazgo:**
  La regla `01_git_flow_policy.md` exige operar con 3 ramas permanentes (`main`, `release`, `develop`) y ramas efímeras atómicas `feature/TSK-XX-*`, prohibiendo commits directos sobre ramas principales. Sin embargo, el directorio **no es un repositorio Git** (no existe `.git/`) ni cuenta con `.gitignore`.
- **Impacto:** Imposibilidad de aplicar Git Flow y alto riesgo de filtrar archivos sensibles (`.env`, credenciales de PostgreSQL, secretos JWT) o artefactos pesados (`node_modules/`, `dist/`, binarios Prisma) al inicializar el repositorio.
- **Acción recomendada:** Crear un `.gitignore` robusto para monorepo TypeScript/Vite/Prisma/Docker y, previa autorización humana (cumpliendo la regla 01), inicializar Git con el árbol `main` / `release` / `develop`.

---

### 🔴 CRIT-04 — Skills del Squad referenciados como obligatorios pero inexistentes en `.agents/skills/`
- **Ubicación:** `.agents/skills/` vs `.agents/rules/02_sdd_consultative_workflow.md` y `.agents/template/README_SETUP.md`
- **Hallazgo:**
  Las reglas exigen invocar secuencialmente 8 skills (`/tech-lead-cto`, `/product-owner-ba`, `/agile-scrum-lead`, `/software-architect`, `/frontend-architect`, `/uiux-responsive-designer`, `/devops-engineer`, `/qa-security-auditor`, `/spec-engineer`). En realidad, `.agents/skills/` **solo contiene `software-architect/SKILL.md`**, el cual además está diseñado para aplicaciones CRUD/REST (Spring Boot, Astro, JPA, REST/GraphQL) y **no contempla videojuegos 3D, simulación en tiempo real, Colyseus ni paquetes `/shared` deterministas**.
- **Impacto:** El protocolo SDD está roto estructuralmente: las reglas apuntan a skills que no existen y el único skill disponible introduce sesgo hacia arquitectura CRUD clásica en lugar de simulación en tiempo real Server-Authoritative.
- **Acción recomendada:** Definir qué roles se consolidarán como skills reales en `.agents/skills/` (o formalizar el uso directo de las fichas en `.agents/governance/roles/`) y adaptar `software-architect/SKILL.md` al paradigma monorepo + simulación autoritativa.

---

### 🔴 CRIT-05 — Ausencia de infraestructura base del Monorepo y alto riesgo de incompatibilidad de módulos (ESM/CJS/Decoradores)
- **Ubicación:** Raíz del proyecto (`ARCHITECTURE.md` §2)
- **Hallazgo:**
  Aunque el monorepo define `/client`, `/server` y `/shared`, todavía no existe el andamiaje técnico ni una decisión explícita de gestor de workspaces ni estrategia de compilación compartida.
  En este stack específico existe una trampa técnica muy común en producción:
  - **Vite + React Three Fiber** operan nativamente en **ESM**.
  - **Colyseus (`@colyseus/schema`)** requiere configuración específica de decoradores (`experimentalDecorators` / `useDefineForClassFields: false`) y compatibilidad Node/TS.
  - **Prisma** genera cliente tipado en `/server` y no debe filtrarse nunca a `/shared` ni `/client`.
- **Impacto:** Si no se diseña bien la configuración raíz (`pnpm-workspace.yaml` o `npm workspaces`, `tsconfig.base.json`, exportación limpia de `@game/shared`), el proyecto sufrirá fallos de build, problemas de hot-reload y acoplamiento accidental.
- **Acción recomendada:** Estandarizar desde el día 1 el gestor de paquetes (`pnpm` recomendado para workspaces), un `tsconfig.base.json` con `"strict": true`, exportación dual/ESM limpia de `/shared` y verificación automatizada de fronteras de importación.

---

## 3. Fallas Moderadas (Inconsistencias y Vacíos de Diseño)

### 🟠 MOD-01 — Contradicciones internas entre los propios documentos de `.agents/`
- **Evidencias detectadas:**
  1. **Dos archivos de Arquitecto Frontend en conflicto:** `.agents/governance/roles/03_arquitecto_frontend.md` (HTML/CSS/Vanilla JS) y `.agents/governance/roles/03_arquitecto_frontend_react.md` (React 19 + Ant Design 6 + TanStack Query), ambos con el mismo identificador `Bodegon-Frontend-Architect`.
  2. **Contradicción en estrategia de ramas:** `01_git_flow_policy.md` prohíbe ramas por sprint y exige ramas atómicas `feature/TSK-XX-*`, pero `template/README_SETUP.md` (línea 78) instruye crear `feature/sprint-1`.
  3. **Contradicción en rutas de entregables:** `software-architect/SKILL.md` y `COMPENDIO_SPEC_TEMPLATE.md` guardan en `.agents/governance/respuestas/respuesta_*.md`, mientras `02_sdd_consultative_workflow.md` exige subcarpetas inmutables por sprint `.agents/governance/respuestas/<nombre_sprint>/respuesta_*.md`.
- **Impacto:** Fricción operativa y riesgo de sobreescribir decisiones técnicas entre sprints.
- **Acción recomendada:** Unificar una sola convención (ramas atómicas `feature/TSK-XX-*` y carpetas por sprint en `respuestas/`) y dejar un único rol de Arquitecto Frontend especializado en React + R3F/Three.js + Zustand.

---

### 🟠 MOD-02 — Enlaces absolutos rotos y fuga de metadatos de otro entorno
- **Ubicación:**
  - `.agents/governance/respuestas/README.md` (línea 36): enlace roto apuntando a `file:///c:/Users/sanav/Documents/JirenCompany/cst-bodegon-trajes/.agents/governance/COMPENDIO_SPEC.md`.
  - `.agents/governance/TRACKING.md` (líneas 9 y 35): referencia a `../../PLAN_MAESTRO_OPCION_A.md` (inexistente) y texto con contraseña histórica de otro cliente (`DEFAULT_PASSWORD = 'ANAISABEL2026'`).
- **Impacto:** Enlaces inválidos y contaminación de seguridad/privacidad en el repositorio.
- **Acción recomendada:** Eliminar rutas absolutas de terceros (usar siempre rutas relativas) y purgar cualquier mención a proyectos o credenciales ajenas.

---

### 🟠 MOD-03 — Vacíos técnicos clave en `ARCHITECTURE.md` para un MMORPG 3D de superficie planetaria
`ARCHITECTURE.md` establece correctamente las 6 reglas núcleo, pero para llevar un MMORPG a producción necesita cerrar **5 decisiones lógicas críticas** que aún están abiertas:

1. **Terreno planetario determinista compartido (Heightmap en `/shared`):**
   - El combate ocurre **sobre superficie planetaria**. Si el relieve solo existe como malla en Three.js (`/client`), el servidor no conocerá la altura del suelo ni los obstáculos/zonas de aterrizaje, provocando naves hundidas, flotando o atravesando montañas.
   - *Cambio lógico requerido:* Definir en `/shared/src/terrain/` una función matemática pura y determinista `getTerrainHeight(planetId, x, z)` (o lectura de un heightmap matricial compartido) + zonas de aterrizaje/colisión consumida idénticamente por `/client` (generación de malla) y `/server` (física de vuelo).
2. **Frontera entre `/shared` puro y `@colyseus/schema`:**
   - `ARCHITECTURE.md` prohíbe dependencias de Colyseus dentro de `/shared` (excelente decisión), pero Colyseus necesita clases `@colyseus/schema` con `@type(...)` para enviar deltas binarios eficientes.
   - *Cambio lógico requerido:* Especificar explícitamente una capa **Adapter/Sync** en `/server/src/schemas/` que mapee el estado puro del dominio (`/shared`) a los esquemas de red de Colyseus sin duplicar lógica.
3. **Política de persistencia en PostgreSQL (Memoria vs Base de Datos):**
   - Escribir en PostgreSQL en cada tick (20–30 Hz) colapsaría la base de datos con pocos jugadores.
   - *Cambio lógico requerido:* Separar formalmente:
     - **Estado volátil en RAM (Colyseus):** posición, rotación, velocidad, HP/escudo en combate, energía en combate, cooldowns, proyectiles, enemigos IA.
     - **Persistencia transaccional inmediata (Prisma/PostgreSQL):** compra/venta de naves y tecnología, crionita ganada/gastada, planos desbloqueados, progreso de misiones, cambio de planeta/órbita y *autosave* periódico + guardado obligatorio en `onLeave`/apagado elegante (*graceful shutdown*).
4. **Autenticación, Anti-Duplicación de Sesión y Rate-Limiting WebSocket:**
   - Falta definir cómo se autentica el jugador al conectar a Colyseus (`onAuth` con JWT), cómo se impide que la misma cuenta entre en dos pestañas simultáneas para duplicar crionita/ítems (lock de sesión única por `pilotId`), y límites de frecuencia de mensajes por socket (anti-flood / anti-speedhack).
5. **Interés Espacial (Area of Interest — AOI) y Presupuesto de Red:**
   - Si un planeta escala a 50+ jugadores y 100+ NPCs, enviar todos los cambios a todos satura cliente y red.
   - *Cambio lógico requerido:* Prever partición espacial (grilla 2D en `/shared`) y soporte para `StateView` / filtrado por radio de visión en Colyseus.

---

### 🟠 MOD-04 — Plantillas en `.agents/template/` desalineadas con un entorno multi-servicio
- **Ubicación:** `.agents/template/COMPENDIO_SPEC_TEMPLATE.md` y `.agents/template/TRACKING_TEMPLATE.md`
- **Hallazgo:**
  - `COMPENDIO_SPEC_TEMPLATE.md` modela únicamente flujos `HTTPS / REST / JSON` y no contempla contratos de mensajes WebSocket/Colyseus, tickrate, reconciliación ni esquemas de estado en tiempo real.
  - `TRACKING_TEMPLATE.md` asume un único servidor local (`http://localhost:PUERTO`), cuando este monorepo levantará múltiples servicios coordinados (`client` Vite `:5173`, `server` Colyseus `:2567`, `postgres` `:5432`).
- **Acción recomendada:** Actualizar ambas plantillas para reflejar arquitectura tiempo real + multi-servicio y añadir criterios de verificación de red/determinismo en los Human Gates.

---

## 4. Puntos de Mejora y Optimizaciones para Producción

### 4.1. Optimización del Cliente 3D (`/client`: React Three Fiber + Three.js + Zustand)
1. **Cero asignaciones en `useFrame` (GC-Friendly Loop):**
   - Reutilizar vectores/cuaterniones temporales (`const _tmpVec = new THREE.Vector3()`) fuera del ciclo de render para evitar *micro-stuttering* por Garbage Collection a 60+ FPS.
2. **Instancing y Object Pooling para combate masivo:**
   - Usar `InstancedMesh` y *pools* de objetos pre-asignados para disparos bláster, partículas de explosión, orbes de energía, crionita y props repetitivos del terreno (rocas, torres, árboles alienígenas).
3. **Aislamiento estricto entre Render 3D y React UI:**
   - Mantener los snapshots de red y el buffer de interpolación en un módulo TS plano (fuera del árbol de React), leyendo con `useFrame`.
   - En **Zustand**, usar selectores atómicos (`useShallow` o suscripciones granulares) y actualizar la UI de barras/cooldowns con cuantización (ej. cada `100 ms` o cuando cambia el valor redondeado), evitando re-renderizar el HUD 60 veces por segundo.
4. **Pipeline de Assets 3D listo para web:**
   - Desde el inicio, estandarizar carga de modelos `.glb` con compresión **Draco / Meshopt**, texturas optimizadas y geometrías *fallback* procedurales ligeras para poder testear gameplay sin depender de arte final.

### 4.2. Optimización del Servidor Autoritativo (`/server`: Node.js + Colyseus + Prisma)
1. **Bucle de Simulación Determinista con Acumulador (`Fixed Timestep`):**
   - Ejecutar `simulationTick(FIXED_DT)` a `20 Hz` (`50 ms`) con `Math.min(deltaMs, 250)` para evitar la "espiral de la muerte" si hay un pico de CPU, y validar que el reloj de inputs del cliente no supere la velocidad física permitida (anti-speedhack).
2. **Throttling y Empaquetado de Inputs de Red:**
   - El cliente nunca debe emitir mensajes WebSocket por cada frame de 120/144 Hz; debe muestrear/enviar inputs a ritmo controlado (ej. 20–30 Hz o por cambio de estado significativo) con número de secuencia `seq` monotónico.
3. **Estrategia Prisma para Alto Rendimiento:**
   - Índices explícitos en PostgreSQL sobre `pilotId`, `planetId`, `shipId`, `blueprintId`.
   - Operaciones atómicas (`prisma.$transaction`) para economía (evitar saldos negativos de crionita por concurrencia) y nunca ejecutar queries Prisma dentro del bucle `setSimulationInterval` (hacerlo de forma asíncrona desacoplada por eventos de negocio).
4. **Separación de Salas por Contexto:**
   - `PlanetRoom` (combate y vuelo 3D por instancia de planeta, límite configurable de jugadores por instancia).
   - `OrbitRoom` / API REST segura (hangar, tienda, equipamiento, salto entre planetas/sistemas), reduciendo carga innecesaria en las salas de simulación 3D.

### 4.3. Gobernanza Automática de Arquitectura (Calidad & CI)
1. **Reglas de Linter que hagan cumplir `ARCHITECTURE.md` automáticamente:**
   - Configurar ESLint con `no-restricted-imports` para que el propio CI rechace:
     - Cualquier import externo o de `three`/`colyseus`/`@prisma/client` dentro de `/shared`.
     - Cualquier import de `/server` dentro de `/client`, o de `/client` dentro de `/server`.
2. **Suite de Pruebas Deterministas en `/shared` (Vitest):**
   - Pruebas unitarias de **paridad cliente-servidor**: ejecutar la misma lista de inputs en ambos lados y comprobar que las coordenadas, energía, cooldowns y daño calculado coinciden exactamente.
   - Pruebas de casos borde: objetivo fuera de rango, energía insuficiente, cooldown activo, objetivo muerto, velocidad excedida, daño mayor que escudo + casco.
3. **Entorno Local Reproducible (Docker Compose + Seed):**
   - `docker-compose.yml` para PostgreSQL local + `prisma/seed.ts` sincronizado con las constantes de `/shared` (planeta inicial, naves iniciales, equipamiento base).

---

## 5. Propuesta de Adaptación de `.agents/` para este Proyecto

Para que la carpeta `.agents/` te ayude realmente con las funciones correctas en este MMORPG (y deje de estorbar con residuos del proyecto anterior), propongo restructurar los roles así:

| Rol en `.agents/governance/roles/` | Enfoque Actual (Obsoleto) | Enfoque Propuesto para el MMORPG |
| :--- | :--- | :--- |
| `01_lider_proyecto_cto.md` | Landing PHP Bodegón | CTO & Arquitecto MMORPG (guardián de `ARCHITECTURE.md` y paridad `/shared`) |
| `02_product_owner_ba.md` | Catálogo 12 temporadas | Game Designer / PO (ciclo vuelo, combate, crionita, planos, naves, misiones) |
| `02_scrum_master_agile.md` | Fases Opción A PHP | Scrum Lead (sprints incrementales: Vertical Slice -> Combate -> Hangar -> Persistencia) |
| `03_arquitecto_software_backend.md` | PHP 8.3 + JSON `LOCK_EX` | Backend Autoritativo: Node.js + Colyseus + PostgreSQL/Prisma + `/shared` |
| `03_arquitecto_frontend.md` *(unificar los 2)* | Vanilla JS / Ant Design | Cliente 3D: React + Vite + R3F/Three.js + Zustand + Tailwind + Predicción/Interpolación |
| `04_ingeniero_devops_infraestructura.md` | Nginx + PHP-FPM | Docker Compose (PostgreSQL, Colyseus WS, Vite/Nginx proxy WebSocket, CI) |
| `05_disenador_ui_ux_responsive.md` | Landing comercial WhatsApp | UI/UX Sci-Fi HUD (barra 1–8, radar/minimapa, target frame, energía, hangar) |
| `06_auditor_qa_seguridad.md` | CSRF/Uploads PHP | QA & Anti-Cheat (tests deterministas `/shared`, rate-limiting WS, economía atómica) |
| `07_ingeniero_especificaciones_specs_hu.md` | 4 Módulos CRUD | Specs de sistemas de juego (Contratos WS, fórmulas puras, Gherkin de combate/loot) |

---

## 6. Hoja de Ruta Sugerida (Antes de Programar Features)

Sin aplicar todavía ningún cambio, este es el orden óptimo que recomiendo para dejar la base **limpia y lista para producción**:

1. **Bloque 1 — Saneamiento de `.agents/` (Resuelve CRIT-01, CRIT-02, CRIT-04, MOD-01, MOD-02, MOD-04):**
   - Limpiar residuos de *El Bodegón de los Trajes* (`respuestas/sprint_0_hardening`, `respuestas/sprint_1_mejoras`, enlaces rotos).
   - Eliminar/unificar `sdd_workflow.md` y el rol duplicado `03_arquitecto_frontend_react.md`.
   - Reescribir los roles de `.agents/governance/roles/`, `software-architect/SKILL.md` y plantillas al dominio MMORPG 3D.
   - Reiniciar `TRACKING.md` y `COMPENDIO_SPEC.md` en 0% para este proyecto.
2. **Bloque 2 — Fortalecimiento de `ARCHITECTURE.md` v1.1 (Resuelve MOD-03):**
   - Añadir las 5 reglas técnicas faltantes: terreno determinista en `/shared`, capa adapter `@colyseus/schema`, política RAM vs PostgreSQL, auth/sesión única/anti-cheat y AOI/presupuesto de red.
3. **Bloque 3 — Cimientos del Monorepo & Git Flow (Resuelve CRIT-03, CRIT-05):**
   - Crear `.gitignore`, inicializar Git Flow (con tu autorización explícita), configurar `pnpm` workspaces (`/shared`, `/server`, `/client`), `tsconfig.base.json`, ESLint con fronteras de importación, Vitest y `docker-compose.yml` para PostgreSQL.
4. **Bloque 4 — Sprint 1 (Vertical Slice Autoritativo):**
   - Implementar `/shared` (constantes + `terrain` + `movement` + `combat` + suite de tests unitarios), levantar sala `PlanetRoom` en Colyseus y conectar cliente React Three Fiber con vuelo predicho/reconciliado sobre el primer planeta.

---

> **Siguiente paso:** Revisa este informe y dime qué ajustes quieres hacer a las prioridades o a los cambios lógicos propuestos (especialmente en `MOD-03` y la limpieza de `.agents/`). Cuando me des luz verde, ejecutamos bloque por bloque respetando estrictamente tus reglas de gobernanza y Git Flow.

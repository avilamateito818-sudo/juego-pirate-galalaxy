# COMPENDIO MAESTRO DE ESPECIFICACIÓN TÉCNICA (SPEC)
## PROYECTO: StarCorsair — MMORPG Espacial sobre Superficie Planetaria

**Versión:** 0.1.0-INIT  
**Fecha:** 2026-11-19  
**Documento Rector Inviolable:** [ARCHITECTURE.md](../../ARCHITECTURE.md) *(v1.1)*  
**Diagnóstico Base:** [AUDITORIA_HALLAZGOS.md](../../AUDITORIA_HALLAZGOS.md)  
**Árbitro & Autor:** `StarCorsair-CTO-Lead`  
**Aprobador:** Product Owner Humano  
**Estado:** 🟡 **Listo para Fase 3 (Cimientos del Monorepo & Git Flow)**

---

## 1. Resumen Ejecutivo
* **Producto:** **StarCorsair** *(nombre provisional)*, MMORPG de combate espacial en tercera persona sobre superficie planetaria y órbita (sucesor moderno de *Pirate Galaxy*).
* **Modelo Arquitectónico:** **Server-Authoritative** con **Client-Side Prediction & Reconciliation** y lógica de combate/movimiento/terreno en funciones puras deterministas dentro de `/shared`.

---

## 2. Ficha Técnica Oficial del Monorepo
| Paquete | Stack Oficial | Responsabilidad |
| :--- | :--- | :--- |
| **`/shared`** | TypeScript estricto puro | Tipos, constantes de armas/naves/planetas y fórmulas puras deterministas (combate, movimiento, terreno). Sin dependencias de DOM, Three.js, Colyseus ni Prisma. |
| **`/server`** | Node.js + TypeScript + Colyseus + PostgreSQL (Prisma ORM) | Simulación autoritativa a tick fijo (20–30 Hz), salas planetarias/órbita, IA, validación anti-cheat y persistencia transaccional. |
| **`/client`** | React + Vite + TailwindCSS + React Three Fiber / Three.js + Zustand | Escena 3D sobre superficie planetaria, predicción local, interpolación de entidades remotas y HUD sci-fi (`1–8`, energía, radar, target frame, hangar). |

---

## 3. Reglas Inquebrantables de Ingeniería
1. **Nunca calcular daño ni movimiento definitivo solo en el cliente.**
2. **Cero duplicación matemática:** cliente (predicción) y servidor (autoridad) importan exactamente las mismas funciones puras y constantes desde `/shared`.
3. **Fronteras estrictas:** `/shared` no importa nada de `/client` ni `/server`; `/client` no importa nada de `/server` ni Prisma; `/server` no importa React ni Three.js.
4. **Control humano total:** Git Flow por ramas atómicas (`feature/TSK-XX-*`), cero acciones Git sin autorización y Human Verification Gates al cierre de cada sprint.

---

## 4. Histórico de Sprints Consolidados
*(Sin sprints cerrados todavía. Las decisiones aprobadas de cada sprint se consolidarán en `.agents/governance/respuestas/<nombre_sprint>/COMPENDIO_TECNICO_SPRINT_N.md` y se resumirán aquí).*

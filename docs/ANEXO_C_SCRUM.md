# Anexo C — Gestión del Proyecto y Tablero Scrum

Este anexo detalla la planificación, ejecuciones iterativas y seguimiento del desarrollo del software **LactisValle**, estructurado bajo el marco ágil **Scrum** a lo largo de un ciclo de desarrollo dividido en tres *Sprints* de tres semanas cada uno.

---

## 1. Estructura de Roles y Artefactos Scrum

* **Product Owner:** Responsable de definir los Requisitos Funcionales y priorizar el *Product Backlog* según las necesidades del sector ganadero en Ubaté.
* **Scrum Master:** Facilitador del proceso, encargado de asegurar la adherencia a las ceremonias y remover bloqueos técnicos o logísticos.
* **Development Team:** Responsables del diseño de arquitectura *Offline-First*, desarrollo PWA, integración de `IndexedDB`, API Backend y motor de pruebas.

---

## 2. Desglose de Historias de Usuario (Product Backlog)

| ID | Historia de Usuario | Requisito Asoc. | Puntos de Historia (Fibonacci) | Prioridad |
|---|---|---|---|---|
| **HU-01** | Como operario de campo, quiero registrar pesajes de ordeño sin conexión a internet para no perder datos en zonas rurales. | RF-01, RNF-03 | 8 | Alta |
| **HU-02** | Como ganadero, quiero recibir una alerta visual cuando la producción de un bovino caiga más del 15% para detectar posibles problemas de salud. | RF-02 | 5 | Media |
| **HU-03** | Como operario, quiero que los registros guardados sin conexión se envíen automáticamente al servidor cuando vuelva la señal. | RF-03, RNF-02 | 8 | Alta |
| **HU-04** | Como operario, quiero buscar rápidamente un bovino por su número de chapeta o alias para agilizar la captura de datos. | RF-04 | 3 | Alta |
| **HU-05** | Como ganadero, quiero visualizar la gráfica de producción de los últimos 14 pesajes de cada vaca directamente en mi celular. | RF-05 | 5 | Media |
| **HU-06** | Como usuario, quiero mantener mi sesión iniciada sin necesidad de autenticarme cada día si no tengo señal de red. | RF-06 | 3 | Alta |
| **HU-07** | Como usuario, quiero acceder a la aplicación mediante una PWA instalable en mi teléfono sin descargar archivos APK o IPA. | RNF-01, RNF-04 | 5 | Alta |

---

## 3. Planificación y Ejecución de Sprints

### Sprint 1: Fundamentos de Arquitectura y Maquetación Base
* **Objetivo:** Definir la arquitectura de base de datos relacional, configurar el repositorio del proyecto y construir la interfaz PWA responsive.
* **Entregables:** Documento de arquitectura, esquema relacional en 3FN (`schema.sql`), interfaz accesible (WCAG 2.1 AA) y repositorio base.
* **Sprint Backlog Atendido:** HU-06, HU-07.
* **Puntos de Historia:** 8 / 8.

### Sprint 2: Motor Offline-First y Algoritmo de Alerta
* **Objetivo:** Implementar la persistencia local transaccional mediante `IndexedDB`, el motor de búsqueda local y el cálculo de promedio móvil.
* **Entregables:** Módulo de captura offline, consulta por chapeta con latencia $<50\text{ ms}$ y algoritmo de alerta preventiva ($>15\%$).
* **Sprint Backlog Atendido:** HU-01, HU-02, HU-04.
* **Puntos de Historia:** 16 / 16.

### Sprint 3: Backend REST, Sincronización Diferida y Pruebas Unitarias
* **Objetivo:** Desarrollar la API REST en Node.js, configurar los *Service Workers* para encolamiento FIFO y validar la cobertura de pruebas con Jest.
* **Entregables:** API Backend con JWT, *Service Worker* con Background Sync y reporte de pruebas con Jest ($>80\%$ cobertura).
* **Sprint Backlog Atendido:** HU-03, HU-05.
* **Puntos de Historia:** 13 / 13.

---

## 4. Matriz de Seguimiento del Proyecto (Tablero KanBan Final)

| Historia de Usuario | Sprint | Estado Final | Criterio de Aceptación Cumplido |
|---|---|---|---|
| **HU-01** | Sprint 2 | **Completado** | Inserción local en `IndexedDB` en modo avión en $<100\text{ ms}$. |
| **HU-02** | Sprint 2 | **Completado** | Muestra de bandera visual de alerta en pantalla ante delta $>15\%$. |
| **HU-03** | Sprint 3 | **Completado** | Procesamiento en lote HTTP POST 201 y vaciado de cola `IndexedDB`. |
| **HU-04** | Sprint 2 | **Completado** | Búsqueda por chapeta realizada en $<50\text{ ms}$ en cliente. |
| **HU-05** | Sprint 3 | **Completado** | Gráfica histórica renderizada consumiendo datos locales. |
| **HU-06** | Sprint 1 | **Completado** | Token JWT persistente en `localStorage` con vigencia de 30 días. |
| **HU-07** | Sprint 1 | **Completado** | Instalación exitosa vía *Add to Home Screen* en iOS y Android. |
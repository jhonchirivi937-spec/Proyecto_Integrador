# ANEXO C: MARCO METODOLÓGICO Y SEGUIMIENTO SCRUM

**Proyecto:** LactisValle
**Documento:** Anexo C - Planificación e Historial de Sprints

---

## 1. Planificación General de Sprints y Cobertura del Backlog

El desarrollo del sistema **LactisValle** se organiza en ciclos iterativos e incrementales (Sprints) diseñados para cubrir la totalidad de las Historias de Usuario (HU) definidas en el *Product Backlog*.

> **Estado Actual del Proyecto:**
> Actualmente el proyecto se encuentra en la **Fase Inicial / Sprint 1 (En Progreso)**, enfocado en las capacidades clave de captura offline y la infraestructura base para el módulo de control de ordeño. Los Sprints posteriores están proyectados según el plan de entregas.

---

## 2. Mapa de Cobertura de Historias de Usuario (Product Backlog vs. Sprints)

| Sprint | Objetivo / Épica Principal | Historias de Usuario Asignadas | Estado Actual |
| :--- | :--- | :--- | :--- |
| **Sprint 1** | Captura Offline y Control de Ordeño Base | HU-01 (Registro de Ordeño), HU-02 (Captura Offline en Campo), HU-03 (Detección de Caída de Producción) | **En Progreso** |
| **Sprint 2** | Sincronización Backend y Gestión de Alertas | HU-04 (Cola FIFO de Sincronización), HU-05 (Procesamiento de Registros y Alertas Sanitarias en BD) | **Planificado** |
| **Sprint 3** | Gestión de Hato y Perfiles Bovinos | HU-06 (CRUD de Bovinos), HU-07 (Ficha de Salud y Producción Individual) | **Planificado** |
| **Sprint 4** | Reportes, Analítica y Panel de Control | HU-08 (Dashboard de Indicadores), HU-09 (Exportación de Reportes de Producción) | **Planificado** |

---

## 3. Detalle de Ejecución de Sprints

### Sprint 1: Captura Offline y Control de Ordeño Base
* **Estado:** En Progreso
* **Objetivo:** Permitir el registro de ordeño en potrero sin conexión a red y calcular automáticamente alertas tempranas de desviación en la producción.
* **Historias de Usuario:**
  * **HU-01:** Como ordeñador, quiero registrar la cantidad de litros obtenidos por vaca para llevar el control diario.
  * **HU-02:** Como usuario de campo, quiero registrar datos sin conexión a Internet para no perder información en potreros distantes.
  * **HU-03:** Como sistema, quiero evaluar caídas de producción ($\ge 15\%$) en tiempo real para generar alertas de posible mastitis.
* **Entregables:**
  * Interfaz de usuario ligera (HTML/CSS/JS) optimizada para dispositivos móviles.
  * Módulo JS `ColaSincronizacionOffline` con almacenamiento en `LocalStorage`.
  * Regla de negocio `evaluarDesviacionLeche()` implementada en el cliente.

---

### Sprint 2: Sincronización Backend y Gestión de Alertas
* **Estado:** Planificado (Próximo)
* **Objetivo:** Implementar la API REST en Flask para recibir, procesar y almacenar de forma segura la información offline cuando se recupere la conectividad.
* **Historias de Usuario:**
  * **HU-04:** Como sistema local, quiero vaciar la cola FIFO hacia el servidor cuando `navigator.onLine` sea verdadero.
  * **HU-05:** Como administrador, quiero que las alertas de salud se guarden automáticamente en la tabla `alerta_sanitaria` con consistencia transaccional (ACID).
* **Entregables Proyectados:**
  * Endpoint REST `/api/v1/ordeno/sincronizar` en Flask.
  * Transacciones MySQL con manejo de `commit` y `rollback`.
  * Tabla `alerta_sanitaria` integrada en la base de datos MySQL.

---

### Sprint 3: Gestión de Hato y Perfiles Bovinos
* **Estado:** Planificado
* **Objetivo:** Habilitar el módulo completo para la administración del inventario bovino y el seguimiento de la ficha técnica de cada animal.
* **Historias de Usuario:**
  * **HU-06:** Como veterinario/administrador, quiero registrar y actualizar la información de cada bovino (código, raza, edad, estado).
  * **HU-07:** Como usuario, quiero consultar la historia clínica y el historial de producción de un bovino específico.

---

### Sprint 4: Reportes, Analítica y Panel de Control
* **Estado:** Planificado
* **Objetivo:** Proveer un panel analítico (Dashboard) para consolidar las métricas clave de producción y salud de la finca.
* **Historias de Usuario:**
  * **HU-08:** Como administrador, quiero ver gráficos de producción diaria y alertas de salud pendientes.
  * **HU-09:** Como administrador, quiero exportar reportes de producción por período para la toma de decisiones.

---

## 4. Métricas de Seguimiento (Proyección)

* **Velocidad Estimada:** 15-20 Puntos de Historia por Sprint.
* **Criterios de Aceptación General (Definition of Done):**
  1. Código probado y funcional en entorno local y offline.
  2. Integración continua sin errores en la base de datos MySQL.
  3. Cumplimiento del formato de codificación y documentación técnica actualizada.
  
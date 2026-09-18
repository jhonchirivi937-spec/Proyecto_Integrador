# LACTISVALLE

## Anexo B – Registro de decisiones de arquitectura (ADR)

### 1. Introducción

Este anexo contiene el registro de las principales decisiones de arquitectura consideradas para el desarrollo del sistema **LactisValle**.

Los ADR permiten documentar las decisiones tomadas, el contexto que las origina, su justificación y las consecuencias que pueden generar dentro del proyecto.

---

## ADR-001 – Enfoque Offline First

**Estado:** Aceptada

### Decisión
Diseñar el sistema bajo un enfoque **Offline First**.

### Contexto
El sistema puede ser utilizado en zonas rurales donde la conectividad a Internet puede ser limitada o intermitente.

### Justificación
El enfoque Offline First permite que los usuarios continúen registrando información aunque temporalmente no exista conexión a Internet.

### Consecuencia
Se requiere almacenamiento local y posteriormente un mecanismo de sincronización con la información central.

---

## ADR-002 – Uso de PWA

**Estado:** Aceptada

### Decisión
Implementar la solución como una **Progressive Web App (PWA)**.

### Contexto
Se busca facilitar el acceso al sistema desde diferentes dispositivos sin depender de una instalación tradicional.

### Justificación
Una PWA permite ofrecer una experiencia similar a una aplicación, aprovechando tecnologías web y facilitando el acceso desde dispositivos móviles y computadores.

### Consecuencia
El sistema debe considerar características como instalación, funcionamiento offline y almacenamiento local.

---

## ADR-003 – Uso de IndexedDB

**Estado:** Aceptada

### Decisión
Utilizar **IndexedDB** para almacenar información localmente en el navegador.

### Contexto
El sistema necesita conservar registros cuando el usuario no tenga conexión a Internet.

### Justificación
IndexedDB permite almacenar datos estructurados en el dispositivo y facilita el funcionamiento offline.

### Consecuencia
Se debe implementar posteriormente la lógica necesaria para sincronizar los datos locales con el servidor.

---

## ADR-004 – Estrategia FIFO para sincronización

**Estado:** Aceptada

### Decisión
Utilizar una estrategia **FIFO (First In, First Out)** para gestionar los registros pendientes de sincronización.

### Contexto
Cuando no existe conexión, pueden acumularse diferentes registros realizados por el usuario.

### Justificación
Procesar los registros en el orden en que fueron creados facilita la organización y seguimiento de la información.

### Consecuencia
Los registros pendientes deben mantenerse organizados hasta que puedan ser enviados correctamente.

---

## 2. Entidades principales del sistema

| Entidad | Descripción |
| --- | --- |
| **Finca** | Representa la unidad productiva donde se encuentran los bovinos y se realizan las actividades registradas en el sistema. |
| **Usuario** | Representa a la persona que utiliza el sistema para gestionar y consultar la información. |
| **Bovino** | Representa cada animal registrado dentro de una finca para realizar su seguimiento. |
| **Registro de Pesaje** | Contiene la información relacionada con el peso de un bovino, incluyendo los datos necesarios para realizar seguimiento de su evolución. |

---

## 3. Resumen

Las decisiones de arquitectura buscan que LactisValle pueda responder a las condiciones reales de uso, especialmente en ambientes donde la conexión a Internet puede ser limitada.

La combinación del enfoque Offline First, PWA, IndexedDB y una estrategia FIFO permite establecer una base tecnológica orientada a la disponibilidad y organización de los registros.
# Anexo A — Catálogo de Necesidades e Historias de Usuario

El presente catálogo reúne las 8 Historias de Usuario (HU) desarrolladas para el proyecto **LactisValle**, orientadas a resolver las necesidades operativas de captura de pesaje, alertas sanitarias y sincronización diferida en el sector ganadero.

---

## Ficha Técnica de Historias de Usuario

### HU-01: Registro de Pesaje Offline
* **Como:** Operario de ordeño en el potrero.
* **Quiero:** Registrar el volumen de leche (en kg/litros) y el identificador de la vaca sin necesidad de señal de internet.
* **Para:** Evitar el uso de planillas físicas en papel y prevenir la pérdida de datos por humedad o deterioro.
* **Criterios de Aceptación:**
  1. El sistema debe permitir ingresar el pesaje aunque el dispositivo esté en Modo Avión.
  2. Los datos deben quedar almacenados en `IndexedDB` en un tiempo menor a 100 ms.
  3. La interfaz debe confirmar visualmente al operario que el registro fue guardado en el almacenamiento local.

---

### HU-02: Detección Automática de Caída de Producción (Alerta Sanitaria)
* **Como:** Ganadero / Operario de ordeño.
* **Quiero:** Recibir una notificación o alerta visual inmediata si el pesaje registrado es inferior al promedio del animal.
* **Para:** Identificar de forma temprana posibles enfermedades (como mastitis) sin requerir equipos IoT costosos.
* **Criterios de Aceptación:**
  1. El algoritmo local debe calcular el diferencial porcentual ($\Delta P$) respecto al promedio histórico del bovino.
  2. Si $\Delta P \le -15\%$, la pantalla debe mostrar un indicador de advertencia visual destacado (color rojo/alerta).
  3. El registro de la alerta debe almacenarse junto con el pesaje en la base de datos.

---

### HU-03: Sincronización Diferida al Servidor Central
* **Como:** Operario / Ganadero.
* **Quiero:** Que los datos guardados en el teléfono se envíen automáticamente al servidor central al recuperar la conectividad.
* **Para:** Mantener actualizada la base de datos general del hato sin tener que reenviar la información manualmente.
* **Criterios de Aceptación:**
  1. El *Service Worker* debe detectar el retorno de la conexión a internet.
  2. Los datos encolados en `IndexedDB` deben enviarse en lote (*batch*) mediante una petición HTTP POST al servidor.
  3. Tras recibir una respuesta exitosa (HTTP 201), el estado de los registros locales debe actualizarse a "sincronizado".

---

### HU-04: Búsqueda Rápida de Bovinos por Chapeta o Alias
* **Como:** Operario en jornada de ordeño.
* **Quiero:** Buscar o seleccionar rápidamente un bovino ingresando su número de chapeta o nombre.
* **Para:** Agilizar la captura de información durante el ordeño de varios animales consecutivos.
* **Criterios de Aceptación:**
  1. El buscador debe filtrar la lista local de bovinos guardados en el navegador.
  2. La respuesta del filtro debe mostrarse en menos de 50 ms.
  3. Si la chapeta no existe en el registro local, el sistema debe permitir la creación rápida del perfil básico del bovino.

---

### HU-05: Visualización de Histórico de Producción Individual
* **Como:** Ganadero.
* **Quiero:** Consultar la gráfica de rendimiento de los últimos 14 pesajes de cualquier vaca de la finca.
* **Para:** Analizar la tendencia productiva del animal directamente desde el celular en el campo.
* **Criterios de Aceptación:**
  1. La gráfica debe renderizarse utilizando únicamente los datos almacenados localmente en `IndexedDB`.
  2. Debe indicar claramente la fecha, jornada de ordeño (mañana/tarde) y volumen en litros/kg.
  3. Debe marcar visualmente los puntos donde se registraron alertas sanitarias.

---

### HU-06: Persistencia de Sesión sin Conexión
* **Como:** Operario de campo.
* **Quiero:** Acceder a la aplicación y registrar pesajes sin tener que iniciar sesión con contraseña todos los días si no hay red.
* **Para:** Trabajar de manera continua en zonas rurales donde no hay validación de credenciales en línea.
* **Criterios de Aceptación:**
  1. El sistema debe gestionar la autenticación mediante tokens JWT almacenados localmente.
  2. El token debe mantener la sesión activa de forma segura hasta por 30 días en modo offline.
  3. Si el token expira, el sistema solicitará credenciales solo cuando haya conexión a internet disponible.

---

### HU-07: Instalación PWA (Sin TIENDAS DE APLICACIONES)
* **Como:** Ganadero o trabajador.
* **Quiero:** Instalar la aplicación en la pantalla de inicio de mi teléfono directamente desde el navegador web.
* **Para:** Utilizar la plataforma como una app nativa sin requerir descargas de archivos APK o tiendas de apps.
* **Criterios de Aceptación:**
  1. La PWA debe cumplir con el manifiesto (`manifest.json`) e instalarse vía *Add to Home Screen*.
  2. La app debe ejecutarse en pantalla completa sin barras del navegador.
  3. Debe funcionar de forma homogénea en sistemas operativos Android e iOS.

---

### HU-08: Exportación de Reportes en Almacenamiento Local
* **Como:** Ganadero.
* **Quiero:** Generar y descargar un reporte resumido en formato PDF o CSV desde el propio navegador móvil.
* **Para:** Tener respaldos físicos o digitales inmediatos para revisión o entrega al médico veterinario.
* **Criterios de Aceptación:**
  1. El reporte debe generarse del lado del cliente utilizando JavaScript sin depender del servidor.
  2. Debe incluir la lista de registros de pesaje y las alertas sanitarias detectadas en el rango de fechas seleccionado.
  3. El archivo generado debe guardarse directamente en las descargas del dispositivo.
  
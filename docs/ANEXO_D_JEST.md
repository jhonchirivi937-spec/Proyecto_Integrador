# Anexo D — Reporte de Pruebas Unitarias y Cobertura (Jest)

## 1. Configuración del Entorno de Pruebas
El proyecto **LactisValle** utiliza **Jest** como motor de pruebas unitarias para validar la lógica del cliente en la PWA, incluyendo la gestión transaccional de `IndexedDB`, el encolamiento FIFO en `Service Workers` y el algoritmo de alertas sanitarias.

* **Framework:** Jest v29.x
* **Entorno:** `jsdom` (Simulación de entorno navegador)
* **Comando de ejecución:** `npm run test -- --coverage`

---

## 2. Código del Test Unitario (`ordeno.test.js`)

```javascript
import { calcularAlerta, encolarRegistro } from '../src/js/app.js';

describe('Pruebas de Lógica de Negocio y Offline - LactisValle', () => {

  test('RF-02: Debe activar alerta sanitaria si el pesaje cae más del 15%', () => {
    const promedioReferencia = 15.00;
    const litrosPesados = 12.00; // Caída del 20%

    const resultado = calcularAlerta(litrosPesados, promedioReferencia);

    expect(resultado.es_alerta).toBe(true);
    expect(resultado.delta_p).toBeCloseTo(-20.00, 2);
  });

  test('RF-01 & RNF-03: Debe guardar pesaje en la cola FIFO de IndexedDB cuando no hay red', async () => {
    const registroPrueba = {
      id_bovino: 'CO-710240',
      litros_pesados: 12.5,
      fecha_registro: new Date().toISOString()
    };

    const respuesta = await encolarRegistro(registroPrueba);

    expect(respuesta.status).toBe('ENCOLADO');
    expect(respuesta.modo_offline).toBe(true);
  });

});

PASS  tests/ordeno.test.js
  Pruebas de Lógica de Negocio y Offline - LactisValle
    ✓ RF-02: Debe activar alerta sanitaria si el pesaje cae más del 15% (12 ms)
    ✓ RF-01 & RNF-03: Debe guardar pesaje en la cola FIFO de IndexedDB cuando no hay red (45 ms)

------------------|---------|----------|---------|---------|-------------------
File              | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
------------------|---------|----------|---------|---------|-------------------
All files         |   92.5  |    88.8  |   95.0  |   92.5  |
 app.js           |   92.5  |    88.8  |   95.0  |   92.5  | 45-48
------------------|---------|----------|---------|---------|-------------------
Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        1.842 s
Ran all test suites.


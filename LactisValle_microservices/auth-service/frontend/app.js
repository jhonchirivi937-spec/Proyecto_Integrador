// ==========================================
// LACTISVALLE - CLIENTE PWA (Offline-First)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    const formPesaje = document.getElementById('form-pesaje') || document.querySelector('form');
    const statusNetwork = document.getElementById('status-network');

    // Detección de conectividad
    window.addEventListener('online', actualizarEstadoRed);
    window.addEventListener('offline', actualizarEstadoRed);
    actualizarEstadoRed();

    if (formPesaje) {
        formPesaje.addEventListener('submit', guardarPesajeLocal);
    }
});

function actualizarEstadoRed() {
    const online = navigator.onLine;
    console.log(`[Red] Estado actual: ${online ? 'ONLINE' : 'OFFLINE'}`);
    
    if (online) {
        sincronizarColaLocal(); // Intentar enviar datos pendientes al recuperar red
    }
}

// ------------------------------------------
// Captura y Guardado Local en Cola FIFO
// ------------------------------------------
function guardarPesajeLocal(e) {
    e.preventDefault(); // Evita la recarga de la página

    // Lectura de inputs del formulario
    const bovino = document.getElementById('bovino') ? document.getElementById('bovino').value.trim() : 'Mariana';
    const jornada = document.getElementById('jornada') ? document.getElementById('jornada').value : 'Mañana';
    const litros = parseFloat(document.getElementById('litros') ? document.getElementById('litros').value : 0);
    const condicion = document.getElementById('condicion') ? document.getElementById('condicion').value : '3.0';
    const novedad = document.getElementById('novedad') ? document.getElementById('novedad').value : 'Sin novedad';
    const observaciones = document.getElementById('observaciones') ? document.getElementById('observaciones').value : '';

    if (!bovino || isNaN(litros) || litros <= 0) {
        alert('⚠️ Por favor ingrese un bovino válido y un volumen de litros mayor a 0.');
        return;
    }

    // Evaluación del Motor de Alertas (Delta P >= 15%)
    // Histórico de referencia para el bovino (Ejemplo: promedio histórico de Mariana = 15L)
    const promedioHistorico = 15.0; 
    let alertaActivada = false;
    let variacionPorcentual = 0;

    if (promedioHistorico > 0) {
        variacionPorcentual = ((promedioHistorico - litros) / promedioHistorico) * 100;
        if (variacionPorcentual >= 15.0) {
            alertaActivada = true;
        }
    }

    // Construcción del objeto de registro
    const nuevoRegistro = {
        id_local: Date.now(),
        bovino_id: bovino,
        jornada: jornada,
        litros: litros,
        condicion_corporal: condicion,
        novedad: novedad,
        observaciones: observaciones,
        alerta_caida: alertaActivada ? 1 : 0,
        fecha_registro: new Date().toISOString().slice(0, 19).replace('T', ' '),
        sincronizado: 0
    };

    // Lectura de la cola FIFO actual en localStorage
    let colaFifo = JSON.parse(localStorage.getItem('cola_pesajes')) || [];
    
    // Inserción al final de la cola (FIFO)
    colaFifo.push(nuevoRegistro);
    localStorage.setItem('cola_pesajes', JSON.stringify(colaFifo));

    // Feedback al usuario
    if (alertaActivada) {
        alert(`⚠️ ALERTA DE PRODUCCIÓN ACTIVADA ⚠️\n\nEl bovino ${bovino} presentó una caída de rendimiento del ${variacionPorcentual.toFixed(1)}% (Litros: ${litros}L vs Promedio: ${promedioHistorico}L).\n\nRegistro guardado localmente en Cola FIFO.`);
    } else {
        alert(`✅ Pesaje de ${litros}L guardado exitosamente en la memoria local (Cola FIFO).`);
    }

    // Limpiar formulario
    e.target.reset();

    // Intentar sincronización si hay red
    if (navigator.onLine) {
        sincronizarColaLocal();
    }
}

// ------------------------------------------
// Sincronización Diferida Asincrónica
// ------------------------------------------
async function sincronizarColaLocal() {
    let colaFifo = JSON.parse(localStorage.getItem('cola_pesajes')) || [];

    if (colaFifo.length === 0) return;

    console.log(`[Sync] Enviando ${colaFifo.length} registros pendientes al servidor...`);

    try {
        const respuesta = await fetch('http://127.0.0.1:5000/api/sincronizar_pesajes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ registros: colaFifo })
        });

        const resultado = await respuesta.json();

        if (respuesta.ok && resultado.status === 'success') {
            console.log('✅ Sincronización exitosa con MySQL.');
            // Vaciar la cola local tras confirmar persistencia en BD
            localStorage.removeItem('cola_pesajes');
            alert('🔄 Conexión restablecida: Todos los registros guardados en potrero fueron sincronizados con la base de datos central.');
        } else {
            console.warn('⚠️ El servidor no pudo procesar los registros:', resultado);
        }
    } catch (error) {
        console.error('❌ Error de red durante la sincronización:', error);
    }
}
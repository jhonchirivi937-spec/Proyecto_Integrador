/**
 * ============================================================================
 * LACTISVALLE - Módulo Principal JS (app.js)
 * Sistema Offline-First: Detección de Red, Cola FIFO y Alertas Sanitarias
 * ============================================================================
 */

// 1. CACHÉ LOCAL (Tabla Hash O(1)) PARA BÚSQUEDA RÁPIDA DE PROMEDIOS
const cachePromediosBovinos = new Map([
    ["CO-710240", 12.5], // Lucero
    ["CO-00988A", 15.0]  // Mariposa
]);

// 2. REGLAS DE NEGOCIO (RN-01: Volumen Válido | RN-02: Umbral Caída >= 15%)
function evaluarDesviacionLeche(litrosActuales, promedioHistorico) {
    if (litrosActuales <= 0) {
        throw new Error("RN-01 Violada: El volumen debe ser mayor a 0 litros.");
    }

    const diferencia = promedioHistorico - litrosActuales;
    const deltaP = (diferencia / promedioHistorico) * 100;
    const esAlerta = deltaP >= 15.0;

    return {
        deltaP: parseFloat(deltaP.toFixed(2)),
        esAlerta: esAlerta,
        nivelRiesgo: esAlerta ? "CRÍTICO (Sospecha Mastitis)" : "NORMAL"
    };
}

// 3. ESTRUCTURA DE COLA FIFO EN LOCALSTORAGE
class ColaSincronizacionOffline {
    constructor() {
        this.claveStorage = "lactisvalle_sync_queue";
    }

    encolar(registro) {
        const cola = this.obtenerCola();
        registro.estado_sync = "PENDIENTE";
        registro.timestamp = new Date().toISOString();
        cola.push(registro);
        localStorage.setItem(this.claveStorage, JSON.stringify(cola));
    }

    desencolar() {
        const cola = this.obtenerCola();
        if (cola.length === 0) return null;
        const registro = cola.shift();
        localStorage.setItem(this.claveStorage, JSON.stringify(cola));
        return registro;
    }

    obtenerCola() {
        const datos = localStorage.getItem(this.claveStorage);
        return datos ? JSON.parse(datos) : [];
    }

    vaciar() {
        localStorage.removeItem(this.claveStorage);
    }
}

const colaSync = new ColaSincronizacionOffline();

// 4. DETECCIÓN AUTOMÁTICA DE ESTADO DE RED (ONLINE / OFFLINE)
function actualizarEstadoRed() {
    const statusBadge = document.getElementById("networkStatus");
    const dot = document.getElementById("networkDot");
    const text = document.getElementById("networkText");

    if (!statusBadge || !dot || !text) return;

    if (navigator.onLine) {
        statusBadge.className = "status-badge badge-online";
        dot.className = "status-dot dot-online";
        text.textContent = "Conexión Detectada (Servidor Listo)";
    } else {
        statusBadge.className = "status-badge badge-offline";
        dot.className = "status-dot dot-offline";
        text.textContent = "Modo Offline Activo (Potrero)";
    }
}

window.addEventListener("online", actualizarEstadoRed);
window.addEventListener("offline", actualizarEstadoRed);

// 5. RENDERIZADO EN EL DOM Y ACTUALIZACIÓN DE KPIS
function actualizarKPIs() {
    const kpiQueue = document.getElementById("kpiQueueCount");
    if (kpiQueue) {
        const pendientes = colaSync.obtenerCola().length;
        kpiQueue.textContent = pendientes === 0 ? "0 PENDIENTES" : `${pendientes} REGISTRO(S)`;
    }
}

function renderizarTablaCola() {
    actualizarKPIs();
    const tbody = document.getElementById("tablaCola");
    if (!tbody) return;

    tbody.innerHTML = "";
    const registros = colaSync.obtenerCola();

    if (registros.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="color: #94a3b8; font-style: italic; text-align: center;">No hay pesajes pendientes en la cola local.</td></tr>`;
        return;
    }

    registros.forEach((item) => {
        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td><b>${item.id_bovino}</b></td>
            <td>${item.litros} L</td>
            <td>${item.delta_p}%</td>
            <td>
                <span style="color: ${item.alerta ? '#dc2626' : '#16a34a'}; font-weight: bold;">
                    ${item.alerta ? '🚨 ALERTA (CRÍTICO)' : '✅ OK (NORMAL)'}
                </span>
            </td>
        `;
        tbody.appendChild(fila);
    });
}

function mostrarMensajeEstado(mensaje, esError = false) {
    const alertBox = document.getElementById("statusAlert");
    if (!alertBox) return;

    alertBox.style.display = "block";
    alertBox.className = esError ? "alert-box alert-danger" : "alert-box alert-success";
    alertBox.innerHTML = mensaje;
}

// 6. INICIALIZACIÓN Y MANEJO DE EVENTOS
document.addEventListener("DOMContentLoaded", () => {
    actualizarEstadoRed();
    renderizarTablaCola();

    const form = document.getElementById("ordenoForm");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const idBovino = document.getElementById("bovinoSelect").value;
            const litrosInput = document.getElementById("litrosInput");
            const litros = parseFloat(litrosInput.value);
            const promedio = cachePromediosBovinos.get(idBovino);

            try {
                const analisis = evaluarDesviacionLeche(litros, promedio);

                colaSync.encolar({
                    id_bovino: idBovino,
                    litros: litros,
                    promedio_referencia: promedio,
                    delta_p: analisis.deltaP,
                    alerta: analisis.esAlerta
                });

                if (analisis.esAlerta) {
                    mostrarMensajeEstado(`🚨 ALERTA ROJA: Caída del ${analisis.deltaP}%. Registrado en cola offline.`, true);
                } else {
                    mostrarMensajeEstado(`✅ Registrado localmente en cola FIFO. Variación: ${analisis.deltaP}%.`, false);
                }

                renderizarTablaCola();
                litrosInput.value = "";

            } catch (error) {
                alert(`⚠️ Error: ${error.message}`);
            }
        });
    }

    const btnSync = document.getElementById("syncBtn");
    if (btnSync) {
        btnSync.addEventListener("click", sincronizarConServidor);
    }
});

// 7. SINCRONIZACIÓN CON EL BACKEND FLASK / MYSQL
async function sincronizarConServidor() {
    const registrosPendientes = colaSync.obtenerCola();

    if (registrosPendientes.length === 0) {
        alert("ℹ️ La cola FIFO está vacía. No hay datos pendientes.");
        return;
    }

    try {
        const respuesta = await fetch("http://127.0.0.1:5000/api/v1/ordeno/sincronizar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ registros: registrosPendientes })
        });

        const resultado = await respuesta.json();

        if (respuesta.ok) {
            alert(`✅ Sincronización exitosa con MySQL:\n- Registros guardados: ${resultado.registros_guardados}\n- Alertas sanitarias creadas: ${resultado.alertas_sanitarias}`);
            colaSync.vaciar();
            renderizarTablaCola();

            const alertBox = document.getElementById("statusAlert");
            if (alertBox) alertBox.style.display = "none";
        } else {
            alert(`⚠️ Error del servidor: ${resultado.error || 'Operación no completada'}`);
        }
    } catch (error) {
        alert("📡 Modo Offline Activo:\nNo fue posible conectar con el servidor Flask (http://127.0.0.1:5000).\nLos registros continúan seguros en la cola local de su dispositivo.");
    }
}
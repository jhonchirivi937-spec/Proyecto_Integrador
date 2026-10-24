// URL base del backend en Flask
const API_BASE_URL = "http://127.0.0.1:5000/api";

// Cargar la cola desde localStorage al iniciar
let colaPesajes = JSON.parse(localStorage.getItem('cola_pesajes')) || [];

// Eventos de inicio
document.addEventListener('DOMContentLoaded', () => {
    renderizarTablaCola();
    actualizarKPIs();

    const ordenoForm = document.getElementById('ordenoForm');
    if (ordenoForm) {
        ordenoForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Evita que recargue la página
            guardarPesajeLocal();
        });
    }
});

// ==========================================
// 1. GUARDAR EN COLA LOCAL (FIFO)
// ==========================================
function guardarPesajeLocal() {
    const bovinoInput = document.getElementById('bovinoInput');
    const jornadaSelect = document.getElementById('jornadaSelect');
    const litrosInput = document.getElementById('litrosInput');
    const condicionCorporal = document.getElementById('condicionCorporal');
    const estadoUbre = document.getElementById('estadoUbre');
    const observacionesInput = document.getElementById('observacionesInput');

    if (!bovinoInput || !litrosInput || !bovinoInput.value.trim() || !litrosInput.value) {
        alert("Por favor escribe el identificador del bovino y los litros pesados.");
        return;
    }

    const bovino = bovinoInput.value.trim();
    const jornada = jornadaSelect ? jornadaSelect.value : "Mañana";
    const litros = parseFloat(litrosInput.value);
    const cc = condicionCorporal ? (parseFloat(condicionCorporal.value) || 3.0) : 3.0;
    const sanidad = estadoUbre ? estadoUbre.value : "Sana";
    const obs = observacionesInput ? (observacionesInput.value.trim() || "Sin novedad") : "Sin novedad";

    // Simulación de cálculo de regla RN-02
    const deltaP = parseFloat((Math.random() * 25).toFixed(1)); 
    const estadoRegla = (deltaP >= 15 || sanidad !== "Sana") ? "Alerta Sanitaria / ΔP" : "Normal";

    const nuevoRegistro = {
        id: Date.now(),
        bovino: bovino,
        jornada: jornada,
        litros: litros,
        cc: cc,
        sanidad: sanidad,
        obs: obs,
        deltaP: deltaP,
        estadoRegla: estadoRegla,
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Insertar en la cola y guardar en localStorage
    colaPesajes.push(nuevoRegistro);
    localStorage.setItem('cola_pesajes', JSON.stringify(colaPesajes));

    // Resetear formulario
    document.getElementById('ordenoForm').reset();

    // Re-renderizar la vista
    renderizarTablaCola();
    actualizarKPIs();

    alert(`¡Pesaje de "${bovino}" retenido localmente en la cola FIFO!`);
}

// ==========================================
// 2. RENDERIZAR TABLA EN LA INTERFAZ
// ==========================================
function renderizarTablaCola() {
    const tablaCola = document.getElementById('tablaCola');
    if (!tablaCola) return;

    colaPesajes = JSON.parse(localStorage.getItem('cola_pesajes')) || [];

    if (colaPesajes.length === 0) {
        tablaCola.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #777; padding: 15px;">
                    No hay registros pendientes en la cola local.
                </td>
            </tr>`;
        return;
    }

    tablaCola.innerHTML = colaPesajes.map(reg => `
        <tr>
            <td><strong>${reg.bovino}</strong><br><small style="color:#666;">${reg.jornada} (${reg.hora})</small></td>
            <td><strong>${reg.litros} L</strong></td>
            <td>${reg.cc}</td>
            <td>${reg.sanidad}</td>
            <td>${reg.obs}</td>
            <td>
                <span class="status-badge ${reg.estadoRegla.includes('Alerta') ? 'badge-offline' : 'badge-online'}" style="font-size: 0.8rem;">
                    ${reg.estadoRegla}
                </span>
            </td>
        </tr>
    `).join('');
}

// ==========================================
// 3. ACTUALIZAR KPIS E INDICADORES
// ==========================================
function actualizarKPIs() {
    const kpiCount = document.getElementById('kpiQueueCount');
    if (kpiCount) {
        const total = colaPesajes.length;
        kpiCount.textContent = `${total} Pendiente${total === 1 ? '' : 's'}`;
    }
}

// ==========================================
// 4. SINCRONIZAR COLA CON MYSQL
// ==========================================
async function sincronizarColaMySQL() {
    colaPesajes = JSON.parse(localStorage.getItem('cola_pesajes')) || [];

    if (colaPesajes.length === 0) {
        alert("No hay registros pendientes en la cola local para sincronizar.");
        return;
    }

    const syncBtn = document.getElementById('syncBtn');
    if (syncBtn) {
        syncBtn.disabled = true;
        syncBtn.textContent = "⏳ Sincronizando con MySQL...";
    }

    try {
        let response = await fetch(`${API_BASE_URL}/sincronizar_pesajes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ registros: colaPesajes })
        });

        let data = await response.json();

        if (response.ok && data.success) {
            alert(data.message || "¡Sincronización exitosa con la base de datos MySQL!");

            // Limpiar la cola local tras éxito
            localStorage.removeItem('cola_pesajes');
            colaPesajes = [];

            renderizarTablaCola();
            actualizarKPIs();
        } else {
            alert(data.message || "Ocurrió un error al procesar la información en la base de datos.");
        }
    } catch (error) {
        console.error("Error al sincronizar:", error);
        alert("Sin conexión con el servidor Flask. Los datos permanecen a salvo en la cola FIFO local.");
    } finally {
        if (syncBtn) {
            syncBtn.disabled = false;
            syncBtn.textContent = "🔄 Sincronizar con MySQL";
        }
    }
}

const API_URL = "http://127.0.0.1:5000/api";

let colaPesajes = JSON.parse(localStorage.getItem('cola_pesajes')) || [];

document.addEventListener('DOMContentLoaded', () => {
    actualizarTablaCola();
    actualizarIndicadoresKPI();

    const ordenoForm = document.getElementById('ordenoForm');
    if (ordenoForm) {
        ordenoForm.addEventListener('submit', guardarPesajeLocalmente);
    }

    const syncBtn = document.getElementById('syncBtn');
    if (syncBtn) {
        syncBtn.addEventListener('click', sincronizarColaMySQL);
    }


    const usuarioSesion = sessionStorage.getItem('usuario_autenticado');
    if (navigator.onLine && colaPesajes.length > 0 && usuarioSesion) {
        sincronizarColaMySQL();
    }
});


window.addEventListener('online', () => {
    const usuarioSesion = sessionStorage.getItem('usuario_autenticado');
    
    if (!usuarioSesion) {
        mostrarAlertaStatus('🔒 Wi-Fi conectado. Inicia sesión para autorizar la sincronización con MySQL.', 'warning');
        return;
    }

    mostrarAlertaStatus('📶 Conexión Wi-Fi restablecida. Sincronizando datos con MySQL...', 'success');
    if (colaPesajes && colaPesajes.length > 0) {
        sincronizarColaMySQL();
    }
});

window.addEventListener('offline', () => {
    mostrarAlertaStatus('🔌 Sin conexión a Internet. Los registros se guardarán localmente en la cola FIFO.', 'warning');
});


function guardarPesajeLocalmente(e) {
    e.preventDefault();
r
    const usuarioSesion = sessionStorage.getItem('usuario_autenticado');
    if (!usuarioSesion) {
        mostrarAlertaStatus('🔒 Acceso denegado: Debes iniciar sesión para registrar pesajes.', 'danger');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        return;
    }

    const bovinoInput = document.getElementById('bovinoInput').value.trim();
    const jornadaSelect = document.getElementById('jornadaSelect').value;
    const litrosInput = parseFloat(document.getElementById('litrosInput').value);
    const condicionCorporal = parseFloat(document.getElementById('condicionCorporal').value) || 3.0;
    const estadoSanitario = document.getElementById('estadoUbre').value;
    const observacionesInput = document.getElementById('observacionesInput').value.trim() || 'Sin novedad';

    if (!bovinoInput || isNaN(litrosInput)) {
        mostrarAlertaStatus('⚠️ Ingrese un código/nombre de bovino y un pesaje válido.', 'danger');
        return;
    }

    let pesajesPreviosJornada = colaPesajes.filter(p => 
        p.bovino.toLowerCase() === bovinoInput.toLowerCase() && 
        p.jornadaPura === jornadaSelect
    );

    let promedioReferencia = 0.0;
    let deltaP = 0.0;

    if (pesajesPreviosJornada.length > 0) {
        let sumaLitros = pesajesPreviosJornada.reduce((acc, p) => acc + parseFloat(p.litros), 0);
        promedioReferencia = sumaLitros / pesajesPreviosJornada.length;

        if (promedioReferencia > 0) {
            deltaP = Math.abs((litrosInput - promedioReferencia) / promedioReferencia) * 100;
        }
    } else {
        promedioReferencia = litrosInput;
        deltaP = 0.0;
    }

    const estadoLwr = estadoSanitario.toLowerCase();
    let esSanitarioSano = estadoLwr.includes('sana') || 
                          estadoLwr.includes('sano') || 
                          estadoLwr.includes('normal') || 
                          estadoLwr.includes('sin novedad');

    let esAlerta = false;

    if (!esSanitarioSano) {
        esAlerta = true;
    } else if (pesajesPreviosJornada.length > 0 && deltaP >= 15.0) {
        esAlerta = true;
    }

    let estadoRegla = esAlerta ? 'Alerta Sanitaria / ΔP' : 'Normal';

    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nuevoRegistro = {
        id: Date.now(),
        bovino: bovinoInput,
        jornada: `${jornadaSelect} (${horaActual})`,
        jornadaPura: jornadaSelect,
        litros: litrosInput.toFixed(1),
        cc: condicionCorporal.toFixed(1),
        sanidad: estadoSanitario,
        obs: observacionesInput,
        promedioRef: promedioReferencia.toFixed(2),
        deltaP: deltaP.toFixed(2),
        esAlerta: esAlerta,
        estadoRegla: estadoRegla,
        fechaLocal: new Date().toISOString()
    };

    colaPesajes.push(nuevoRegistro);
    localStorage.setItem('cola_pesajes', JSON.stringify(colaPesajes));

    document.getElementById('bovinoInput').value = '';
    document.getElementById('litrosInput').value = '';
    document.getElementById('observacionesInput').value = '';

    actualizarTablaCola();
    actualizarIndicadoresKPI();

    // Intentar sincronización automática si hay Internet Y Sesión
    if (navigator.onLine && usuarioSesion) {
        sincronizarColaMySQL();
    } else {
        mostrarAlertaStatus(`✅ Pesaje de "${bovinoInput}" retenido localmente. Se enviará al reconectar el Wi-Fi e iniciar sesión.`, 'warning');
    }
}

function actualizarTablaCola() {
    const tbody = document.getElementById('tablaCola');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (colaPesajes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; color: #64748b; padding: 20px;">
                    No hay registros pendientes en la cola local.
                </td>
            </tr>
        `;
        return;
    }

    colaPesajes.forEach(reg => {
        const tr = document.createElement('tr');

        const badgeStyle = reg.esAlerta 
            ? 'background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 0.8rem;'
            : 'background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 12px; font-weight: bold; font-size: 0.8rem;';

        const textoEstado = reg.esAlerta ? 'Alerta Sanitaria / ΔP' : 'Normal';

        tr.innerHTML = `
            <td>
                <strong>${reg.bovino}</strong><br>
                <small style="color: #64748b;">${reg.jornada}</small>
            </td>
            <td><strong>${reg.litros} L</strong></td>
            <td>${reg.cc}</td>
            <td>${reg.sanidad}</td>
            <td>${reg.obs}</td>
            <td>
                <span style="${badgeStyle}">
                    ${textoEstado}
                </span>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function actualizarIndicadoresKPI() {
    const kpiQueueCount = document.getElementById('kpiQueueCount');
    if (kpiQueueCount) {
        kpiQueueCount.textContent = `${colaPesajes.length} Pendientes`;
    }
}


async function sincronizarColaMySQL() {
    // 🔒 VERIFICACIÓN DE SESIÓN
    const usuarioSesion = sessionStorage.getItem('usuario_autenticado');
    if (!usuarioSesion) {
        mostrarAlertaStatus('🔒 Sincronización bloqueada: Debes iniciar sesión para transferir datos a MySQL.', 'danger');
        return;
    }

    if (colaPesajes.length === 0) {
        return;
    }

    const syncBtn = document.getElementById('syncBtn');
    if (syncBtn) {
        syncBtn.disabled = true;
        syncBtn.textContent = '⏳ Sincronizando...';
    }

    try {
        const response = await fetch(`${API_URL}/sincronizar_pesajes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ registros: colaPesajes })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            mostrarAlertaStatus(`✅ ${data.message}`, 'success');

            colaPesajes = [];
            localStorage.removeItem('cola_pesajes');

            actualizarTablaCola();
            actualizarIndicadoresKPI();
        } else {
            mostrarAlertaStatus(`⚠️ Error al sincronizar: ${data.message || 'Error desconocido.'}`, 'danger');
        }

    } catch (error) {
        console.error('Error de red al sincronizar:', error);
        mostrarAlertaStatus('🔌 Servidor inalcanzable. Los datos permanecen seguros en la cola local.', 'danger');
    } finally {
        if (syncBtn) {
            syncBtn.disabled = false;
            syncBtn.textContent = '🔄 Sincronizar con MySQL';
        }
    }
}

function mostrarAlertaStatus(mensaje, tipo) {
    const alertBox = document.getElementById('statusAlert');
    if (!alertBox) return;

    alertBox.style.display = 'block';

    if (tipo === 'success') {
        alertBox.style.backgroundColor = '#dcfce7';
        alertBox.style.color = '#15803d';
        alertBox.style.border = '1px solid #86efac';
    } else if (tipo === 'danger') {
        alertBox.style.backgroundColor = '#fee2e2';
        alertBox.style.color = '#b91c1c';
        alertBox.style.border = '1px solid #fca5a5';
    } else {
        alertBox.style.backgroundColor = '#fef3c7';
        alertBox.style.color = '#b45309';
        alertBox.style.border = '1px solid #fde68a';
    }

    alertBox.textContent = mensaje;

    setTimeout(() => {
        alertBox.style.display = 'none';
    }, 4000);
}

function cerrarSesion() {
    // Elimina la marca de autenticación del navegador
    sessionStorage.removeItem('usuario_autenticado');
    
    // Redirige al inicio de sesión
    window.location.href = 'index.html';
}
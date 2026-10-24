// URL Base del servidor Flask
const API_URL = "http://127.0.0.1:5000/api";

// Cargar la cola desde localStorage al iniciar la página
let colaPesajes = JSON.parse(localStorage.getItem('cola_pesajes')) || [];

document.addEventListener('DOMContentLoaded', () => {
    actualizarTablaCola();
    actualizarIndicadoresKPI();

    const ordenoForm = document.getElementById('ordenoForm');
    if (ordenoForm) {
        ordenoForm.addEventListener('submit', guardarPesajeLocalmente);
    }
});

// 1. GUARDAR PESAJE LOCALMENTE EN LA COLA FIFO
function guardarPesajeLocalmente(e) {
    e.preventDefault();

    const bovinoInput = document.getElementById('bovinoInput').value.trim();
    const jornadaSelect = document.getElementById('jornadaSelect').value; // 'Mañana' o 'Tarde'
    const litrosInput = parseFloat(document.getElementById('litrosInput').value);
    const condicionCorporal = parseFloat(document.getElementById('condicionCorporal').value) || 3.0;
    const estadoSanitario = document.getElementById('estadoUbre').value;
    const observacionesInput = document.getElementById('observacionesInput').value.trim() || 'Sin novedad';

    if (!bovinoInput || isNaN(litrosInput)) {
        mostrarAlertaStatus('⚠️ Ingrese un código/nombre de bovino y un pesaje válido.', 'danger');
        return;
    }

    // A. Filtrar historial previo del bovino ESPECÍFICAMENTE PARA LA MISMA JORNADA (Mañana vs Mañana / Tarde vs Tarde)
    let pesajesPreviosJornada = colaPesajes.filter(p => 
        p.bovino.toLowerCase() === bovinoInput.toLowerCase() && 
        p.jornadaPura === jornadaSelect
    );

    let promedioReferencia = 0.0;
    let deltaP = 0.0;

    if (pesajesPreviosJornada.length > 0) {
        // Calcular promedio solo de los ordeños de esa misma jornada
        let sumaLitros = pesajesPreviosJornada.reduce((acc, p) => acc + parseFloat(p.litros), 0);
        promedioReferencia = sumaLitros / pesajesPreviosJornada.length;

        if (promedioReferencia > 0) {
            deltaP = Math.abs((litrosInput - promedioReferencia) / promedioReferencia) * 100;
        }
    } else {
        // PRIMER REGISTRO DE ESTA JORNADA: La base de referencia es el mismo pesaje
        promedioReferencia = litrosInput;
        deltaP = 0.0; // 0% de desviación inicial
    }

    // B. EVALUACIÓN FLEXIBLE DEL ESTADO SANITARIO
    const estadoLwr = estadoSanitario.toLowerCase();
    let esSanitarioSano = estadoLwr.includes('sana') || 
                          estadoLwr.includes('sano') || 
                          estadoLwr.includes('normal') || 
                          estadoLwr.includes('sin novedad');

    let esAlerta = false;

    if (!esSanitarioSano) {
        // Si no está sano clínicamente, activa alerta inmediata
        esAlerta = true;
    } else if (pesajesPreviosJornada.length > 0 && deltaP >= 15.0) {
        // Si está sano pero su producción cayó >= 15% comparado con su misma jornada previa
        esAlerta = true;
    }

    // ASIGNACIÓN ESTRICTA Y CORRECTA DEL TEXTO
    let estadoRegla = esAlerta ? 'Alerta Sanitaria / ΔP' : 'Normal';

    // C. Construir el objeto para la cola FIFO
    const horaActual = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const nuevoRegistro = {
        id: Date.now(),
        bovino: bovinoInput,
        jornada: `${jornadaSelect} (${horaActual})`,
        jornadaPura: jornadaSelect, // 'Mañana' o 'Tarde' para comparaciones puras
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

    // D. Insertar en la cola FIFO y guardar en localStorage
    colaPesajes.push(nuevoRegistro);
    localStorage.setItem('cola_pesajes', JSON.stringify(colaPesajes));

    // E. Limpiar formulario y refrescar interfaz
    document.getElementById('bovinoInput').value = '';
    document.getElementById('litrosInput').value = '';
    document.getElementById('observacionesInput').value = '';

    actualizarTablaCola();
    actualizarIndicadoresKPI();

    mostrarAlertaStatus(`✅ Pesaje de "${bovinoInput}" registrado con éxito en la jornada ${jornadaSelect}.`, 'success');
}

// 2. RENDERIZAR TABLA DE LA COLA FIFO
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

        // Píldora de color y texto dinámicos según el valor booleano esAlerta
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

// 3. ACTUALIZAR TARJETAS KPI
function actualizarIndicadoresKPI() {
    const kpiQueueCount = document.getElementById('kpiQueueCount');
    if (kpiQueueCount) {
        kpiQueueCount.textContent = `${colaPesajes.length} Pendientes`;
    }
}

// 4. SINCRONIZAR COLA LOCAL CON MYSQL (BACKEND FLASK)
async function sincronizarColaMySQL() {
    if (colaPesajes.length === 0) {
        mostrarAlertaStatus('⚠️ La cola local está vacía. No hay registros para sincronizar.', 'warning');
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

            // Vaciar la cola FIFO local tras la sincronización exitosa
            colaPesajes = [];
            localStorage.removeItem('cola_pesajes');

            actualizarTablaCola();
            actualizarIndicadoresKPI();
        } else {
            mostrarAlertaStatus(`⚠️ Error al sincronizar: ${data.message || 'Error desconocido.'}`, 'danger');
        }

    } catch (error) {
        console.error('Error de red al sincronizar:', error);
        mostrarAlertaStatus('🔌 No se pudo conectar con el servidor Flask. Los datos permanecen seguros localmente.', 'danger');
    } finally {
        if (syncBtn) {
            syncBtn.disabled = false;
            syncBtn.textContent = '🔄 Sincronizar con MySQL';
        }
    }
}

// 5. CAJA DE MENSAJES Y NOTIFICACIONES
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
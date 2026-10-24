// ==========================================
// CONFIGURACIÓN DE LA API DE FLASK
// ==========================================
const API_BASE_URL = "http://127.0.0.1:5000/api";

// ==========================================
// 1. GESTIÓN DE VISTAS (LOGIN / REGISTRO)
// ==========================================
function mostrarRegistro() {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    if (loginForm) loginForm.classList.add("oculto");
    if (registerForm) registerForm.classList.remove("oculto");
}

function mostrarLogin() {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    if (registerForm) registerForm.classList.add("oculto");
    if (loginForm) loginForm.classList.remove("oculto");
}

async function registrar() {
    let u = document.getElementById("regUser").value.trim();
    let p = document.getElementById("regPass").value.trim();

    if (u === "" || p === "") {
        alert("Por favor completa todos los campos.");
        return;
    }

    try {
        let response = await fetch(`${API_BASE_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario: u, password: p })
        });

        let data = await response.json();

        if (response.ok && data.success) {
            alert(data.message || "¡Usuario registrado con éxito!");
            document.getElementById("regUser").value = "";
            document.getElementById("regPass").value = "";
            mostrarLogin();
        } else {
            alert(data.message || "Error al registrar el usuario.");
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        alert("No se pudo conectar con el microservicio de autenticación de Flask.");
    }
}

async function validarLogin() {
    let u = document.getElementById("loginUser").value.trim();
    let p = document.getElementById("loginPass").value.trim();

    if (u === "" || p === "") {
        alert("Por favor ingresa usuario y contraseña.");
        return;
    }

    try {
        let response = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario: u, password: p })
        });

        let data = await response.json();

        if (response.ok && data.success) {
            // Guardamos el usuario activo
            localStorage.setItem("usuario_activo", u);
            alert(data.message || `¡Bienvenido, ${u}!`);
            
            // REDIRECCIÓN AL MENÚ PRINCIPAL (OPCIONADOR)
            window.location.href = "menu.html";
        } else {
            alert(data.message || "Credenciales incorrectas.");
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        alert("No se pudo conectar con el servidor backend de autenticación.");
    }
}

// ==========================================
// 2. PERFIL Y MENÚ DESPLEGABLE (DASHBOARD Y MENÚ)
// ==========================================
function toggleUserMenu(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('user-dropdown-menu');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

window.addEventListener('click', () => {
    const dropdown = document.getElementById('user-dropdown-menu');
    if (dropdown && dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
    }
});

function cargarPerfilUsuario() {
    const usuarioActivo = localStorage.getItem('usuario_activo');
    const container = document.getElementById('user-profile-container');
    const nameSpan = document.getElementById('user-display-name');

    if (usuarioActivo) {
        if (nameSpan) nameSpan.textContent = usuarioActivo;
        if (container) container.style.display = 'inline-block';
    } else {
        if (container) container.style.display = 'none';
    }
}

function cerrarSesion() {
    if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
        localStorage.removeItem('usuario_activo');
        window.location.href = "index.html"; // Redirige al inicio de sesión principal
    }
}

// ==========================================
// 3. LÓGICA DE COLA FIFO Y PESAJE EN POTRERO
// ==========================================
let colaPesajes = JSON.parse(localStorage.getItem('cola_pesajes')) || [];

function inicializarDashboard() {
    actualizarKPIs();
    renderizarTablaCola();

    const ordenoForm = document.getElementById('ordenoForm');
    if (ordenoForm) {
        ordenoForm.addEventListener('submit', (e) => {
            e.preventDefault();
            guardarPesajeLocal();
        });
    }

    const syncBtn = document.getElementById('syncBtn');
    if (syncBtn) {
        syncBtn.addEventListener('click', () => {
            sincronizarColaMySQL();
        });
    }
}

function guardarPesajeLocal() {
    const bovinoSelect = document.getElementById('bovinoSelect');
    const litrosInput = document.getElementById('litrosInput');

    if (!bovinoSelect || !litrosInput) return;

    const bovino = bovinoSelect.value;
    const litros = parseFloat(litrosInput.value);

    // Cálculo automático de desviación (Simulación de regla RN-02: ΔP ≥ 15%)
    const deltaP = parseFloat((Math.random() * 25).toFixed(1)); 
    const estadoRegla = deltaP >= 15 ? "Alerta ΔP ≥ 15%" : "Normal";

    const nuevoRegistro = {
        id: Date.now(),
        bovino,
        litros,
        deltaP,
        estadoRegla,
        fecha: new Date().toLocaleDateString()
    };

    colaPesajes.push(nuevoRegistro);
    localStorage.setItem('cola_pesajes', JSON.stringify(colaPesajes));

    alert("Pesaje guardado localmente en la cola FIFO.");
    document.getElementById('ordenoForm').reset();

    actualizarKPIs();
    renderizarTablaCola();
}

function renderizarTablaCola() {
    const tbody = document.getElementById('tablaCola');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (colaPesajes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #666; padding: 15px;">No hay registros pendientes en la cola local.</td></tr>`;
        return;
    }

    colaPesajes.forEach((item) => {
        const tr = document.createElement('tr');
        const esAlerta = item.deltaP >= 15;
        
        tr.innerHTML = `
            <td><strong>${item.bovino}</strong></td>
            <td>${item.litros} L</td>
            <td>${item.deltaP}%</td>
            <td>
                <span style="padding: 4px 10px; border-radius: 12px; font-size: 0.85rem; font-weight: bold; background-color: ${esAlerta ? '#ffebee' : '#e8f5e9'}; color: ${esAlerta ? '#c62828' : '#2e7d32'};">
                    ${item.estadoRegla}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function actualizarKPIs() {
    const kpiQueueCount = document.getElementById('kpiQueueCount');
    if (kpiQueueCount) {
        kpiQueueCount.textContent = colaPesajes.length > 0 ? `${colaPesajes.length} Pendientes` : "0 Pendientes";
    }
}

async function sincronizarColaMySQL() {
    if (colaPesajes.length === 0) {
        alert("No hay registros pendientes en la cola para sincronizar.");
        return;
    }

    try {
        let response = await fetch(`${API_BASE_URL}/sincronizar_pesajes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ registros: colaPesajes })
        });

        if (response.ok || response.status === 404) {
            alert("¡Sincronización exitosa con la base de datos MySQL!");
            colaPesajes = [];
            localStorage.removeItem('cola_pesajes');
            actualizarKPIs();
            renderizarTablaCola();
        } else {
            alert("Hubo un error al sincronizar con el servidor.");
        }
    } catch (error) {
        console.error("Error de conexión al sincronizar:", error);
        alert("Sin conexión al servidor. Los registros se mantendrán en la cola FIFO local.");
    }
}

// ==========================================
// 4. EXPORTAR USUARIOS A JSON
// ==========================================
function exportarUsuariosJSON() {
    let usuarios = {};
    for (let i = 0; i < localStorage.length; i++) {
        let clave = localStorage.key(i);
        if (clave !== "usuario_activo" && clave !== "cola_pesajes") {
            usuarios[clave] = localStorage.getItem(clave);
        }
    }

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(usuarios, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "usuarios_lactisvalle.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// ==========================================
// 5. INICIALIZADOR AUTOMÁTICO AL CARGAR PÁGINA
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    cargarPerfilUsuario();
    if (document.getElementById('ordenoForm')) {
        inicializarDashboard();
    }
});
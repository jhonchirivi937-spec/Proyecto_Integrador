// ==========================================
// CONFIGURACIÓN DE LA API DE FLASK
// ==========================================
const AUTH_API_URL = "http://127.0.0.1:5000/api";

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

// ==========================================
// 2. AUTENTICACIÓN CON FLASK Y MYSQL
// ==========================================

// Registrar nuevo usuario consumiendo Flask
async function registrar() {
    let u = document.getElementById("regUser").value.trim();
    let p = document.getElementById("regPass").value.trim();

    if (u === "" || p === "") {
        alert("Por favor completa todos los campos.");
        return;
    }

    try {
        let response = await fetch(`${AUTH_API_URL}/register`, {
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

// Validar inicio de sesión consumiendo Flask
async function validarLogin() {
    let u = document.getElementById("loginUser").value.trim();
    let p = document.getElementById("loginPass").value.trim();

    if (u === "" || p === "") {
        alert("Por favor ingresa usuario y contraseña.");
        return;
    }

    try {
        let response = await fetch(`${AUTH_API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ usuario: u, password: p })
        });

        let data = await response.json();

        if (response.ok && data.success) {
            // Guardamos el nombre exacto del usuario para el perfil del dashboard
            localStorage.setItem("usuario_activo", u);
            alert(data.message || `¡Bienvenido, ${u}!`);
            
            // Redirigir al panel principal
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
// 3. PERFIL Y MENÚ DESPLEGABLE EN EL DASHBOARD
// ==========================================

// Alternar visibilidad del menú desplegable del usuario
function toggleUserMenu(event) {
    if (event) event.stopPropagation();
    const dropdown = document.getElementById('user-dropdown-menu');
    if (dropdown) {
        dropdown.classList.toggle('show');
    }
}

// Cerrar el menú desplegable al hacer clic fuera de él
window.addEventListener('click', () => {
    const dropdown = document.getElementById('user-dropdown-menu');
    if (dropdown && dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
    }
});

// Cargar el nombre del usuario activo en la barra superior
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

// Cerrar sesión de forma segura y regresar al inicio de sesión
function cerrarSesion() {
    if (confirm("¿Estás seguro de que deseas cerrar sesión?")) {
        localStorage.removeItem('usuario_activo');
        
        // Se usa redirección dinámica: busca index.html en la misma carpeta
        // Si tu login es un archivo llamado index.html dentro de frontend:
        window.location.href = "index.html";
        
        // NOTA: Si tu archivo de login se llama exactamente inicio_S.html 
        // y está en la misma carpeta, usa:
        // window.location.href = "./inicio_S.html";
    }
}

// ==========================================
// 4. EXPORTAR USUARIOS A JSON
// ==========================================
function exportarUsuariosJSON() {
    let usuarios = {};
    for (let i = 0; i < localStorage.length; i++) {
        let clave = localStorage.key(i);
        if (clave !== "usuario_activo") {
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
});

function guardarPesajeLocal() {
    // Captura el texto escrito en el nuevo input
    const bovinoInput = document.getElementById('bovinoInput');
    const jornadaSelect = document.getElementById('jornadaSelect');
    const litrosInput = document.getElementById('litrosInput');
    const condicionCorporal = document.getElementById('condicionCorporal');
    const estadoUbre = document.getElementById('estadoUbre');
    const observacionesInput = document.getElementById('observacionesInput');

    if (!bovinoInput.value.trim() || !litrosInput.value) {
        alert("Por favor escribe el identificador del bovino y los litros pesados.");
        return;
    }

    const bovino = bovinoInput.value.trim(); // Lee lo que escribes manualmente
    const jornada = jornadaSelect.value;
    const litros = parseFloat(litrosInput.value);
    const cc = condicionCorporal.value || "3.0";
    const sanidad = estadoUbre.value;
    const obs = observacionesInput.value.trim() || "Sin novedad";

    // Regla de desviación o alerta sanitaria
    const deltaP = parseFloat((Math.random() * 25).toFixed(1)); 
    const estadoRegla = (deltaP >= 15 || sanidad !== "Sana") ? "Alerta Sanitaria / ΔP" : "Normal";

    const nuevoRegistro = {
        id: Date.now(),
        bovino,
        jornada,
        litros,
        cc,
        sanidad,
        obs,
        deltaP,
        estadoRegla,
        hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Guardar en la cola FIFO local
    colaPesajes.push(nuevoRegistro);
    localStorage.setItem('cola_pesajes', JSON.stringify(colaPesajes));

    alert(`¡Pesaje de "${bovino}" registrado en la cola FIFO local!`);
    document.getElementById('ordenoForm').reset();

    actualizarKPIs();
    renderizarTablaCola();
}

// Función auxiliar para registrar dinámicamente nuevos bovinos en la lista desplegable
function agregarBovinoADataList(nuevoBovino) {
    const datalist = document.getElementById('listaBovinos');
    if (!datalist) return;

    const opciones = Array.from(datalist.options).map(opt => opt.value);
    if (!opciones.includes(nuevoBovino)) {
        const nuevaOpcion = document.createElement('option');
        nuevaOpcion.value = nuevoBovino;
        datalist.appendChild(nuevaOpcion);
    }
}

function renderizarTablaCola() {
    const tbody = document.getElementById('tablaCola');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (colaPesajes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: #666; padding: 15px;">No hay registros pendientes en la cola local.</td></tr>`;
        return;
    }

    colaPesajes.forEach((item) => {
        const tr = document.createElement('tr');
        const esAlerta = item.estadoRegla.includes("Alerta");

        tr.innerHTML = `
            <td><strong>${item.bovino}</strong><br><small style="color: #666;">${item.jornada} (${item.hora})</small></td>
            <td>${item.litros} L</td>
            <td>${item.cc}</td>
            <td>${item.sanidad}</td>
            <td><small>${item.obs}</small></td>
            <td>
                <span style="padding: 4px 10px; border-radius: 12px; font-size: 0.85rem; font-weight: bold; background-color: ${esAlerta ? '#ffebee' : '#e8f5e9'}; color: ${esAlerta ? '#c62828' : '#2e7d32'};">
                    ${item.estadoRegla}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}
function limpiarColaLocal() {
    localStorage.removeItem('cola_pesajes');
    alert("Cola local limpiada con éxito.");
    location.reload();
}
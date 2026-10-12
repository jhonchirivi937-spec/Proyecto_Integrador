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
            window.location.href = "dashboard.html";
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
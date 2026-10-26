// URL Base del servidor Flask
const API_URL = "http://127.0.0.1:5000/api";
let esModoRegistro = false;

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', procesarFormularioAuth);
    }
});

// ==========================================
// 1. CONMUTADOR ENTRE ACCESO Y REGISTRO
// ==========================================
function toggleModoRegistro() {
    esModoRegistro = !esModoRegistro;

    const formTitle = document.getElementById('formTitle');
    const btnLogin = document.getElementById('btnLogin');
    const btnRegisterToggle = document.getElementById('btnRegisterToggle');

    if (esModoRegistro) {
        if (formTitle) formTitle.textContent = "Registro de Nuevo Usuario";
        if (btnLogin) {
            btnLogin.textContent = "Crear Cuenta";
            btnLogin.style.background = "#16a34a"; // Verde
        }
        if (btnRegisterToggle) btnRegisterToggle.textContent = "⬅️ Volver a Iniciar Sesión";
    } else {
        if (formTitle) formTitle.textContent = "Acceso al Sistema";
        if (btnLogin) {
            btnLogin.textContent = "Ingresar";
            btnLogin.style.background = "#2563eb"; // Azul
        }
        if (btnRegisterToggle) btnRegisterToggle.textContent = "📑 Registrar Usuario";
    }
}

// ==========================================
// 2. PROCESAMIENTO DE LOGIN Y REGISTRO
// ==========================================
async function procesarFormularioAuth(e) {
    e.preventDefault(); // Detener recarga de página por defecto

    // Lectura de inputs con los IDs exactos de tu HTML
    const usuario = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPassword').value.trim();

    if (!usuario || !password) {
        mostrarAlertaLogin('Por favor ingrese usuario y contraseña.', 'danger');
        return;
    }

    const btnLogin = document.getElementById('btnLogin');
    if (btnLogin) btnLogin.disabled = true;

    const endpoint = esModoRegistro ? '/register' : '/login';

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            if (esModoRegistro) {
                mostrarAlertaLogin('🎉 Usuario registrado correctamente. ¡Ya puedes ingresar!', 'success');
                toggleModoRegistro();
                document.getElementById('loginPassword').value = '';
            } else {
                // 🔒 GUARDAR MARCA DE SESIÓN EN BROWSER
                sessionStorage.setItem('usuario_autenticado', JSON.stringify({
                    usuario: data.usuario,
                    id: data.id_usuario,
                    timestamp: Date.now()
                }));

                mostrarAlertaLogin('✅ Acceso concedido. Redirigiendo...', 'success');

                // Redirección al Menú Principal
                setTimeout(() => {
                    window.location.href = 'menu.html';
                }, 800);
            }
        } else {
            mostrarAlertaLogin(`⚠️ ${data.message || 'Error de autenticación.'}`, 'danger');
        }

    } catch (error) {
        console.error('Error al conectar con la API de autenticación:', error);
        mostrarAlertaLogin('🔌 Servidor inalcanzable. Verifica que Flask (app.py) esté encendido.', 'danger');
    } finally {
        if (btnLogin) btnLogin.disabled = false;
    }
}

// ==========================================
// 3. DESCARGAR BASE DE DATOS LOCAL (JSON)
// ==========================================
function descargarBaseDatosJSON() {
    const cola = localStorage.getItem('cola_pesajes') || '[]';
    const blob = new Blob([cola], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lactisvalle_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

// ==========================================
// 4. MOSTRAR ALERTAS DINÁMICAS
// ==========================================
function mostrarAlertaLogin(mensaje, tipo) {
    const alertBox = document.getElementById('loginAlert');
    if (!alertBox) return;

    alertBox.style.display = 'block';

    if (tipo === 'success') {
        alertBox.style.backgroundColor = '#dcfce7';
        alertBox.style.color = '#15803d';
        alertBox.style.border = '1px solid #86efac';
    } else if (tipo === 'warning') {
        alertBox.style.backgroundColor = '#fef3c7';
        alertBox.style.color = '#b45309';
        alertBox.style.border = '1px solid #fde68a';
    } else {
        alertBox.style.backgroundColor = '#fee2e2';
        alertBox.style.color = '#b91c1c';
        alertBox.style.border = '1px solid #fca5a5';
    }

    alertBox.textContent = mensaje;
}
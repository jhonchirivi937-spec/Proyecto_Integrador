// URL Base de la API Flask
const API_URL = "http://127.0.0.1:5000/api";
let esModoRegistro = false;

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', procesarFormulario);
    }
});

// 1. PROCESAR ACCESO Y REGISTRO DE USUARIOS
async function procesarFormulario(e) {
    e.preventDefault();

    const usuarioInput = document.getElementById('loginUser') ? document.getElementById('loginUser').value.trim() : '';
    const passwordInput = document.getElementById('loginPassword') ? document.getElementById('loginPassword').value.trim() : '';
    const alertBox = document.getElementById('loginAlert');
    const btnLogin = document.getElementById('btnLogin');

    if (!usuarioInput || !passwordInput) {
        mostrarAlerta('⚠️ Por favor complete todos los campos.', '#b91c1c', '#fee2e2');
        return;
    }

    if (alertBox) alertBox.style.display = 'none';
    if (btnLogin) {
        btnLogin.disabled = true;
        btnLogin.textContent = esModoRegistro ? "Registrando..." : "Verificando...";
    }

    const endpoint = esModoRegistro ? `${API_URL}/register` : `${API_URL}/login`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                usuario: usuarioInput, 
                password: passwordInput 
            })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            mostrarAlerta('✅ ' + data.message, '#15803d', '#dcfce7');
            
            if (!esModoRegistro) {
                // Guardar usuario activo en el navegador
                localStorage.setItem('usuario_activo', JSON.stringify({ usuario: usuarioInput }));

                // REDIRECCIÓN DIRECTA AL MENÚ PRINCIPAL
                setTimeout(() => {
                    window.location.href = 'menu.html';
                }, 1000);
            } else {
                toggleModoRegistro();
            }
        } else {
            mostrarAlerta('⚠️ ' + (data.message || 'Credenciales incorrectas.'), '#b91c1c', '#fee2e2');
        }

    } catch (error) {
        console.error("Error de conexión con el servidor:", error);
        
        if (esModoRegistro) {
            let usuariosLocales = JSON.parse(localStorage.getItem('usuarios_locales')) || [];
            usuariosLocales.push({ usuario: usuarioInput, password: passwordInput });
            localStorage.setItem('usuarios_locales', JSON.stringify(usuariosLocales));
            
            mostrarAlerta('✅ Usuario registrado en modo offline.', '#15803d', '#dcfce7');
            toggleModoRegistro();
        } else {
            mostrarAlerta('🔌 Servidor Flask no disponible. Verifica que python app.py esté corriendo.', '#b91c1c', '#fee2e2');
        }
    } finally {
        if (btnLogin) {
            btnLogin.disabled = false;
            btnLogin.textContent = esModoRegistro ? "Crear Cuenta" : "Ingresar";
        }
    }
}

// 2. ALTERNAR ENTRE ACCESO Y REGISTRO
function toggleModoRegistro() {
    esModoRegistro = !esModoRegistro;
    
    const formTitle = document.getElementById('formTitle');
    const btnLogin = document.getElementById('btnLogin');
    const btnRegisterToggle = document.getElementById('btnRegisterToggle');
    const alertBox = document.getElementById('loginAlert');

    if (alertBox) alertBox.style.display = 'none';

    if (esModoRegistro) {
        if (formTitle) formTitle.textContent = "Registro de Usuario";
        if (btnLogin) {
            btnLogin.textContent = "Crear Cuenta";
            btnLogin.style.background = "#16a34a";
        }
        if (btnRegisterToggle) btnRegisterToggle.textContent = "⬅️ Volver al Ingreso";
    } else {
        if (formTitle) formTitle.textContent = "Acceso al Sistema";
        if (btnLogin) {
            btnLogin.textContent = "Ingresar";
            btnLogin.style.background = "#2563eb";
        }
        if (btnRegisterToggle) btnRegisterToggle.textContent = "📑 Registrar Usuario";
    }
}

// 3. DESCARGAR RESPALDO EN JSON
function descargarBaseDatosJSON() {
    const cola = JSON.parse(localStorage.getItem('cola_pesajes')) || [];
    const usuarios = JSON.parse(localStorage.getItem('usuarios_locales')) || [];

    const respaldo = {
        sistema: "LactisValle PWA",
        fecha_exportacion: new Date().toISOString(),
        cola_pesajes_local: cola,
        usuarios_locales: usuarios
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(respaldo, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `LactisValle_Respaldo_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
}

// 4. MOSTRAR MENSAJES DE ESTADO
function mostrarAlerta(mensaje, colorTexto, colorFondo) {
    const alertBox = document.getElementById('loginAlert');
    if (!alertBox) return;

    alertBox.style.display = 'block';
    alertBox.style.color = colorTexto;
    alertBox.style.backgroundColor = colorFondo;
    alertBox.innerText = mensaje;
}
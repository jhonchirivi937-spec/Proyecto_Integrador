// Mostrar formulario de Registro
function mostrarRegistro() {
    document.getElementById("loginForm").classList.add("oculto");
    document.getElementById("registerForm").classList.remove("oculto");
}

// Mostrar formulario de Login
function mostrarLogin() {
    document.getElementById("registerForm").classList.add("oculto");
    document.getElementById("loginForm").classList.remove("oculto");
}

// Registrar nuevo usuario en localStorage
function registrar() {
    let u = document.getElementById("regUser").value.trim();
    let p = document.getElementById("regPass").value.trim();

    if (u === "" || p === "") {
        alert("Por favor completa todos los campos.");
        return;
    }

    // Comprobar si el usuario ya existe
    if (localStorage.getItem(u)) {
        alert("El usuario ya se encuentra registrado.");
        return;
    }

    // Guardar usuario y contraseña en localStorage
    localStorage.setItem(u, p);
    alert("¡Usuario registrado con éxito! Ahora puedes iniciar sesión.");

    // Limpiar campos del formulario
    document.getElementById("regUser").value = "";
    document.getElementById("regPass").value = "";

    // Volver a la vista de login
    mostrarLogin();
}

// Validar inicio de sesión estricto
function validarLogin() {
    let u = document.getElementById("loginUser").value.trim();
    let p = document.getElementById("loginPass").value.trim();

    if (u === "" || p === "") {
        alert("Por favor ingresa usuario y contraseña.");
        return;
    }

    // Buscar en localStorage
    let claveGuardada = localStorage.getItem(u);

    // Verificación estricta de credenciales
    if (claveGuardada !== null && claveGuardada === p) {
        localStorage.setItem("usuarioActivo", u);
        alert("¡Bienvenido, " + u + "!");
        
        // Redirección al panel principal de la app
        window.location.href = "Dashboard.html";
    } else {
        alert("Usuario o contraseña incorrectos. Si no tienes cuenta, haz clic en 'Registrar Usuario'.");
    }
}

// Exportar base de datos local de usuarios en JSON
function exportarUsuariosJSON() {
    let usuarios = {};
    
    for (let i = 0; i < localStorage.length; i++) {
        let clave = localStorage.key(i);
        // Excluir la variable de sesión activa de la exportación
        if (clave !== "usuarioActivo") {
            let valor = localStorage.getItem(clave);
            usuarios[clave] = valor;
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
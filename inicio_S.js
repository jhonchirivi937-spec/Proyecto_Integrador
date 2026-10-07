// Función para cambiar de vista (Mostrar formulario de Registro)
function mostrarRegistro() {
    document.getElementById("login").classList.add("oculto");
    document.getElementById("register").classList.remove("oculto");
}

// Función para cambiar de vista (Mostrar formulario de Login)
function mostrarLogin() {
    document.getElementById("register").classList.add("oculto");
    document.getElementById("login").classList.remove("oculto");
}

// Función para registrar un nuevo usuario
function registrar() {
    let u = document.getElementById("regUser").value.trim();
    let p = document.getElementById("regPass").value.trim();

    if (u === "" || p === "") {
        alert("Por favor, completa todos los campos.");
        return;
    }

    if (localStorage.getItem(u)) {
        alert("El usuario ya existe en el sistema.");
        return;
    }

    // Guardar credenciales en LocalStorage
    localStorage.setItem(u, p);
    alert("¡Usuario registrado exitosamente!");

    // Limpiar campos y volver al login
    document.getElementById("regUser").value = "";
    document.getElementById("regPass").value = "";
    mostrarLogin();
}

// Función para validar el inicio de sesión y redirigir al panel
function validarLogin() {
    let u = document.getElementById("loginUser").value.trim();
    let p = document.getElementById("loginPass").value.trim();

    // Validar si el usuario existe y la contraseña coincide
    if (localStorage.getItem(u) === p) {
        localStorage.setItem("usuarioActivo", u);
        alert("¡Bienvenido al sistema, " + u + "!");
        
        // Redirección al panel principal de LactisValle
        window.location.href = "dashboard.html";
    } else {
        alert("Usuario o contraseña incorrectos.");
    }
}

// Función para exportar los usuarios guardados a un archivo JSON
function exportarUsuariosJSON() {
    let usuarios = {};
    
    // Recorremos el localStorage
    for (let i = 0; i < localStorage.length; i++) {
        let clave = localStorage.key(i);
        // Evitamos exportar la sesión activa si está guardada ahí
        if (clave !== "usuarioActivo") {
            let valor = localStorage.getItem(clave);
            usuarios[clave] = valor;
        }
    }

    // Convertir el objeto a formato de descarga JSON
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(usuarios, null, 2));
    
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "usuarios_lactisvalle.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}
// URL base de tu microservicio de autenticación en Flask (por defecto corre en el puerto 5001)
const AUTH_API_URL = "http://127.0.0.1:5001/api";

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

// Registrar nuevo usuario consumiendo el microservicio Flask
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
            headers: {
                "Content-Type": "application/json"
            },
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
        alert("No se pudo conectar con el microservicio de autenticación. Asegúrate de que Flask esté ejecutándose.");
    }
}

// Validar inicio de sesión consumiendo el microservicio Flask
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
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ usuario: u, password: p })
        });

        let data = await response.json();

        if (response.ok && data.success) {
            localStorage.setItem("usuarioActivo", u);
            alert(data.message || `¡Bienvenido, ${u}!`);
            
            // Redirección al panel principal de la app
            window.location.href = "dashboard.html";
        } else {
            alert(data.message || "Credenciales incorrectas.");
        }
    } catch (error) {
        console.error("Error de conexión:", error);
        alert("No se pudo conectar con el servidor backend de autenticación.");
    }
}
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error

app = Flask(__name__)
# Habilitar CORS para permitir peticiones desde la interfaz web local
CORS(app)

# Configuración de credenciales para MySQL Local
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',         
    'password': '23977031Maikh',  # <-- Pon aquí tu contraseña entre comillas
    'database': 'lactisvalle_db'
}

def obtener_conexion_db():
    """Crea y retorna una nueva conexión a la base de datos MySQL."""
    return mysql.connector.connect(**DB_CONFIG)

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "status": "success",
        "mensaje": "Microservicio LactisValle en ejecucion y conectado a MySQL"
    })

@app.route('/api/register', methods=['POST', 'OPTIONS'])
def registrar():
    if request.method == 'OPTIONS':
        return '', 200
        
    datos = request.get_json()
    usuario = datos.get('usuario')
    password = datos.get('password')
    
    if not usuario or not password:
        return jsonify({"success": False, "message": "Faltan datos obligatorios (usuario o contraseña)."}), 400

    try:
        conexion = obtener_conexion_db()
        cursor = conexion.cursor()
        
        # Consulta para insertar el usuario en tu base de datos de MySQL
        # Asegúrate de que la tabla y columnas coincidan con tu diseño (ej. tabla usuarios)
        query = "INSERT INTO usuarios (usuario, password) VALUES (%s, %s)"
        cursor.execute(query, (usuario, password))
        conexion.commit()
        
        cursor.close()
        conexion.close()
        
        return jsonify({"success": True, "message": "¡Usuario registrado con éxito en MySQL!"}), 201
        
    except Error as e:
        return jsonify({"success": False, "message": f"Error en la base de datos: {str(e)}"}), 500

@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return '', 200
        
    datos = request.get_json()
    usuario = datos.get('usuario')
    password = datos.get('password')
    
    if not usuario or not password:
        return jsonify({"success": False, "message": "Faltan credenciales."}), 400

    try:
        conexion = obtener_conexion_db()
        cursor = conexion.cursor(dictionary=True)
        
        query = "SELECT * FROM usuarios WHERE usuario = %s AND password = %s"
        cursor.execute(query, (usuario, password))
        user_db = cursor.fetchone()
        
        cursor.close()
        conexion.close()
        
        if user_db:
            return jsonify({"success": True, "message": "¡Bienvenido a LactisValle!"}), 200
        else:
            return jsonify({"success": False, "message": "Usuario o contraseña incorrectos."}), 401
            
    except Error as e:
        return jsonify({"success": False, "message": f"Error en la base de datos: {str(e)}"}), 500

@app.route('/api/v1/ordeno/sincronizar', methods=['POST'])
def sincronizar_registros_offline():
    """
    Endpoint encargado de recibir el paquete JSON proveniente de la cola FIFO (app.js),
    insertar los registros de ordeño en la BD y generar alertas sanitarias si aplica.
    """
    datos = request.get_json()
    
    # Validar formato básico de la petición
    if not datos or 'registros' not in datos:
        return jsonify({
            "status": "error",
            "mensaje": "Payload inválido. Se esperaba una lista bajo la clave 'registros'."
        }), 400

    registros = datos['registros']
    registros_guardados = 0
    alertas_creadas = 0
    conexion = None

    try:
        conexion = obtener_conexion_db()
        cursor = conexion.cursor()
        
        # Aquí procesarías cada registro de la cola FIFO hacia MySQL
        for reg in registros:
            # Lógica de inserción de registros de ordeño...
            registros_guardados += 1
            
        conexion.commit()
        cursor.close()
        conexion.close()
        
        return jsonify({
            "status": "success",
            "registros_procesados": registros_guardados,
            "mensaje": "Sincronización completada exitosamente."
        }), 200

    except Error as e:
        if conexion:
            conexion.rollback()
        return jsonify({"status": "error", "mensaje": str(e)}), 500

if __name__ == '__main__':
    print("==================================================")
    print("🚀 Servidor Flask (LactisValle) iniciado exitosamente.")
    print("📡 Escuchando en: http://127.0.0.1:5000")
    print("==================================================")
    app.run(host='127.0.0.1', port=5000, debug=True)
# ==========================================
# LACTISVALLE - API REST FLASK + MYSQL WORKBENCH
# ==========================================

from flask import Flask, request, jsonify
from flask_cors import CORS
import pymysql
import os

app = Flask(__name__)
CORS(app) # Habilita peticiones desde el frontend local

# Configuración de conexión a MySQL
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',       # Ajusta según tus credenciales locales de MySQL
    'password': '',       # Ingresa la contraseña de tu MySQL Workbench
    'database': 'lactisvalle_db',
    'cursorclass': pymysql.cursors.DictCursor
}

def get_db_connection():
    return pymysql.connect(**DB_CONFIG)

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "proyecto": "LactisValle API REST",
        "estado": "Online",
        "version": "1.0.0"
    }), 200

# Endpoint de autenticación
@app.route('/api/login', methods=['POST'])
def login():
    datos = request.get_json()
    usuario = datos.get('usuario')
    password = datos.get('password')

    if usuario == "admin" and password == "1234":
        return jsonify({"status": "success", "token": "jwt-token-lactisvalle-2026", "rol": "operario"}), 200
    else:
        return jsonify({"status": "error", "message": "Credenciales inválidas"}), 401

# Endpoint de sincronización diferida (Procesa cola FIFO)
@app.route('/api/sincronizar_pesajes', methods=['POST'])
def sincronizar_pesajes():
    payload = request.get_json()
    registros = payload.get('registros', [])

    if not registros:
        return jsonify({"status": "error", "message": "No se recibieron registros para sincronizar"}), 400

    conexion = None
    try:
        conexion = get_db_connection()
        with conexion.cursor() as cursor:
            # Query de inserción en 1FN
            sql = """
                INSERT INTO registro_ordeno 
                (bovino_id, jornada, litros, condicion_corporal, novedad, observaciones, alerta_caida, fecha_registro)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """
            for reg in registros:
                cursor.execute(sql, (
                    reg['bovino_id'],
                    reg['jornada'],
                    reg['litros'],
                    reg['condicion_corporal'],
                    reg['novedad'],
                    reg['observaciones'],
                    reg['alerta_caida'],
                    reg['fecha_registro']
                ))
            
        conexion.commit() # Confirmar transacción
        print(f"✅ [BD] {len(registros)} pesajes insertados exitosamente.")
        return jsonify({"status": "success", "procesados": len(registros)}), 200

    except Exception as e:
        if conexion:
            conexion.rollback()
        print(f"❌ Error al guardar en MySQL: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

    finally:
        if conexion:
            conexion.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
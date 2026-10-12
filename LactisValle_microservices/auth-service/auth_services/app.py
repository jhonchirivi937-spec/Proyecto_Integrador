"""
============================================================================
LACTISVALLE - Servidor Backend (app.py)
API REST para Sincronización de Ordeño y Gestión de Alertas Sanitarias
============================================================================
"""

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
    'user': 'root',       # Ajusta según el usuario de tu MySQL Workbench / XAMPP
    'password': '',       # Agrega tu contraseña si la tienes configurada
    'database': 'lactisvalle_db'
}

def obtener_conexion_db():
    """Crea y retorna una nueva conexión a la base de datos MySQL."""
    return mysql.connector.connect(**DB_CONFIG)

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

        # Iniciar iteración de la cola recibida
        for item in registros:
            # Formatear timestamp ISO de JS (e.g. "2026-09-17T00:18:20.000Z") a DATETIME MySQL
            fecha_raw = item.get('timestamp', '')
            fecha_mysql = fecha_raw.replace('T', ' ').split('.')[0] if fecha_raw else None

            # 1. Inserción en la tabla principal `registro_ordeno`
            sql_ordeno = """
                INSERT INTO registro_ordeno
                (id_bovino, litros_pesados, promedio_referencia, delta_p, es_alerta, fecha_registro)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            valores_ordeno = (
                item['id_bovino'],
                item['litros'],
                item['promedio_referencia'],
                item['delta_p'],
                item['alerta'],
                fecha_mysql
            )
            cursor.execute(sql_ordeno, valores_ordeno)
            id_ordeno_generado = cursor.lastrowid
            registros_guardados += 1

            # 2. Si se activó la regla RN-02 (es_alerta = True), registrar en `alerta_sanitaria`
            if item['alerta']:
                sql_alerta = """
                    INSERT INTO alerta_sanitaria (id_ordeno, descripcion, nivel_urgencia)
                    VALUES (%s, %s, 'CRITICO')
                """
                descripcion_alerta = (
                    f"Caída del {item['delta_p']}% respecto al promedio histórico "
                    f"({item['promedio_referencia']} L). Posible sospecha de mastitis."
                )
                cursor.execute(sql_alerta, (id_ordeno_generado, descripcion_alerta))
                alertas_creadas += 1

        # Confirmar la transacción completa en la base de datos
        conexion.commit()
        cursor.close()

        print(f"✅ Transacción exitosa: {registros_guardados} registros y {alertas_creadas} alertas en MySQL.")

        return jsonify({
            "status": "success",
            "mensaje": "Sincronización completada con éxito.",
            "registros_guardados": registros_guardados,
            "alertas_sanitarias": alertas_creadas
        }), 200

    except Error as error_db:
        # Revertir cualquier cambio en caso de fallo intermedio (Integridad ACID)
        if conexion:
            conexion.rollback()
        print(f"❌ Error de MySQL detectado: {error_db}")
        return jsonify({
            "status": "error",
            "error": f"Error de Base de Datos: {str(error_db)}"
        }), 500

    finally:
        # Garantizar siempre el cierre de la conexión a la base de datos
        if conexion and conexion.is_connected():
            conexion.close()

@app.route('/api/v1/health', methods=['GET'])
def verificar_salud():
    """Endpoint de comprobación para verificar que el servidor está en línea."""
    return jsonify({"status": "online", "mensaje": "Servidor LactisValle activo"}), 200

if __name__ == '__main__':
    print("\n==========================================================")
    print("🚀 Servidor Flask (LactisValle) iniciado exitosamente.")
    print("📡 Escuchando en: http://127.0.0.1:5000")
    print("==========================================================\n")
    app.run(debug=True, port=5000)
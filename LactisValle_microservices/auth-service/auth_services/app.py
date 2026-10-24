from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)

# Habilitar CORS para permitir peticiones desde la PWA (localhost o Live Server)
CORS(app, resources={r"/*": {"origins": "*"}})

# ==========================================
# CONFIGURACIÓN DE CONEXIÓN A MYSQL
# ==========================================
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '23977031Maikh',  # 👈 Reemplaza por tu clave exacta de MySQL
    'database': 'lactisvalle_db'
}

# ==========================================
# 1. RUTA DE VERIFICACIÓN DE ESTADO
# ==========================================
@app.route('/')
def home():
    return jsonify({
        'status': 'online', 
        'service': 'LactisValle API Backend',
        'version': '1.0.0'
    }), 200

# ==========================================
# 2. ENDPOINT DE INICIO DE SESIÓN
# ==========================================
@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    data = request.get_json() or {}
    usuario = data.get('usuario')
    password = data.get('password')

    if not usuario or not password:
        return jsonify({
            'success': False, 
            'message': 'Por favor ingrese usuario y contraseña.'
        }), 400

    conn = None
    cursor = None

    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        query = "SELECT * FROM usuarios WHERE usuario = %s AND password = %s"
        cursor.execute(query, (usuario, password))
        user = cursor.fetchone()

        if user:
            return jsonify({
                'success': True, 
                'message': f'¡Bienvenido {usuario}!',
                'usuario': user['usuario']
            }), 200
        else:
            return jsonify({
                'success': False, 
                'message': 'Usuario o contraseña incorrectos.'
            }), 401

    except mysql.connector.Error as err:
        print(f"Error en MySQL (Login): {err}")
        return jsonify({
            'success': False, 
            'message': f'Error de BD: {err}'
        }), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

# ==========================================
# 3. ENDPOINT DE SINCRONIZACIÓN DE PESAJE (CON PROMEDIO HISTÓRICO DINÁMICO)
# ==========================================
@app.route('/api/sincronizar_pesajes', methods=['POST', 'OPTIONS'])
def sincronizar_pesajes():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    datos = request.get_json() or {}
    registros = datos.get('registros', [])

    if not registros:
        return jsonify({'success': False, 'message': 'La cola está vacía.'}), 400

    conn = None
    cursor = None

    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        for r in registros:
            id_bovino = r.get('bovino')
            litros_actuales = float(r.get('litros', 0.0))

            # 1. Consultar el promedio histórico previo registrado para este bovino
            query_avg = """
                SELECT AVG(litros_pesados) as promedio_historico 
                FROM registro_ordeno 
                WHERE id_bovino = %s
            """
            cursor.execute(query_avg, (id_bovino,))
            resultado = cursor.fetchone()

            if resultado and resultado['promedio_historico'] is not None:
                promedio_ref = float(resultado['promedio_historico'])
            else:
                promedio_ref = litros_actuales

            # 2. Recalcular el Delta P respecto al promedio real de referencia
            if promedio_ref > 0:
                delta_p = round(abs(litros_actuales - promedio_ref) / promedio_ref * 100, 2)
            else:
                delta_p = 0.0

            # Evaluar reglas de alerta sanitaria o por caída brusca
            es_alerta = True if delta_p >= 15.0 or r.get('sanidad') != 'Sana' else False
            estado_regla = 'Alerta Sanitaria / ΔP' if es_alerta else 'Normal'

            # 3. Insertar el pesaje guardando el promedio_referencia real
            query_insert = """
                INSERT INTO registro_ordeno 
                (id_bovino, jornada, litros_pesados, condicion_corporal, estado_sanitario, observaciones, promedio_referencia, delta_p, es_alerta, estado_regla)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            valores = (
                id_bovino,
                r.get('jornada'),
                litros_actuales,
                r.get('cc'),
                r.get('sanidad'),
                r.get('obs'),
                round(promedio_ref, 2),
                delta_p,
                es_alerta,
                estado_regla
            )
            cursor.execute(query_insert, valores)

        conn.commit()

        return jsonify({
            'success': True,
            'message': f'¡Se sincronizaron con éxito {len(registros)} registros recalculando promedios y alertas!'
        }), 200

    except mysql.connector.Error as err:
        print(f"Error en MySQL (Sincronización): {err}")
        return jsonify({'success': False, 'message': f'Error en BD: {err}'}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

# ==========================================
# 4. ENDPOINT PARA EL MÓDULO DE REPORTES Y GRÁFICAS
# ==========================================
@app.route('/api/obtener_metricas', methods=['GET'])
def obtener_metricas():
    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT 
                DATE(fecha_registro) as fecha,
                id_bovino,
                SUM(litros_pesados) as total_litros,
                SUM(CASE WHEN es_alerta = 1 THEN 1 ELSE 0 END) as total_alertas
            FROM registro_ordeno
            GROUP BY DATE(fecha_registro), id_bovino
            ORDER BY fecha ASC
            LIMIT 50;
        """
        cursor.execute(query)
        datos = cursor.fetchall()

        # Convertir fechas a string para serialización JSON limpia
        for fila in datos:
            fila['fecha'] = str(fila['fecha'])

        return jsonify({'success': True, 'metricas': datos}), 200

    except mysql.connector.Error as err:
        print(f"Error en MySQL (Métricas): {err}")
        return jsonify({'success': False, 'message': f'Error en BD: {err}'}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()

# ==========================================
# INICIO DEL SERVIDOR
# ==========================================
if __name__ == '__main__':
    print("🚀 Servidor Flask de LactisValle iniciando en http://127.0.0.1:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
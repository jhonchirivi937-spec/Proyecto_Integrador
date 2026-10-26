from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)  # Habilitar CORS para peticiones desde Live Server / PWA

# Configuración de conexión a la base de datos MySQL
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '23977031Maikh',  # Tu contraseña de MySQL conservada
    'database': 'lactisvalle_db'
}

# ==========================================
# 1. ENDPOINT DE REGISTRO DE USUARIOS
# ==========================================
@app.route('/api/register', methods=['POST', 'OPTIONS'])
def register():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    datos = request.get_json() or {}
    usuario = datos.get('usuario')
    password = datos.get('password')

    if not usuario or not password:
        return jsonify({'success': False, 'message': 'Campos incompletos.'}), 400

    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        query_check = "SELECT id, usuario FROM usuarios WHERE usuario = %s"
        cursor.execute(query_check, (usuario,))
        if cursor.fetchone():
            return jsonify({'success': False, 'message': 'El nombre de usuario ya está registrado.'}), 400

        query_insert = "INSERT INTO usuarios (usuario, password) VALUES (%s, %s)"
        cursor.execute(query_insert, (usuario, password))
        conn.commit()

        return jsonify({'success': True, 'message': 'Usuario registrado exitosamente.'}), 201

    except mysql.connector.Error as err:
        print(f"Error en MySQL (Register): {err}")
        return jsonify({'success': False, 'message': f'Error en BD: {err}'}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# ==========================================
# 2. ENDPOINT DE AUTENTICACIÓN (LOGIN)
# ==========================================
@app.route('/api/login', methods=['POST', 'OPTIONS'])
def login():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    datos = request.get_json() or {}
    usuario = datos.get('usuario')
    password = datos.get('password')

    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        query = "SELECT id, usuario FROM usuarios WHERE usuario = %s AND password = %s"
        cursor.execute(query, (usuario, password))
        user = cursor.fetchone()

        if user:
            return jsonify({
                'success': True, 
                'message': 'Acceso concedido.', 
                'usuario': user['usuario'],
                'id_usuario': user['id']
            }), 200
        else:
            return jsonify({'success': False, 'message': 'Usuario o contraseña incorrectos.'}), 401

    except mysql.connector.Error as err:
        print(f"Error en MySQL (Login): {err}")
        return jsonify({'success': False, 'message': f'Error en BD: {err}'}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# ==========================================
# 3. ENDPOINT DE SINCRONIZACIÓN DE PESAJE
# ==========================================
@app.route('/api/sincronizar_pesajes', methods=['POST', 'OPTIONS'])
def sincronizar_pesajes():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    datos = request.get_json() or {}
    registros = datos.get('registros', [])

    if not registros:
        return jsonify({'success': False, 'message': 'La cola local está vacía.'}), 400

    conn = None
    cursor = None

    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        for r in registros:
            id_bovino = r.get('bovino')
            litros_actuales = float(r.get('litros', 0.0))

            jornada_recibida = r.get('jornadaPura') or r.get('jornada', '')
            jornada_limpia = jornada_recibida.split()[0] if jornada_recibida else 'Mañana'

            query_avg = """
                SELECT AVG(litros_pesados) as promedio_historico 
                FROM registro_ordeno 
                WHERE id_bovino = %s AND jornada = %s
            """
            cursor.execute(query_avg, (id_bovino, jornada_limpia))
            resultado = cursor.fetchone()

            if resultado and resultado['promedio_historico'] is not None:
                promedio_ref = float(resultado['promedio_historico'])
            else:
                promedio_ref = litros_actuales

            if promedio_ref > 0:
                delta_p = round(abs(litros_actuales - promedio_ref) / promedio_ref * 100, 2)
            else:
                delta_p = 0.0

            estado_sanitario = r.get('sanidad', '')
            sanidad_lwr = estado_sanitario.lower()
            es_sano = ('sana' in sanidad_lwr or 'sano' in sanidad_lwr or 'normal' in sanidad_lwr or 'sin novedad' in sanidad_lwr)

            es_alerta = bool(r.get('esAlerta', False))
            if not es_sano:
                es_alerta = True
            elif resultado and resultado['promedio_historico'] is not None and delta_p >= 15.0:
                es_alerta = True

            estado_regla = 'Alerta Sanitaria / ΔP' if es_alerta else 'Normal'

            query_insert = """
                INSERT INTO registro_ordeno 
                (id_bovino, jornada, litros_pesados, condicion_corporal, estado_sanitario, observaciones, promedio_referencia, delta_p, es_alerta, estado_regla)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            valores = (
                id_bovino,
                jornada_limpia,
                litros_actuales,
                r.get('cc'),
                estado_sanitario,
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
            'message': f'¡Se sincronizaron con éxito {len(registros)} registros en MySQL!'
        }), 200

    except mysql.connector.Error as err:
        print(f"Error en MySQL (Sincronización): {err}")
        return jsonify({'success': False, 'message': f'Error en BD: {err}'}), 500
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


# ==========================================
# 4. ENDPOINT PARA REPORTES Y GRÁFICAS POR BOVINO
# ==========================================
@app.route('/api/obtener_reportes', methods=['GET', 'OPTIONS'])
def obtener_reportes():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    conn = None
    cursor = None
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor(dictionary=True)

        # 1. KPIs Generales
        cursor.execute("SELECT SUM(litros_pesados) AS total_litros FROM registro_ordeno")
        row_litros = cursor.fetchone()
        total_litros = float(row_litros['total_litros']) if row_litros and row_litros['total_litros'] else 0.0

        cursor.execute("SELECT COUNT(*) AS total_alertas FROM registro_ordeno WHERE es_alerta = 1")
        row_alertas = cursor.fetchone()
        total_alertas = int(row_alertas['total_alertas']) if row_alertas and row_alertas['total_alertas'] else 0

        cursor.execute("SELECT AVG(litros_pesados) AS promedio_general FROM registro_ordeno")
        row_promedio = cursor.fetchone()
        promedio_general = float(row_promedio['promedio_general']) if row_promedio and row_promedio['promedio_general'] else 0.0

        # 2. Registros detallados por bovino
        query_grafica = """
            SELECT 
                id_bovino as bovino,
                jornada,
                litros_pesados as litros,
                es_alerta,
                DATE_FORMAT(fecha_registro, '%Y-%m-%d %H:%i') as fecha
            FROM registro_ordeno
            ORDER BY fecha_registro ASC
        """
        cursor.execute(query_grafica)
        rows_grafica = cursor.fetchall()

        datos_grafica = []
        for row in rows_grafica:
            datos_grafica.append({
                'bovino': row['bovino'],
                'jornada': row['jornada'],
                'litros': float(row['litros']),
                'es_alerta': bool(row['es_alerta']),
                'fecha': row['fecha']
            })

        return jsonify({
            'success': True,
            'kpis': {
                'total_litros': round(total_litros, 2),
                'total_alertas': total_alertas,
                'promedio_general': round(promedio_general, 2)
            },
            'graficas': datos_grafica
        }), 200

    except mysql.connector.Error as err:
        print(f"Error en MySQL (Reportes): {err}")
        return jsonify({'success': False, 'message': f'Error en BD: {err}'}), 500
    except Exception as ex:
        print(f"Error general en Reportes: {ex}")
        return jsonify({'success': False, 'message': f'Error interno: {str(ex)}'}), 500
    
    finally:
        if cursor: cursor.close()
        if conn and conn.is_connected(): conn.close()


if __name__ == '__main__':
    app.run(debug=True, port=5000)
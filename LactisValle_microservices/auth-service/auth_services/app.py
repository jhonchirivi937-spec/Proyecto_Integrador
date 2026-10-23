from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
# Habilitar CORS para evitar bloqueos del navegador
CORS(app, resources={r"/*": {"origins": "*"}})

# CONFIGURACIÓN DE TU BASE DE DATOS
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '23977031Maikh',  # 👈 Pon tu contraseña exacta de MySQL
    'database': 'lactisvalle_db'
}

@app.route('/')
def home():
    return jsonify({'status': 'online', 'service': 'LactisValle API Server'}), 200

# ENDPOINT DE SINCRONIZACIÓN DE PESAJE EN MYSQL
@app.route('/api/sincronizar_pesajes', methods=['POST', 'OPTIONS'])
def sincronizar_pesajes():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    datos = request.get_json()
    registros = datos.get('registros', [])

    if not registros:
        return jsonify({'success': False, 'message': 'La cola está vacía.'}), 400

    conn = None
    cursor = None

    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()

        query = """
            INSERT INTO registro_ordeno 
            (id_bovino, jornada, litros_pesados, condicion_corporal, estado_sanitario, observaciones, delta_p, es_alerta, estado_regla)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        valores = []
        for r in registros:
            delta_p = float(r.get('deltaP', 0.0))
            es_alerta = True if delta_p >= 15.0 or r.get('sanidad') != 'Sana' else False

            valores.append((
                r.get('bovino'),
                r.get('jornada'),
                r.get('litros'),
                r.get('cc'),
                r.get('sanidad'),
                r.get('obs'),
                delta_p,
                es_alerta,
                r.get('estadoRegla')
            ))

        cursor.executemany(query, valores)
        conn.commit()

        return jsonify({
            'success': True,
            'message': f'¡Se sincronizaron con éxito {cursor.rowcount} registros en la base de datos MySQL!'
        }), 200

    except mysql.connector.Error as err:
        print(f"Error en MySQL: {err}")
        return jsonify({'success': False, 'message': f'Error en BD: {err}'}), 500
    finally:
        if cursor: 
            cursor.close()
        if conn and conn.is_connected(): 
            conn.close()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
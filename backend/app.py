from flask_cors import CORS
import pacientes as pac
from config import init_data_dir
import historia as hist
import exportacion as exp
from datetime import datetime
import turnos as tur
import shutil
from flask import send_file as flask_send_file
import json
import os
from historia import actualizar_facturacion
from flask import Flask, jsonify, request, send_from_directory
import sys

# --- CONFIGURACIÓN PARA EL .EXE (PYINSTALLER) ---
# Determinamos la ruta base dependiendo de si estamos corriendo como .exe o como script
if getattr(sys, 'frozen', False):
    base_dir = sys._MEIPASS
else:
    base_dir = os.path.dirname(os.path.abspath(__file__))

# Apuntamos Flask a la carpeta compilada de React (Vite genera 'dist')
build_folder = os.path.join(base_dir, 'frontend_build')
app = Flask(__name__, static_folder=build_folder, static_url_path='/')

# CORS ya no es estrictamente necesario porque frontend y backend corren en el mismo puerto,
# pero lo dejamos para desarrollo local.
CORS(app, resources={r"/*": {"origins": "*"}})
init_data_dir()
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # Evitar DoS: Límite global de archivos a 16MB

@app.route('/historia/editar_caja/<int:id_evento>', methods=['POST'])
def api_editar_facturacion(id_evento):
    try:
        import historia as hist
        import json
        
        monto = request.form.get("monto", "")
        if monto:
            try:
                if float(monto) < 0:
                    return jsonify({"error": "El monto no puede ser negativo"}), 400
            except ValueError:
                return jsonify({"error": "El monto debe ser numérico"}), 400
                
        pagos_detalle = request.form.get("pagos_detalle", "[]")
        try:
            json.loads(pagos_detalle)
        except json.JSONDecodeError:
            return jsonify({"error": "Detalle de pagos con formato inválido"}), 400

        # Atrapamos los datos editados
        datos = {
            "monto": monto,
            "pagos_detalle": pagos_detalle,
            "tiene_financiacion": request.form.get("tiene_financiacion", "No"),
            "cuotas": request.form.get("cuotas", ""),
            "pagado": request.form.get("pagado", "No")
        }
        
        resultado = hist.actualizar_facturacion(id_evento, datos)
        
        dni = request.form.get("dni") 
        archivos_pago = request.files.getlist("archivos_pago")
        if archivos_pago and dni:
            hist.guardar_adjuntos(dni, resultado["id_adjunto_pago"], archivos_pago)
            
        return jsonify(resultado), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/pacientes", methods=["GET", "POST"])
def manejar_pacientes():
    try:
        import pacientes as pac
        
        # SI REACT PIDE LA LISTA DE PACIENTES
        if request.method == "GET":
            lista = pac.listar_pacientes()
            return jsonify(lista), 200
            
        # SI REACT MANDA UN PACIENTE NUEVO PARA GUARDAR
        if request.method == "POST":
            # Si manda JSON lo leemos como JSON, si no, como Form (para atajar cualquier cosa)
            datos = request.json if request.is_json else request.form.to_dict()
            resultado = pac.guardar_paciente(datos, es_nuevo=True)
            return jsonify(resultado), 201
            
    except PermissionError as e:
        return jsonify({"error": str(e)}), 423
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        print(f"Error inesperado en pacientes: {e}")
        return jsonify({"error": "Error interno del servidor"}), 500

@app.route("/pacientes/<dni>", methods=["PUT"])
def actualizar_paciente(dni):
    try:
        datos = request.get_json()
        datos["dni"] = dni
        resultado = pac.guardar_paciente(datos, es_nuevo=False)
        return jsonify(resultado)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 423
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

@app.route("/pacientes/<dni>", methods=["DELETE"])
def eliminar_paciente(dni):
    try:
        resultado = pac.dar_de_baja(dni)
        return jsonify(resultado)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 423

@app.route("/health")
def health():
    return jsonify({"status": "ok"})

@app.route("/historia/<dni>", methods=["GET"])
def get_historia(dni):
    return jsonify(hist.leer_historia(dni))

@app.route("/historia/<dni>", methods=["POST"])
def post_evento(dni):
    try:
        import json
        import historia as hist

        procedimiento = request.form.get('procedimiento', '')
        descripcion   = request.form.get('descripcion', '')
        
        piezas_raw = request.form.get('piezas', '[]')
        try:
            piezas = json.loads(piezas_raw)
        except json.JSONDecodeError:
            piezas = piezas_raw.split(',') if piezas_raw else []

        monto = request.form.get('monto', '')
        if monto:
            try:
                if float(monto) < 0:
                    return jsonify({"error": "El monto no puede ser negativo"}), 400
            except ValueError:
                return jsonify({"error": "El monto debe ser numérico"}), 400

        pagos_detalle = request.form.get('pagos_detalle', '[]')
        try:
            json.loads(pagos_detalle)
        except json.JSONDecodeError:
            return jsonify({"error": "Formato de pagos inválido"}), 400

        # Atrapamos los datos de la caja
        evento = {
            'procedimiento': procedimiento,
            'descripcion':   descripcion,
            'piezas':        piezas,
            'monto':         monto,
            'pagado':        request.form.get('pagado', 'No'),
            'pagos_detalle': pagos_detalle,
            'tiene_financiacion': request.form.get('tiene_financiacion', 'No'),
            'cuotas':        request.form.get('cuotas', '')
        }

        resultado = hist.agregar_evento(dni, evento)

        archivos = request.files.getlist('archivos')
        if archivos and resultado.get('id_adjunto'):
            hist.guardar_adjuntos(dni, resultado['id_adjunto'], archivos)

        archivos_pago = request.files.getlist('archivos_pago')
        if archivos_pago and resultado.get('id_adjunto_pago'):
            hist.guardar_adjuntos(dni, resultado['id_adjunto_pago'], archivos_pago)

        return jsonify(resultado), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route("/exportar", methods=["GET"])
def exportar():
    import io
    anonimizar = request.args.get("anonimizar", "false").lower() == "true"
    
    wb, n_pac, n_ev = exp.consolidar(anonimizar_datos=anonimizar)
    if not wb:
        return jsonify({"error": "No hay datos para exportar"}), 404

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)

    nombre = f"odontosoft_{'anonimizado_' if anonimizar else ''}{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    from flask import send_file
    return send_file(
        output,
        mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        as_attachment=True,
        download_name=nombre
    )

@app.route("/exportar/preview", methods=["GET"])
def exportar_preview():
    """Devuelve un resumen sin descargar el archivo."""
    _, n_pac, n_ev = exp.consolidar(anonimizar_datos=False)
    return jsonify({
        "pacientes": n_pac,
        "eventos": n_ev,
    })

@app.route("/turnos/disponibilidad/<fecha>", methods=["GET"])
def disponibilidad(fecha):
    turno = request.args.get("turno", "manana")
    return jsonify(tur.get_disponibilidad(fecha, turno))

@app.route("/turnos/timeline/<fecha>", methods=["GET"])
def timeline(fecha):
    turno = request.args.get("turno", "manana")
    return jsonify(tur.get_timeline(fecha, turno))

@app.route("/turnos", methods=["GET"])
def get_turnos():
    dias = int(request.args.get("dias", 7))
    return jsonify(tur.proximos_turnos(dias))

@app.route("/turnos", methods=["POST"])
def crear_turno():
    try:
        datos = request.get_json()
        resultado = tur.crear_turno(datos)
        return jsonify(resultado), 201
    except ValueError as e:
        return jsonify({"error": str(e)}), 409
    except PermissionError as e:
        return jsonify({"error": str(e)}), 423

@app.route("/turnos/<int:turno_id>", methods=["DELETE"])
def cancelar_turno(turno_id):
    try:
        resultado = tur.cancelar_turno(turno_id)
        return jsonify(resultado)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 423
    
@app.route("/turnos/<int:turno_id>", methods=["PUT"])
def modificar_turno(turno_id):
    try:
        datos = request.get_json()
        resultado = tur.actualizar_turno(turno_id, datos)
        return jsonify(resultado)
    except PermissionError as e:
        return jsonify({"error": str(e)}), 423
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/adjuntos/<dni>/<id_adjunto>", methods=["GET"])
def listar_adjuntos(dni, id_adjunto):
    from config import DATA_DIR
    from werkzeug.utils import secure_filename
    carpeta = os.path.join(DATA_DIR, secure_filename(str(dni)), "adjuntos", secure_filename(str(id_adjunto)))
    if not os.path.exists(carpeta):
        return jsonify([])
    archivos = []
    for f in os.listdir(carpeta):
        ruta = os.path.join(carpeta, f)
        if os.path.isfile(ruta):
            archivos.append({
                "nombre": f,
                "tamanio": os.path.getsize(ruta),
            })
    return jsonify(archivos)

@app.route("/adjuntos/<dni>/<id_adjunto>", methods=["POST"])
def subir_adjunto(dni, id_adjunto):
    from config import DATA_DIR
    from werkzeug.utils import secure_filename
    if 'archivo' not in request.files:
        return jsonify({"error": "No se envió ningún archivo"}), 400
    archivo = request.files['archivo']
    if archivo.filename == '':
        return jsonify({"error": "Nombre de archivo vacío"}), 400
    carpeta = os.path.join(DATA_DIR, secure_filename(str(dni)), "adjuntos", secure_filename(str(id_adjunto)))
    os.makedirs(carpeta, exist_ok=True)
    nombre = secure_filename(archivo.filename)
    archivo.save(os.path.join(carpeta, nombre))
    return jsonify({"ok": True, "nombre": nombre}), 201

@app.route("/adjuntos/<dni>/<id_adjunto>/<nombre>", methods=["GET"])
def descargar_adjunto(dni, id_adjunto, nombre):
    from config import DATA_DIR
    from werkzeug.utils import secure_filename
    carpeta = os.path.join(DATA_DIR, secure_filename(str(dni)), "adjuntos", secure_filename(str(id_adjunto)))
    ruta = os.path.join(carpeta, secure_filename(nombre))
    if not os.path.exists(ruta):
        return jsonify({"error": "Archivo no encontrado"}), 404
    return flask_send_file(ruta, as_attachment=False)

@app.route("/adjuntos/<dni>/<id_adjunto>/<nombre>", methods=["DELETE"])
def eliminar_adjunto(dni, id_adjunto, nombre):
    from config import DATA_DIR
    from werkzeug.utils import secure_filename
    carpeta = os.path.join(DATA_DIR, secure_filename(str(dni)), "adjuntos", secure_filename(str(id_adjunto)))
    ruta = os.path.join(carpeta, secure_filename(nombre))
    if os.path.exists(ruta):
        os.remove(ruta)
    return jsonify({"ok": True})

@app.route('/estadisticas', methods=['GET'])
def obtener_estadisticas():
    try:
        from config import get_db_connection
        import json
        from datetime import datetime, timedelta

        rango = request.args.get('rango', 'historico')
        
        # Construcción dinámica del filtro de fecha para SQLite
        filtro_fecha = ""
        if rango == 'mes':
            filtro_fecha = "WHERE fecha >= date('now', '-30 days')"
        elif rango == 'trimestre':
            filtro_fecha = "WHERE fecha >= date('now', '-90 days')"
        elif rango == 'año':
            filtro_fecha = "WHERE fecha >= date('now', '-365 days')"

        conn = get_db_connection()
        cursor = conn.cursor()
        query = f"SELECT monto, pagado, pagos_detalle, procedimiento FROM historia {filtro_fecha}"
        cursor.execute(query)
        rows = cursor.fetchall()
        conn.close()

        ingresos_totales = 0
        deuda_total = 0
        conteo_procedimientos = {}
        impacto_economico = {} # Para saber cuál deja más plata
        metodos_pago = {}

        for row in rows:
            monto_total_evento = float(row['monto']) if row['monto'] else 0
            pagado_flag = row['pagado']
            proc = row['procedimiento'] or "Sin especificar"
            
            try:
                pagos = json.loads(row['pagos_detalle']) if row['pagos_detalle'] else []
            except:
                pagos = []
            
            suma_pagos_evento = 0
            for p in pagos:
                monto_pago = float(p.get('monto', 0))
                suma_pagos_evento += monto_pago
                ingresos_totales += monto_pago
                
                # Metodos de pago
                metodo = p.get('metodo', 'Otro')
                metodos_pago[metodo] = metodos_pago.get(metodo, 0) + monto_pago

            # KPIs de Deuda y Impacto
            if pagado_flag != 'Si':
                deuda = monto_total_evento - suma_pagos_evento
                if deuda > 0:
                    deuda_total += deuda

            # Frecuencia e Impacto (acumulamos lo cobrado por tipo de tratamiento)
            conteo_procedimientos[proc] = conteo_procedimientos.get(proc, 0) + 1
            impacto_economico[proc] = impacto_economico.get(proc, 0) + suma_pagos_evento

        # Cálculos Finales
        cant_sesiones = len(rows)
        ticket_promedio = ingresos_totales / cant_sesiones if cant_sesiones > 0 else 0
        
        # % de Cobrabilidad: (Lo que entró) / (Lo que debería haber entrado)
        total_facturado = ingresos_totales + deuda_total
        cobrabilidad = (ingresos_totales / total_facturado * 100) if total_facturado > 0 else 100

        # Tratamiento de mayor impacto (el que más recaudó)
        mayor_impacto = "N/A"
        if impacto_economico:
            mayor_impacto = max(impacto_economico, key=impacto_economico.get)

        # Formateo para gráficos
        grafico_procedimientos = [{"name": k, "value": v, "monto": impacto_economico.get(k, 0)} for k, v in conteo_procedimientos.items()]
        grafico_procedimientos.sort(key=lambda x: x['value'], reverse=True)

        grafico_metodos = [{"name": k, "value": v} for k, v in metodos_pago.items()]

        return jsonify({
            "ingresos_totales": round(ingresos_totales, 2),
            "deuda_total": round(deuda_total, 2),
            "tratamientos_totales": cant_sesiones,
            "ticket_promedio": round(ticket_promedio, 2),
            "cobrabilidad": round(cobrabilidad, 1),
            "mayor_impacto": mayor_impacto,
            "procedimientos": grafico_procedimientos,
            "metodos_pago": grafico_metodos
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/deudores', methods=['GET'])
def obtener_deudores():
    try:
        from config import get_db_connection
        import json

        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Unimos la tabla de pacientes con la de historia para tener el teléfono
        cursor.execute('''
            SELECT p.dni, p.nombre, p.apellido, p.telefono, h.monto, h.pagos_detalle
            FROM pacientes p
            JOIN historia h ON p.dni = h.dni
            WHERE h.pagado != 'Si'
        ''')
        rows = cursor.fetchall()
        conn.close()

        deudores_dict = {}

        for row in rows:
            dni = row['dni']
            monto = float(row['monto']) if row['monto'] else 0
            
            try:
                pagos = json.loads(row['pagos_detalle']) if row['pagos_detalle'] else []
            except json.JSONDecodeError:
                pagos = []
            
            suma_pagos = sum(float(p.get('monto', 0)) for p in pagos)
            deuda_evento = monto - suma_pagos

            # Si realmente debe plata de esta intervención, lo sumamos a su cuenta
            if deuda_evento > 0:
                if dni not in deudores_dict:
                    deudores_dict[dni] = {
                        "dni": dni,
                        "nombre": f"{row['nombre']} {row['apellido']}",
                        "telefono": row['telefono'],
                        "deuda_total": 0,
                        "cantidad_tratamientos": 0
                    }
                
                deudores_dict[dni]["deuda_total"] += deuda_evento
                deudores_dict[dni]["cantidad_tratamientos"] += 1

        # Convertimos el diccionario a lista y la ORDENAMOS de mayor a menor deuda
        lista_deudores = list(deudores_dict.values())
        lista_deudores.sort(key=lambda x: x['deuda_total'], reverse=True)

        return jsonify(lista_deudores), 200

    except Exception as e:
        print(f"Error en deudores: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/historia/editar_evento/<int:evento_id>', methods=['POST', 'OPTIONS'])
def editar_evento_historia(evento_id):
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200

    from config import get_db_connection
    conn = get_db_connection() 
    cursor = conn.cursor()
    
    try:
        procedimiento = request.form.get('procedimiento', '')
        piezas = request.form.get('piezas', '')
        descripcion = request.form.get('descripcion', '')
        monto = request.form.get('monto', '')
        
        if monto:
            try:
                if float(monto) < 0:
                    return jsonify({'error': 'El monto no puede ser negativo'}), 400
            except ValueError:
                return jsonify({'error': 'El monto debe ser numérico'}), 400
                
        pagado = request.form.get('pagado', 'No')
        pagos_detalle = request.form.get('pagos_detalle', '[]')
        
        import json
        try:
            json.loads(pagos_detalle)
        except json.JSONDecodeError:
            return jsonify({'error': 'Formato de pagos inválido'}), 400
            
        tiene_financiacion = request.form.get('tiene_financiacion', 'No')
        cuotas = request.form.get('cuotas', '')

        cursor.execute("""
            UPDATE historia 
            SET procedimiento = ?, piezas = ?, descripcion = ?, monto = ?, 
                pagado = ?, pagos_detalle = ?, tiene_financiacion = ?, cuotas = ?
            WHERE id = ?
        """, (procedimiento, piezas, descripcion, monto, pagado, pagos_detalle, tiene_financiacion, cuotas, evento_id))
        
        if cursor.rowcount == 0:
            return jsonify({'error': 'Intervención no encontrada'}), 404
            
        conn.commit()
        return jsonify({'message': 'Intervención actualizada correctamente'}), 200

    except Exception as e:
        print(f"Error al editar evento: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()


# --- RUTA COMODÍN PARA SERVIR REACT ---
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    # 1. Revisamos si la carpeta frontend_build realmente se copió al .exe
    if not os.path.exists(app.static_folder):
        return f"<h1>Error 1: Carpeta perdida</h1><p>Flask está buscando tu diseño en esta ruta exacta, pero no existe: <b>{app.static_folder}</b></p>", 404
        
    # 2. Revisamos si el index.html está adentro de esa carpeta
    index_path = os.path.join(app.static_folder, 'index.html')
    if not os.path.exists(index_path):
        return f"<h1>Error 2: Archivo fantasma</h1><p>La carpeta se copió, pero adentro no está el <b>index.html</b>. Ruta revisada: <b>{index_path}</b></p>", 404

    # 3. Si todo está bien, lo mostramos
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')
        
if __name__ == "__main__":
    import webbrowser
    from threading import Timer
    
    def abrir_navegador():
        url = "http://localhost:5050"
        import os
        # Intenta abrir Chrome en modo "App" (sin barra de navegación)
        if os.system(f'start chrome --app="{url}"') != 0:
            # Si el usuario no tiene Chrome, intenta con Edge (que viene en todo Windows)
            if os.system(f'start msedge --app="{url}"') != 0:
                # Si falla todo, abre el navegador normal de siempre
                webbrowser.open_new(url)
        
    # Si está empaquetado como .exe, abre el navegador automáticamente tras 1.5 segundos
    if getattr(sys, 'frozen', False):
        Timer(1.5, abrir_navegador).start()
        
    # host='127.0.0.1' asegura que el sistema solo se pueda abrir desde esta PC
    app.run(host='127.0.0.1', port=5050, debug=False)
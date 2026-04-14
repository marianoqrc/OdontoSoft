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
from flask import Flask, jsonify, request
#D:\soft\odontosoft\backend> d:\soft\odontosoft\backend\.venv\Scripts\python.exe app.py

app = Flask(__name__)
CORS(app)
init_data_dir()

@app.route('/historia/editar_caja/<int:id_evento>', methods=['POST'])
def api_editar_facturacion(id_evento):
    try:
        import historia as hist
        
        # Atrapamos los datos editados
        datos = {
            "monto": request.form.get("monto", ""),
            "pagos_detalle": request.form.get("pagos_detalle", "[]"),
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
            resultado = pac.guardar_paciente(datos)
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
        resultado = pac.guardar_paciente(datos)
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

        # Atrapamos los datos de la caja
        evento = {
            'procedimiento': procedimiento,
            'descripcion':   descripcion,
            'piezas':        piezas,
            'monto':         request.form.get('monto', ''),
            'pagado':        request.form.get('pagado', 'No'),
            'pagos_detalle': request.form.get('pagos_detalle', '[]'),
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

# Así tiene que quedar en tu app.py
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
    carpeta = os.path.join(DATA_DIR, str(dni), "adjuntos", id_adjunto)
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
    carpeta = os.path.join(DATA_DIR, str(dni), "adjuntos", id_adjunto)
    os.makedirs(carpeta, exist_ok=True)
    nombre = secure_filename(archivo.filename)
    archivo.save(os.path.join(carpeta, nombre))
    return jsonify({"ok": True, "nombre": nombre}), 201

@app.route("/adjuntos/<dni>/<id_adjunto>/<nombre>", methods=["GET"])
def descargar_adjunto(dni, id_adjunto, nombre):
    from config import DATA_DIR
    from werkzeug.utils import secure_filename
    carpeta = os.path.join(DATA_DIR, str(dni), "adjuntos", id_adjunto)
    ruta = os.path.join(carpeta, secure_filename(nombre))
    if not os.path.exists(ruta):
        return jsonify({"error": "Archivo no encontrado"}), 404
    return flask_send_file(ruta, as_attachment=False)

@app.route("/adjuntos/<dni>/<id_adjunto>/<nombre>", methods=["DELETE"])
def eliminar_adjunto(dni, id_adjunto, nombre):
    from config import DATA_DIR
    from werkzeug.utils import secure_filename
    carpeta = os.path.join(DATA_DIR, str(dni), "adjuntos", id_adjunto)
    ruta = os.path.join(carpeta, secure_filename(nombre))
    if os.path.exists(ruta):
        os.remove(ruta)
    return jsonify({"ok": True})

if __name__ == "__main__":
    app.run(port=5050, debug=True)
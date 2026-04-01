from flask import Flask, jsonify, request
from flask_cors import CORS
import pacientes as pac
from config import init_data_dir
import historia as hist
import exportacion as exp
from datetime import datetime
import turnos as tur

#D:\soft\odontosoft\backend> d:\soft\odontosoft\backend\.venv\Scripts\python.exe app.py

app = Flask(__name__)
CORS(app)
init_data_dir()

@app.route("/pacientes", methods=["GET"])
def get_pacientes():
    buscar = request.args.get("q", "").lower()
    lista = pac.listar_pacientes()
    if buscar:
        lista = [p for p in lista if
            buscar in str(p.get("dni", "")).lower() or
            buscar in str(p.get("nombre", "")).lower() or
            buscar in str(p.get("apellido", "")).lower()
        ]
    return jsonify(lista)

@app.route("/pacientes", methods=["POST"])
def crear_paciente():
    try:
        datos = request.get_json()
        resultado = pac.guardar_paciente(datos)
        return jsonify(resultado), 201
    except PermissionError as e:
        return jsonify({"error": str(e)}), 423
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

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
        evento = request.get_json()
        resultado = hist.agregar_evento(dni, evento)
        return jsonify(resultado), 201
    except PermissionError as e:
        return jsonify({"error": str(e)}), 423
    except ValueError as e:
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

if __name__ == "__main__":
    app.run(port=5050, debug=True)
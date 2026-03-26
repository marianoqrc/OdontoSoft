from flask import Flask, jsonify, request
from flask_cors import CORS
import pacientes as pac
from config import init_data_dir
import historia as hist

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

if __name__ == "__main__":
    app.run(port=5050, debug=True)
import os
from datetime import datetime
from openpyxl import load_workbook
from config import DATA_DIR

def get_ruta_paciente(dni):
    return os.path.join(DATA_DIR, str(dni), "paciente.xlsx")

def leer_historia(dni):
    """Lee todos los eventos de la historia clínica."""
    ruta = get_ruta_paciente(dni)
    if not os.path.exists(ruta):
        return []

    try:
        wb = load_workbook(ruta, read_only=True)
        ws = wb["Historia"]
        headers = [cell.value for cell in ws[1]]
        eventos = []

        for row in ws.iter_rows(min_row=2):
            valores = [cell.value for cell in row]
            if any(v is not None for v in valores):
                eventos.append(dict(zip(headers, valores)))

        wb.close()
        # Más reciente primero
        return list(reversed(eventos))

    except Exception as e:
        print(f"Error leyendo historia {dni}: {e}")
        return []

def agregar_evento(dni, evento):
    """Agrega un evento a la historia clínica — nunca edita los anteriores."""
    ruta = get_ruta_paciente(dni)
    if not os.path.exists(ruta):
        raise ValueError("Paciente no encontrado")

    try:
        wb = load_workbook(ruta)
        ws = wb["Historia"]

        # Timestamp automático (RF06)
        nuevo = {
            "fecha":         datetime.now().isoformat(),
            "piezas":        ",".join(str(p) for p in evento.get("piezas", [])),
            "procedimiento": evento.get("procedimiento", ""),
            "descripcion":   evento.get("descripcion", ""),
            "profesional":   evento.get("profesional", ""),
        }

        headers = [cell.value for cell in ws[1]]
        fila = [nuevo.get(h, "") for h in headers]
        ws.append(fila)

        wb.save(ruta)
        return {"ok": True}

    except PermissionError:
        raise PermissionError(
            "El archivo está abierto en Excel. Cerralo y volvé a intentar."
        )
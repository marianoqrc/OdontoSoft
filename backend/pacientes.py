import os
import json
from datetime import datetime
from openpyxl import Workbook, load_workbook
from config import DATA_DIR

#CRUD DE PACIENTES

#DEVUELVE RUTA DEL ARCHIVO DE PACIENTES
def get_ruta_pacientes():
    carpeta = os.path.join(DATA_DIR, str(dni))
    os.makedirs(carpeta, exist_ok=True)
    return os.path.join(carpeta, "pacientes.xlsx")

#CREA ARCHIVO EXCEL CON LAS HOJAS NECESARIAS
def crear_workbook_nuevo():
    wb = workbook()

    #hoja 1 -> datos pacientes
    ws_paciente = wb.active
    ws_paciente.title = "Datos Pacientes"
    ws_paciente.append(["DNI", "Nombre", "Apellido", "Edad", "Teléfono", "Email"]) #FALTA ACLARAR TIPOS DE DATOS

    #hoja 2 -> historia clinica
    ws_historia = wb.create_sheet("Historia Clínica")
    ws_historia.append(["Fecha", "Motivo Consulta", "Diagnóstico", "Tratamiento"]) #FALTA ACLARAR TIPOS DE DATOS

    return wb

#LISTA PACIENTES
def listar_pacientes():
    if not os.path.exists(DATA_DIR):
        return []
    
    pacientes = []

    for dni in os.listdir(DATA_DIR):
        ruta = get_ruta_pacientes(dni)
        if not os.path.exists(ruta):
            continue
        try:
            wb = load_workbook(ruta)
            ws = wb["Datos Pacientes"]
            #LA RPIMER FILA SON LOS NOMBRES DE LAS COLUMNAS, LA SEGUNDA FILA LOS VALORES

            headers = [cell.value for cell in ws[1]]
            if ws.max_row < 2:
                continue

            valores = [cell.value for cell in ws[2]]
            paciente = dict(zip(headers, valores))

            #SOLO SE INCLUYE PACIENTES ACTIVOS
            if paciente.get("Activo", True):
                pacientes.append(paciente)
            
            wb.close()
        except Exception as e:
            print(f"Error al leer paciente {dni}: {e}")

    #FILTRAR POR APELLIDO
    return sorted(pacientes, key=lambda p: p.get("Apellido", ""))


#CREA O ACTUALIZA PACIENTE
def guardar_paciente(datos):
    dni = datos.get("DNI")
    if not dni:
        raise ValueError("El DNI es obligatorio")

    ruta = get_ruta_pacientes(dni)

    #ACTUALIZAR PACIENTE
    if os.path.exists(ruta):
        wb = load_workbook(ruta)
        ws = wb["Datos Pacientes"]

    #BORRAR FILA EXISTENTE SI YA EXISTE EL PACIENTE
    for row in ws.iter_rows(min_row=2):
        for cell in row:
            cell.value = None

    #PACIENTE NUEVO
    else:
        wb = crear_workbook_nuevo()
        ws = wb["Datos Pacientes"]
        datos["Creado_en"] = datetime.now().isoformat()
        datos["Activo"] = True

    #ESCRIBIR DATOS EN LA FILA 2
    headers = [cell.value for cell in ws[1]]
    fila = [datos.get(h) for h in headers]
    ws.append(fila)

    wb.save(ruta)
    return {"ok": True, "dni": dni}

#BAJA LOGICA
def dar_de_baja(dni):
    pacientes = listar_pacientes()
    paciente = next((p for p in pacientes if str(p["dni"]) == str(dni)), None)
    
    if not paciente:
        return {"ok": False, "error": "Paciente no encontrado"}
    
    paciente["Activo"] = False
    guardar_paciente(paciente)
    return {"ok": True, "dni": dni}

        
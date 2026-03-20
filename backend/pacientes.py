import os
import json
from datetime import datetime
from openpyxl import Workbook, load_workbook
from config import DATA_DIR

#CRUD DE PACIENTES

#DEVUELVE RUTA DEL ARCHIVO DE PACIENTES
def get_ruta_pacientes():
    carpeta = os.path.join(DATA_DIR, str(dni)) #falta declarar dni
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

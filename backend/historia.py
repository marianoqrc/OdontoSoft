import os
import shutil
from datetime import datetime
from config import DATA_DIR, get_db_connection
from werkzeug.utils import secure_filename

# Funciones de carpetas físicas para los archivos adjuntos
def get_carpeta_paciente(dni):
    """Devuelve la ruta a la carpeta física del paciente."""
    return os.path.join(DATA_DIR, str(dni))

def leer_historia(dni):
    """Lee todos los eventos de la historia clínica de un paciente desde SQLite."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Buscamos todos los eventos, ordenados del más nuevo al más viejo
    cursor.execute("SELECT * FROM historia WHERE dni = ? ORDER BY fecha DESC", (dni,))
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def agregar_evento(dni, evento):
    """Agrega un evento a la historia clínica en SQLite."""
    
    # Primero verificamos si el paciente existe
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT dni FROM pacientes WHERE dni = ?", (dni,))
    if not cursor.fetchone():
        conn.close()
        raise ValueError("Paciente no encontrado en la base de datos")

    try:
        # Timestamp único para crear la carpeta de fotos si hay adjuntos
        id_adjunto = datetime.now().strftime("%Y-%m-%d_%H%M%S")
        fecha = datetime.now().isoformat()
        
        # Procesamos las piezas (si vienen como lista o como string)
        piezas_raw = evento.get("piezas", [])
        if isinstance(piezas_raw, list):
            piezas_str = ",".join(str(p) for p in piezas_raw)
        else:
            piezas_str = str(piezas_raw)

        # INSERT en la base de datos SQLite
        cursor.execute('''
            INSERT INTO historia (dni, fecha, piezas, procedimiento, descripcion, profesional, id_adjunto)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            dni,
            fecha,
            piezas_str,
            evento.get("procedimiento", ""),
            evento.get("descripcion", ""),
            evento.get("profesional", ""),
            id_adjunto
        ))

        conn.commit()
        return {"ok": True, "id_adjunto": id_adjunto}

    except Exception as e:
        print(f"Error al guardar historia: {e}")
        raise
    finally:
        conn.close()


def guardar_adjuntos(dni, id_adjunto, archivos_lista):
    """
    Recibe una lista de archivos de Flask y los guarda en 
    la carpeta física data/DNI/id_adjunto/
    """
    if not archivos_lista:
        return
    
    # Crea la ruta de la carpeta si no existe
    carpeta_destino = os.path.join(get_carpeta_paciente(dni), str(id_adjunto))
    os.makedirs(carpeta_destino, exist_ok=True)
    
    for archivo in archivos_lista:
        if archivo and archivo.filename != '':
            # Limpia el nombre del archivo por seguridad (ej: quita espacios raros)
            nombre_seguro = secure_filename(archivo.filename)
            ruta_final = os.path.join(carpeta_destino, nombre_seguro)
            archivo.save(ruta_final)
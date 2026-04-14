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
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT dni FROM pacientes WHERE dni = ?", (dni,))
    if not cursor.fetchone():
        conn.close()
        raise ValueError("Paciente no encontrado en la base de datos")

    try:
        id_adjunto = datetime.now().strftime("%Y-%m-%d_%H%M%S")
        fecha = datetime.now().isoformat()
        
        piezas_raw = evento.get("piezas", [])
        if isinstance(piezas_raw, list):
            piezas_str = ",".join(str(p) for p in piezas_raw)
        else:
            piezas_str = str(piezas_raw)

        cursor.execute('''
            INSERT INTO historia (
                dni, fecha, piezas, procedimiento, descripcion, profesional, id_adjunto,
                monto, forma_pago, financiacion, pagado
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            dni,
            fecha,
            piezas_str,
            evento.get("procedimiento", ""),
            evento.get("descripcion", ""),
            evento.get("profesional", ""),
            id_adjunto,
            evento.get("monto", ""),               
            evento.get("forma_pago", ""),          
            evento.get("financiacion", ""),
            evento.get("pagado", "No")             # NUEVO CAMPO
        ))

        conn.commit()
        return {"ok": True, "id_adjunto": id_adjunto}

    except Exception as e:
        print(f"Error al guardar historia: {e}")
        raise
    finally:
        conn.close()

# NUEVA FUNCIÓN PARA EDITAR LA PLATA DE UN EVENTO VIEJO
def actualizar_facturacion(id_evento, datos):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        # Recuperar el ID de la carpeta de pagos o crear uno nuevo
        cursor.execute("SELECT id_adjunto_pago FROM historia WHERE id = ?", (id_evento,))
        row = cursor.fetchone()
        id_adjunto_pago = row["id_adjunto_pago"] if row and row["id_adjunto_pago"] else datetime.now().strftime("PAGO_%Y-%m-%d_%H%M%S")

        cursor.execute('''
            UPDATE historia 
            SET monto = ?, pagos_detalle = ?, tiene_financiacion = ?, cuotas = ?, pagado = ?, id_adjunto_pago = ?
            WHERE id = ?
        ''', (
            datos.get("monto", ""),
            datos.get("pagos_detalle", "[]"), # ACÁ SE GUARDAN LOS PARCIALES
            datos.get("tiene_financiacion", "No"),
            datos.get("cuotas", ""),
            datos.get("pagado", "No"),
            id_adjunto_pago,
            id_evento
        ))
        conn.commit()
        return {"ok": True, "id_adjunto_pago": id_adjunto_pago}
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
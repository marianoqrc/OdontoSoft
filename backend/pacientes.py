import os
from datetime import datetime
from config import get_db_connection
from flask import request

def listar_pacientes():
    """Devuelve la lista de pacientes, opcionalmente filtrados por búsqueda."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Capturamos el parámetro 'q' de la URL (la búsqueda)
    query = request.args.get('q', '')

    if query:
        # Si hay búsqueda, usamos LIKE para buscar en nombre, apellido o DNI
        # Los % son comodines de SQL (busca "Lopez" en cualquier parte del texto)
        busqueda_sql = f"%{query}%"
        cursor.execute("""
            SELECT * FROM pacientes 
            WHERE activo = 1 
            AND (nombre LIKE ? OR apellido LIKE ? OR dni LIKE ?)
            ORDER BY apellido ASC
        """, (busqueda_sql, busqueda_sql, busqueda_sql))
    else:
        # Si no hay búsqueda, devolvemos todos
        cursor.execute("SELECT * FROM pacientes WHERE activo = 1 ORDER BY apellido ASC")
        
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def guardar_paciente(datos):
    """Crea un paciente nuevo o actualiza uno existente."""
    dni = datos.get("dni")
    if not dni:
        raise ValueError("El DNI es obligatorio")
        
    telefono = datos.get("telefono")
    if not telefono or str(telefono).strip() == "":
        raise ValueError("El teléfono es obligatorio")

    # === ACÁ ESTÁ EL CAMBIO: Agregamos las nuevas columnas médicas para el PDF ===
    columnas = [
        "dni", "nombre", "apellido", "fecha_nacimiento", "telefono", "email", 
        "obra_social", "nro_afiliado", "hipertenso", "diabetico", 
        "alteracion_coagulacion", "fuma", "tiempo_fumador", "asma", 
        "consume_drogas", "detalle_drogas", "insuficiencia_renal", 
        "insuficiencia_hepatica", "embarazada", "tiempo_embarazo", 
        "valor_presion", "alergias", 
        
        # Nuevas columnas inyectadas en la DB
        "alergia", "ulsera_gast", "enf_respiratoria", "p_a", 
        "epilepsia", "trast_cardiacos", "medicamentos", "antecedentes_hemor", 
        "enfermedades_venereas", "hepatitis", "diabetes", "contacto_emergencia",
        
        # Y las del domicilio que pide el PDF
        "domicilio", "localidad", "plan"
    ]
    
    conn = get_db_connection()
    cursor = conn.cursor()

    # Chequeamos si el paciente ya existe
    cursor.execute("SELECT dni FROM pacientes WHERE dni = ?", (dni,))
    existe = cursor.fetchone()

    if existe:
        # ACTUALIZAR (UPDATE)
        set_clause = ", ".join([f"{col} = ?" for col in columnas if col != "dni"])
        valores = [datos.get(col) for col in columnas if col != "dni"]
        valores.append(dni) # El DNI va al final para el WHERE
        
        consulta_sql = f"UPDATE pacientes SET {set_clause} WHERE dni = ?"
        cursor.execute(consulta_sql, valores)
    else:
        # CREAR NUEVO (INSERT)
        datos["creado_en"] = datetime.now().isoformat()
        datos["activo"] = 1
        
        columnas_insert = columnas + ["activo", "creado_en"]
        placeholders = ", ".join(["?" for _ in columnas_insert])
        valores = [datos.get(col) for col in columnas_insert]
        
        consulta_sql = f"INSERT INTO pacientes ({', '.join(columnas_insert)}) VALUES ({placeholders})"
        cursor.execute(consulta_sql, valores)

    conn.commit()
    conn.close()
    
    # IMPORTANTE: Mantenemos la creación de la carpeta física por si luego suben fotos/radiografías
    from config import DATA_DIR
    carpeta_adjuntos = os.path.join(DATA_DIR, str(dni), "adjuntos")
    os.makedirs(carpeta_adjuntos, exist_ok=True)

    return {"ok": True, "dni": dni}

def dar_de_baja(dni):
    """Marca a un paciente como inactivo (borrado lógico)."""
    if not dni or dni == "null":
        return {"ok": False, "error": "DNI inválido"}

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # En vez de borrarlo real (DELETE), lo ocultamos poniendo activo = 0
    cursor.execute("UPDATE pacientes SET activo = 0 WHERE dni = ?", (dni,))
    
    # Si la base de datos nos dice que afectó a 0 filas, el paciente no existía
    if cursor.rowcount == 0:
        conn.close()
        return {"ok": False, "error": "Paciente no encontrado"}
        
    conn.commit()
    conn.close()
    return {"ok": True}
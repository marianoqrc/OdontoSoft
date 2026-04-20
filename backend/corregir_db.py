from config import get_db_connection

def actualizar_base():
    # Usamos TU conexión para no errarle al archivo
    conn = get_db_connection()
    cursor = conn.cursor()

    nuevas_columnas = [
        "alergia BOOLEAN DEFAULT 0",
        "ulsera_gast BOOLEAN DEFAULT 0",
        "enf_respiratoria BOOLEAN DEFAULT 0",
        "p_a BOOLEAN DEFAULT 0",
        "epilepsia BOOLEAN DEFAULT 0",
        "trast_cardiacos BOOLEAN DEFAULT 0",
        "medicamentos TEXT DEFAULT ''",
        "antecedentes_hemor BOOLEAN DEFAULT 0",
        "enfermedades_venereas BOOLEAN DEFAULT 0",
        "hepatitis BOOLEAN DEFAULT 0",
        "diabetes BOOLEAN DEFAULT 0",
        "contacto_emergencia TEXT DEFAULT ''",
        "domicilio TEXT DEFAULT ''",
        "localidad TEXT DEFAULT ''",
        "plan TEXT DEFAULT ''"
    ]

    print("Conectado a la base de datos real. Verificando columnas...")
    for col in nuevas_columnas:
        nombre_columna = col.split()[0]
        try:
            cursor.execute(f"ALTER TABLE pacientes ADD COLUMN {col}")
            print(f"✅ Agregada exitosamente: {nombre_columna}")
        except Exception as e:
            # Si tira error es porque realmente ya existe
            print(f"⚠️ Ya existía (o error): {nombre_columna} -> {e}")

    conn.commit()
    conn.close()
    print("🚀 ¡Base de datos real actualizada!")

if __name__ == '__main__':
    actualizar_base()
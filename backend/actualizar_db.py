import sqlite3

def actualizar_base():
    # Asegurate de que el nombre de tu archivo .db sea correcto
    conexion = sqlite3.connect('odontosoft.db') 
    cursor = conexion.cursor()

    nuevas_columnas = [
        "alergia BOOLEAN DEFAULT 0",
        "ulsera_gast BOOLEAN DEFAULT 0",
        "enf_respiratoria BOOLEAN DEFAULT 0",
        "fuma BOOLEAN DEFAULT 0",
        "p_a BOOLEAN DEFAULT 0",
        "epilepsia BOOLEAN DEFAULT 0",
        "trast_cardiacos BOOLEAN DEFAULT 0",
        "medicamentos TEXT DEFAULT ''",
        "antecedentes_hemor BOOLEAN DEFAULT 0",
        "enfermedades_venereas BOOLEAN DEFAULT 0",
        "hepatitis BOOLEAN DEFAULT 0",
        "diabetes BOOLEAN DEFAULT 0",
        "contacto_emergencia TEXT DEFAULT ''"
    ]

    for col in nuevas_columnas:
        try:
            cursor.execute(f"ALTER TABLE pacientes ADD COLUMN {col}")
            print(f"✅ Columna agregada exitosamente: {col.split()[0]}")
        except sqlite3.OperationalError:
            # Si tira error es porque la columna ya existe, no pasa nada
            print(f"⚠️ La columna ya existía: {col.split()[0]}")

    conexion.commit()
    conexion.close()
    print("🚀 ¡Base de datos actualizada y lista para el PDF!")

if __name__ == '__main__':
    actualizar_base()
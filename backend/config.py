import os
import sqlite3

# El directorio donde se guardarán los archivos adjuntos (fotos, pdfs)
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')

# La ruta a nuestra nueva base de datos SQLite
DB_PATH = os.path.join(DATA_DIR, 'odontosoft.db')

def init_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)
    inicializar_base_datos()

def get_db_connection():
    """Abre una conexión a la base de datos y permite acceder a las columnas por nombre."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row 
    return conn

def inicializar_base_datos():
    """Crea las tablas si no existen."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Tabla Pacientes
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS pacientes (
            dni TEXT PRIMARY KEY,
            nombre TEXT NOT NULL,
            apellido TEXT NOT NULL,
            fecha_nacimiento TEXT,
            telefono TEXT,
            email TEXT,
            obra_social TEXT,
            nro_afiliado TEXT,
            hipertenso TEXT,
            diabetico TEXT,
            alteracion_coagulacion TEXT,
            fuma TEXT,
            tiempo_fumador TEXT,
            asma TEXT,
            consume_drogas TEXT,
            detalle_drogas TEXT,
            insuficiencia_renal TEXT,
            insuficiencia_hepatica TEXT,
            embarazada TEXT,
            tiempo_embarazo TEXT,
            valor_presion TEXT,
            alergias TEXT,
            activo INTEGER DEFAULT 1,
            creado_en TEXT
        )
    ''')
    
    # Tabla Historia Clínica
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS historia (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            dni TEXT NOT NULL,
            fecha TEXT NOT NULL,
            piezas TEXT,
            procedimiento TEXT,
            descripcion TEXT,
            profesional TEXT,
            id_adjunto TEXT,
            FOREIGN KEY (dni) REFERENCES pacientes(dni)
        )
    ''')

    # NUEVO: Intentamos agregar cada columna UNA POR UNA. 
    # Si una ya existe, falla en silencio y sigue con la próxima.
    columnas_facturacion = [
        "monto TEXT",
        "forma_pago TEXT",
        "financiacion TEXT",
        "pagado TEXT DEFAULT 'No'",
        "pagos_detalle TEXT DEFAULT '[]'",
        "tiene_financiacion TEXT DEFAULT 'No'",
        "cuotas TEXT",
        "id_adjunto_pago TEXT"
    ]
    
    for col in columnas_facturacion:
        try:
            cursor.execute(f"ALTER TABLE historia ADD COLUMN {col}")
        except Exception:
            pass 

    # Tabla Turnos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS turnos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            titulo TEXT NOT NULL,
            fecha TEXT NOT NULL,
            hora TEXT NOT NULL,
            duracion INTEGER DEFAULT 30,
            dni_paciente TEXT,
            estado TEXT DEFAULT 'pendiente',
            notas TEXT,
            creado_en TEXT
        )
    ''')
    
    conn.commit()
    conn.close()
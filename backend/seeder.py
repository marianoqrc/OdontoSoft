import sqlite3
import random
import json
from datetime import datetime, timedelta
from faker import Faker

# Ajustá esto si tu base de datos está en otra ruta
DB_PATH = 'data/odontosoft.db' 

fake = Faker('es_AR')

# --- CONFIGURACIÓN DE DATOS FALSOS ---
PROCEDIMIENTOS = ['Consulta', 'Limpieza / Profilaxis', 'Obturación', 'Extracción', 'Blanqueamiento', 'Ortodoncia', 'Radiografía']
ESTADOS_DIENTE = ['sano', 'caries', 'obturado', 'extraido', 'implante', 'corona']
FORMAS_PAGO = ['Transferencia', 'Efectivo', 'Tarjeta', 'Obra Social']
PIEZAS_FDI = [
    11,12,13,14,15,16,17,18, 21,22,23,24,25,26,27,28,
    31,32,33,34,35,36,37,38, 41,42,43,44,45,46,47,48
]
SECCIONES = ['C', 'T', 'B', 'L', 'R']

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def generar_odontograma_falso():
    """Genera una selección aleatoria de piezas para el odontograma"""
    piezas = []
    cant_piezas_afectadas = random.randint(1, 4)
    for _ in range(cant_piezas_afectadas):
        diente = random.choice(PIEZAS_FDI)
        estado = random.choice(ESTADOS_DIENTE)
        
        if estado in ['extraido', 'implante', 'corona']:
            # Afecta a todo el diente
            piezas.append(f"{diente}:{estado}")
        else:
            # Afecta solo a una cara
            seccion = random.choice(SECCIONES)
            piezas.append(f"{diente}-{seccion}:{estado}")
    return ",".join(piezas)

def generar_pagos_parciales(monto_total, pagado_str):
    """Genera el JSON de pagos parciales basado en si pagó todo o no"""
    if monto_total == 0:
        return "[]"
        
    pagos = []
    if pagado_str == 'Si':
        # Pagó todo en un solo pago o en dos mitades
        if random.choice([True, False]):
            pagos.append({
                "id": fake.random_int(min=1000, max=9999),
                "monto": str(monto_total),
                "metodo": random.choice(FORMAS_PAGO),
                "fecha": fake.date_between(start_date='-1y', end_date='today').strftime('%d/%m/%Y')
            })
        else:
            mitad = monto_total // 2
            pagos.append({
                "id": fake.random_int(min=1000, max=4000), "monto": str(mitad), "metodo": "Efectivo", "fecha": fake.date_between(start_date='-1y', end_date='-6m').strftime('%d/%m/%Y')
            })
            pagos.append({
                "id": fake.random_int(min=5000, max=9999), "monto": str(monto_total - mitad), "metodo": "Transferencia", "fecha": fake.date_between(start_date='-5m', end_date='today').strftime('%d/%m/%Y')
            })
    else:
        # No pagó todo (debe plata). Generamos un pago parcial menor al total.
        pago_parcial = random.randint(1000, monto_total - 1000)
        pagos.append({
            "id": fake.random_int(min=1000, max=9999),
            "monto": str(pago_parcial),
            "metodo": random.choice(FORMAS_PAGO),
            "fecha": fake.date_between(start_date='-1m', end_date='today').strftime('%d/%m/%Y')
        })
        
    return json.dumps(pagos)


def sembrar_datos_completos(cantidad_pacientes=50):
    print(f"🌱 Sembrando {cantidad_pacientes} pacientes con historias clínicas complejas...")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    for i in range(cantidad_pacientes):
        # 1. CREAR PACIENTE
        dni = str(fake.unique.random_int(min=10000000, max=50000000))
        nombre = fake.first_name()
        apellido = fake.last_name()
        fecha_nac = fake.date_of_birth(minimum_age=18, maximum_age=80).isoformat()
        
        cursor.execute('''
            INSERT INTO pacientes (
                dni, nombre, apellido, fecha_nacimiento, telefono, email, activo, creado_en
            ) VALUES (?, ?, ?, ?, ?, ?, 1, ?)
        ''', (
            dni, nombre, apellido, fecha_nac, fake.phone_number(), fake.email(), datetime.now().isoformat()
        ))
        
        # 2. CREAR INTERVENCIONES (Entre 1 y 4 por paciente)
        cant_intervenciones = random.randint(1, 4)
        for _ in range(cant_intervenciones):
            procedimiento = random.choice(PROCEDIMIENTOS)
            fecha_evento = fake.date_time_between(start_date='-2y', end_date='now').isoformat()
            
            # Facturación y cobro aleatorio
            monto = random.randint(5000, 150000) // 1000 * 1000 # Redondeado a miles
            pagado = random.choice(['Si', 'No'])
            
            # Lógica para Ortodoncia (generalmente con cuotas)
            if procedimiento == 'Ortodoncia':
                tiene_financiacion = 'Si'
                cuotas = random.choice(['6 Cuotas', '12 Cuotas', 'Plan Personalizado'])
                descripcion = "[DETALLE ORTODONCIA]\nMordida: Clase 2\nAparato: Fijos (Brackets metálicos)\nPlan: Alineación inicial\n\n[NOTAS]\nPaciente inició tratamiento."
            else:
                tiene_financiacion = 'No'
                cuotas = ''
                descripcion = fake.text(max_nb_chars=100)
                
            pagos_json = generar_pagos_parciales(monto, pagado)
            piezas_str = generar_odontograma_falso()
            
            # Insertar historia
            cursor.execute('''
                INSERT INTO historia (
                    dni, fecha, piezas, procedimiento, descripcion, profesional, 
                    id_adjunto, monto, pagos_detalle, tiene_financiacion, cuotas, pagado, id_adjunto_pago
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                dni, fecha_evento, piezas_str, procedimiento, descripcion, "Dr. Prueba",
                f"ADJ_{fake.random_int(min=1000, max=9999)}", # id_adjunto ficticio
                str(monto), pagos_json, tiene_financiacion, cuotas, pagado,
                f"PAGO_{fake.random_int(min=1000, max=9999)}" # id_adjunto_pago ficticio
            ))
            
        if (i + 1) % 10 == 0:
            print(f"✅ {i + 1} pacientes generados con su historial...")
            
    conn.commit()
    conn.close()
    print("🎉 ¡Siembra compleja completada con éxito!")

if __name__ == '__main__':
    # Hacemos 50 para que tengas una buena muestra variada. Podés cambiarlo.
    sembrar_datos_completos(50)
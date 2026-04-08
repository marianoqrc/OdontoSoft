import sqlite3
import random
from datetime import datetime, timedelta
from faker import Faker
from config import DB_PATH, get_db_connection

# Inicializamos Faker en español para que los nombres suenen reales
fake = Faker('es_AR')

def sembrar_pacientes(cantidad=500):
    print(f"🌱 Sembrando {cantidad} pacientes falsos...")
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    for i in range(cantidad):
        # Generar datos falsos realistas
        dni = str(fake.unique.random_int(min=10000000, max=50000000))
        nombre = fake.first_name()
        apellido = fake.last_name()
        
        # Fecha de nacimiento aleatoria (entre 18 y 80 años atrás)
        fecha_nac = fake.date_of_birth(minimum_age=18, maximum_age=80).isoformat()
        
        telefono = fake.phone_number()
        email = fake.email()
        
        # Obras sociales comunes (algunos sin obra social)
        obras_sociales = ['OSDE', 'Swiss Medical', 'Galeno', 'PAMI', 'IOMA', 'Ninguna']
        obra_social = random.choice(obras_sociales)
        nro_afiliado = str(fake.random_int(min=10000, max=99999)) if obra_social != 'Ninguna' else ""
        
        # Antecedentes médicos aleatorios (la mayoría sanos, algunos con algo)
        hipertenso = "Sí" if random.random() < 0.15 else "No"
        diabetico = "Sí" if random.random() < 0.10 else "No"
        fuma = "Sí" if random.random() < 0.20 else "No"
        tiempo_fumador = "5 años" if fuma == "Sí" else ""
        
        creado_en = datetime.now().isoformat()
        
        # Insertamos directo a la base de datos
        cursor.execute('''
            INSERT INTO pacientes (
                dni, nombre, apellido, fecha_nacimiento, telefono, email,
                obra_social, nro_afiliado, hipertenso, diabetico, fuma, tiempo_fumador,
                activo, creado_en
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        ''', (
            dni, nombre, apellido, fecha_nac, telefono, email,
            obra_social, nro_afiliado, hipertenso, diabetico, fuma, tiempo_fumador,
            creado_en
        ))
        
        # Imprimir progreso cada 50 pacientes
        if (i + 1) % 50 == 0:
            print(f"✅ {i + 1} pacientes generados...")
            
    conn.commit()
    conn.close()
    print("🎉 ¡Siembra completada con éxito!")

if __name__ == '__main__':
    # Podés cambiar el 500 por la cantidad que quieras (ej: 1000, 5000)
    # Recomendación: probá primero con 500 para no volver loco al navegador.
    sembrar_pacientes(500)
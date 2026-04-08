import os
from datetime import datetime, date, timedelta
from config import get_db_connection
import pacientes as pac

HORA_MANANA_INICIO = "09:00"
HORA_MANANA_FIN    = "13:00"
HORA_TARDE_INICIO  = "14:00"
HORA_TARDE_FIN     = "20:00"
DURACION_MODULO    = 15  # minutos

def generar_modulos(hora_inicio, hora_fin):
    """Genera lista de módulos de 15 min entre dos horas."""
    modulos = []
    h, m = map(int, hora_inicio.split(':'))
    hf, mf = map(int, hora_fin.split(':'))
    fin_mins = hf * 60 + mf
    actual = h * 60 + m
    while actual < fin_mins:
        modulos.append(f"{actual//60:02d}:{actual%60:02d}")
        actual += DURACION_MODULO
    return modulos

MODULOS_MANANA = generar_modulos(HORA_MANANA_INICIO, HORA_MANANA_FIN)
MODULOS_TARDE  = generar_modulos(HORA_TARDE_INICIO,  HORA_TARDE_FIN)

def hora_a_mins(hora):
    h, m = map(int, hora.split(':'))
    return h * 60 + m

def mins_a_hora(mins):
    return f"{mins//60:02d}:{mins%60:02d}"

def leer_todos():
    """Lee todos los turnos no cancelados de SQLite."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM turnos WHERE estado != 'cancelado'")
    rows = cursor.fetchall()
    conn.close()
    
    # Formateamos para que el frontend reciba las mismas claves que usaba el Excel
    turnos = []
    for row in rows:
        t = dict(row)
        # Adaptamos los nombres de columnas de SQLite a lo que espera tu frontend
        turnos.append({
            "id": t["id"],
            "fecha": t["fecha"],
            "hora_inicio": t["hora"],
            "hora_fin": mins_a_hora(hora_a_mins(t["hora"]) + t["duracion"]),
            "dni_paciente": t["dni_paciente"],
            "nombre_paciente": t["titulo"], # El título en DB es el nombre del paciente en el front
            "motivo": t["notas"],           # Las notas en DB son el motivo en el front
            "estado": t["estado"],
            "creado_en": t["creado_en"]
        })
    return turnos

def leer_por_fecha(fecha_str):
    todos = leer_todos()
    return [t for t in todos if str(t.get("fecha","")) == fecha_str]

def get_disponibilidad(fecha_str, turno="manana"):
    """
    Devuelve módulos con estado libre/ocupado para el turno seleccionado.
    """
    modulos = MODULOS_MANANA if turno == "manana" else MODULOS_TARDE
    ocupados = leer_por_fecha(fecha_str)

    # Construir set de módulos ocupados
    modulos_ocupados = {}
    for t in ocupados:
        inicio = hora_a_mins(str(t["hora_inicio"]))
        fin    = hora_a_mins(str(t["hora_fin"]))
        cur = inicio
        while cur < fin:
            modulos_ocupados[mins_a_hora(cur)] = t
            cur += DURACION_MODULO

    resultado = []
    for m in modulos:
        if m in modulos_ocupados:
            resultado.append({
                "hora":   m,
                "estado": "ocupado",
                "turno":  modulos_ocupados[m],
            })
        else:
            resultado.append({
                "hora":   m,
                "estado": "libre",
                "turno":  None,
            })
    return resultado

def get_timeline(fecha_str, turno="manana"):
    """
    Devuelve el timeline del día consolidando bloques ocupados y libres,
    incluyendo el teléfono del paciente.
    """
    modulos = MODULOS_MANANA if turno == "manana" else MODULOS_TARDE
    hora_fin_str = HORA_MANANA_FIN if turno == "manana" else HORA_TARDE_FIN
    ocupados = leer_por_fecha(fecha_str)
    
    # Obtenemos todos los pacientes para cruzar datos
    lista_pacientes = pac.listar_pacientes()
    mapa_pacientes = {str(p.get("dni")): p.get("telefono", "") for p in lista_pacientes}

    # Turnos del período
    inicio_periodo = hora_a_mins(modulos[0])
    fin_periodo    = hora_a_mins(hora_fin_str)

    turnos_periodo = []
    for t in ocupados:
        inicio = hora_a_mins(str(t["hora_inicio"]))
        fin    = hora_a_mins(str(t["hora_fin"]))
        
        # Agregamos el teléfono al turno cruzando por DNI
        dni_paciente = str(t.get("dni_paciente", ""))
        telefono = mapa_pacientes.get(dni_paciente, "")
        t["telefono_paciente"] = telefono
        
        if inicio >= inicio_periodo and fin <= fin_periodo:
            turnos_periodo.append({
                **t,
                "inicio_mins": inicio,
                "fin_mins":    fin,
            })

    turnos_periodo.sort(key=lambda x: x["inicio_mins"])

    bloques = []
    cursor = inicio_periodo

    for t in turnos_periodo:
        # Bloque libre antes del turno
        if cursor < t["inicio_mins"]:
            bloques.append({
                "tipo":        "libre",
                "hora_inicio": mins_a_hora(cursor),
                "hora_fin":    mins_a_hora(t["inicio_mins"]),
                "duracion_min": t["inicio_mins"] - cursor,
            })
        # Bloque ocupado
        bloques.append({
            "tipo":         "ocupado",
            "hora_inicio":  mins_a_hora(t["inicio_mins"]),
            "hora_fin":     mins_a_hora(t["fin_mins"]),
            "duracion_min": t["fin_mins"] - t["inicio_mins"],
            "turno":        t,
        })
        cursor = t["fin_mins"]

    # Bloque libre al final
    if cursor < fin_periodo:
        bloques.append({
            "tipo":         "libre",
            "hora_inicio":  mins_a_hora(cursor),
            "hora_fin":     mins_a_hora(fin_periodo),
            "duracion_min": fin_periodo - cursor,
        })

    return bloques

def crear_turno(datos):
    fecha       = datos.get("fecha")
    hora_inicio = datos.get("hora_inicio")
    hora_fin    = datos.get("hora_fin")

    # Verificar que los módulos estén libres
    ocupados = leer_por_fecha(fecha)
    inicio_nuevo = hora_a_mins(hora_inicio)
    fin_nuevo    = hora_a_mins(hora_fin)

    for t in ocupados:
        ini = hora_a_mins(str(t["hora_inicio"]))
        fin = hora_a_mins(str(t["hora_fin"]))
        if not (fin_nuevo <= ini or inicio_nuevo >= fin):
            raise ValueError(
                f"El horario se superpone con un turno existente "
                f"({t['hora_inicio']} - {t['hora_fin']})"
            )

    duracion = fin_nuevo - inicio_nuevo
    creado_en = datetime.now().isoformat()
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # INSERT en SQLite
    cursor.execute('''
        INSERT INTO turnos (titulo, fecha, hora, duracion, dni_paciente, notas, estado, creado_en)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        datos.get("nombre_paciente", ""), # titulo
        fecha,
        hora_inicio, # hora
        duracion,
        datos.get("dni_paciente", ""),
        datos.get("motivo", ""), # notas
        "confirmado", # estado inicial
        creado_en
    ))
    
    nuevo_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return {"ok": True, "id": nuevo_id}

def cancelar_turno(turno_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # UPDATE en SQLite
    cursor.execute("UPDATE turnos SET estado = 'cancelado' WHERE id = ?", (turno_id,))
    
    conn.commit()
    conn.close()
    return {"ok": True}
    
def proximos_turnos(dias=7):
    hoy = date.today()
    todos = leer_todos()
    resultado = []
    for i in range(dias):
        dia = hoy + timedelta(days=i)
        if dia.weekday() in [0,1,2,3,4,5]: # Lunes a Sábado
            fecha_str = dia.isoformat()
            del_dia = [t for t in todos if str(t.get("fecha","")) == fecha_str]
            resultado.extend(del_dia)
            
    return sorted(resultado, key=lambda t: (str(t["fecha"]), str(t["hora_inicio"])))

def actualizar_turno(turno_id, datos):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Armamos la consulta dinámicamente según lo que venga en 'datos'
    actualizaciones = []
    valores = []
    
    if "nombre_paciente" in datos:
        actualizaciones.append("titulo = ?")
        valores.append(datos["nombre_paciente"])
        
    if "motivo" in datos:
        actualizaciones.append("notas = ?")
        valores.append(datos["motivo"])
        
    if not actualizaciones:
        return {"ok": True} # No hay nada que actualizar
        
    valores.append(turno_id) # Para el WHERE
    
    query = f"UPDATE turnos SET {', '.join(actualizaciones)} WHERE id = ?"
    cursor.execute(query, valores)
    
    conn.commit()
    conn.close()
    
    return {"ok": True}
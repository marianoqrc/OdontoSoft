import os


DATA_DIR = os.environ.get("ODONTO_DATA_DIR", os.path.join(os.path.dirname(__file__), "datos"))


#CREA LA CARPETA DE DATOS SI NO EXISTE Y DEVUELVE EL PATH
def init_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)
    return DATA_DIR
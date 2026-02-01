import os
import json
import re

# --- CONFIGURACIÓN ACTUALIZADA ---
carpeta_raiz = './work'
ruta_web_prefijo = 'work/'
archivo_salida = 'data.json'     
categoria_default = "random"      
# ---------------------------------

def limpiar_nombre(nombre_archivo):
    """
    Elimina extensión, elimina la palabra 'cover', 
    separa fecha si existe y devuelve título limpio y fecha.
    """
    # 1. Quitar extensión
    nombre_sin_ext = os.path.splitext(nombre_archivo)[0]
    
    # 2. Reemplazar guiones bajos por espacios para facilitar análisis
    nombre_limpio = nombre_sin_ext.replace('_', ' ').replace('-', ' ')
    
    # 3. Quitar la palabra "cover" (insensible a mayúsculas)
    patron_cover = re.compile(r'\bcover\b', re.IGNORECASE)
    nombre_limpio = patron_cover.sub('', nombre_limpio)
    
    # 4. Buscar año (4 dígitos)
    fecha = ""
    # Buscamos 4 dígitos aislados
    match_fecha = re.search(r'\b(19|20)\d{2}\b', nombre_limpio)
    if match_fecha:
        fecha = match_fecha.group(0)
        # Quitamos la fecha del título para que no se repita
        nombre_limpio = nombre_limpio.replace(fecha, '')
    
    # 5. Limpieza final de espacios extra
    titulo = " ".join(nombre_limpio.split()) # Quita espacios dobles y trims
    
    # Si tras limpiar no queda nada, usar el nombre original (backup)
    if not titulo:
        titulo = nombre_sin_ext

    return titulo, fecha

def generar_json():
    items = []
    id_counter = 1
    nuevos_contador = 0
    
    # Extensiones permitidas
    extensiones_validas = (".jpg", ".jpeg", ".png", ".webp", ".gif", ".mp4", ".mov")

    print(f"🔄 Escaneando carpetas en: {carpeta_raiz} ...")

    # Recorremos carpetas (os.walk)
    for root, dirs, files in os.walk(carpeta_raiz):
        
        # Ignorar carpetas ocultas (las que empiezan por .)
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        
        # Filtrar solo archivos de imagen/video válidos en la carpeta actual
        archivos_media = [f for f in files if f.lower().endswith(extensiones_validas) and not f.startswith('.')]
        archivos_media.sort() # Orden alfabético

        # SI NO HAY ARCHIVOS MULTIMEDIA EN ESTA CARPETA, SALTAMOS A LA SIGUIENTE
        if not archivos_media:
            continue

        # --- DETERMINAR PROYECTO (NOMBRE DE CARPETA) ---
        ruta_relativa = os.path.relpath(root, carpeta_raiz)
        partes_carpetas = ruta_relativa.split(os.sep)

        # Si estamos en la raíz raíz (./work) y hay fotos sueltas, decidimos nombre genérico o saltamos
        if ruta_relativa == '.':
            nombre_proyecto = "General" # O el nombre que prefieras para archivos sueltos en root
        else:
            # El proyecto es el nombre de la carpeta actual (sea nivel 1 o 2)
            nombre_proyecto = partes_carpetas[-1]

        # --- BUSCAR EL ARCHIVO "COVER" ---
        archivo_cover = None
        otros_archivos = []

        # Estrategia: Buscar primero uno que diga "cover"
        for f in archivos_media:
            if "cover" in f.lower():
                archivo_cover = f
                break
        
        # Si no existe ninguno con "cover", cogemos el primero de la lista por defecto
        if not archivo_cover and archivos_media:
            archivo_cover = archivos_media[0]

        # Separar el resto de archivos
        otros_archivos = [f for f in archivos_media if f != archivo_cover]

        # --- EXTRAER DATOS DEL COVER ---
        titulo_final, fecha_final = limpiar_nombre(archivo_cover)
        
        # Construir ruta web del thumbnail
        if ruta_relativa == '.':
            path_thumb = os.path.join(ruta_web_prefijo, archivo_cover)
        else:
            path_thumb = os.path.join(ruta_web_prefijo, ruta_relativa, archivo_cover)
        
        path_thumb = path_thumb.replace('\\', '/') # Web friendly

        # --- PROCESAR LISTA DE IMÁGENES SECUNDARIAS ---
        lista_imagenes_json = []
        for f in otros_archivos:
            if ruta_relativa == '.':
                p = os.path.join(ruta_web_prefijo, f)
            else:
                p = os.path.join(ruta_web_prefijo, ruta_relativa, f)
            
            p = p.replace('\\', '/')
            
            lista_imagenes_json.append({
                "path": p,
                "random": False
            })

        # --- CREAR EL OBJETO JSON ---
        item = {
            "id": id_counter,
            "titulo": titulo_final,
            "proyecto": nombre_proyecto,
            "categoria": categoria_default, # O lógica personalizada si la necesitas
            "thumbnail": path_thumb,
            "imagenes": lista_imagenes_json,
            "fecha": fecha_final,
            "tag": "",            # Dejar vacío o lógica extra
            "descripcion": "",    # Vacío por defecto
            "comentario": "",     # Vacío por defecto
            "tipo": "",           # Vacío por defecto
            "oculto": False
        }

        items.append(item)
        id_counter += 1
        nuevos_contador += 1 # En este enfoque, regeneramos todo, así que contamos los items procesados

    # --- GUARDAR JSON ---
    with open(archivo_salida, 'w', encoding='utf-8') as f:
        json.dump(items, f, ensure_ascii=False, indent=4)
        
    print(f"---------------------------------------------")
    print(f"✅ DATA.JSON GENERADO")
    print(f"📂 Total Proyectos encontrados: {len(items)}")
    print(f"---------------------------------------------")

if __name__ == "__main__":
    generar_json()
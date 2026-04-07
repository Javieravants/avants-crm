#!/usr/bin/env python3
"""
Descarga masiva de grabaciones CloudTalk → Hetzner S3 → Gestavly BD
Filtra llamadas > 60 segundos
"""
import subprocess, json, time, sys
from datetime import datetime

API_KEY = "QSCWFZZPEL4MAKOB1MXQ8L6"
API_SECRET = "nHqaFm18?VdgN5owUs7LIfKlrk93OTPMi-GJSjph"

# Config S3 Hetzner
import os
S3_BUCKET = "gestavly-uploads"
S3_ENDPOINT = "https://s3.hel1.your-objectstorage.com"

# Stats
stats = {"total": 0, "filtradas": 0, "descargadas": 0, "errores": 0, "ya_existia": 0}

def cloudtalk_get(url):
    result = subprocess.run([
        "curl", "-s", "-u", f"{API_KEY}:{API_SECRET}", url
    ], capture_output=True, text=True, timeout=30)
    return json.loads(result.stdout)

def upload_to_s3(local_path, s3_key):
    """Subir a Hetzner Object Storage via AWS CLI"""
    result = subprocess.run([
        "aws", "s3", "cp", local_path,
        f"s3://{S3_BUCKET}/{s3_key}",
        "--endpoint-url", S3_ENDPOINT,
        "--acl", "public-read"
    ], capture_output=True, text=True, timeout=120)
    return result.returncode == 0

def check_db_exists(call_id):
    result = subprocess.run([
        "psql", os.environ.get("DATABASE_URL", ""),
        "-tAc", f"SELECT id FROM call_recordings WHERE cloudtalk_id='{call_id}' LIMIT 1"
    ], capture_output=True, text=True)
    return bool(result.stdout.strip())

def save_to_db(call_data, s3_url):
    cdr = call_data["Cdr"]
    agent = call_data.get("Agent", {})
    contact = call_data.get("Contact", {})
    phones = contact.get("contact_numbers", [])
    phone = phones[0] if phones else ""
    
    # Normalizar teléfono
    if phone and not phone.startswith("+"):
        phone = "+34" + phone.lstrip("0")

    sql = f"""
    INSERT INTO call_recordings (
        cloudtalk_id, persona_telefono, agente_nombre, agente_email,
        duracion_segundos, fecha_llamada, tipo_llamada,
        audio_url, numero_interno, numero_externo
    ) VALUES (
        '{cdr["id"]}',
        '{phone}',
        '{agent.get("fullname","").replace("'","''")}',
        '{agent.get("email","").replace("'","''")}',
        {cdr.get("billsec", 0)},
        '{cdr.get("started_at","")}',
        '{cdr.get("type","outgoing")}',
        '{s3_url}',
        '{cdr.get("public_internal","")}',
        '{cdr.get("public_external","")}'
    ) ON CONFLICT (cloudtalk_id) DO NOTHING;
    """
    
    subprocess.run([
        "psql", os.environ.get("DATABASE_URL", ""), "-c", sql
    ], capture_output=True)

def process_page(page):
    data = cloudtalk_get(
        f"https://my.cloudtalk.io/api/calls/index.json?page={page}&limit=100"
    )
    calls = data.get("responseData", {}).get("data", [])
    
    for call_data in calls:
        cdr = call_data.get("Cdr", {})
        stats["total"] += 1
        
        # Filtrar por duración > 60 segundos
        duracion = int(cdr.get("billsec", 0))
        if duracion < 60:
            stats["filtradas"] += 1
            continue
        
        # Filtrar por grabación disponible
        if not cdr.get("recorded") or cdr.get("is_voicemail"):
            stats["filtradas"] += 1
            continue
        
        call_id = cdr["id"]
        
        # Verificar si ya existe en BD
        if check_db_exists(call_id):
            stats["ya_existia"] += 1
            continue
        
        # Descargar grabación
        try:
            local_path = f"/tmp/grabacion_{call_id}.mp3"
            dl_result = subprocess.run([
                "curl", "-s", "-L", "-u", f"{API_KEY}:{API_SECRET}",
                f"https://my.cloudtalk.io/api/calls/recording/{call_id}.json",
                "-o", local_path
            ], capture_output=True, timeout=60)
            
            if dl_result.returncode != 0 or not os.path.exists(local_path):
                stats["errores"] += 1
                continue
            
            file_size = os.path.getsize(local_path)
            if file_size < 1000:  # Menos de 1KB = error
                os.remove(local_path)
                stats["errores"] += 1
                continue
            
            # Subir a S3
            fecha = cdr.get("started_at","")[:10]
            s3_key = f"grabaciones/cloudtalk/{fecha}/{call_id}.mp3"
            
            if upload_to_s3(local_path, s3_key):
                s3_url = f"{S3_ENDPOINT}/{S3_BUCKET}/{s3_key}"
                save_to_db(call_data, s3_url)
                stats["descargadas"] += 1
                print(f"  ✅ {call_id} | {duracion}s | {s3_url}")
            else:
                stats["errores"] += 1
            
            os.remove(local_path)
            time.sleep(0.5)  # Respetar rate limit (60/min)
            
        except Exception as e:
            print(f"  ❌ Error {call_id}: {e}")
            stats["errores"] += 1
    
    return len(calls)

# Main
if __name__ == "__main__":
    print(f"🚀 Iniciando descarga masiva CloudTalk → Gestavly S3")
    print(f"   Filtro: duración > 60 segundos, con grabación, no buzón")
    print(f"   Inicio: {datetime.now()}\n")
    
    page = 1
    while True:
        print(f"📄 Página {page}...")
        count = process_page(page)
        
        print(f"   Stats: total={stats['total']} descargadas={stats['descargadas']} filtradas={stats['filtradas']} errores={stats['errores']} ya_existia={stats['ya_existia']}")
        
        if count < 100:
            break
        
        page += 1
        time.sleep(1)
    
    print(f"\n✅ COMPLETADO: {datetime.now()}")
    print(json.dumps(stats, indent=2))

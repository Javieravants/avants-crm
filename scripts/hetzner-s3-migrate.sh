#!/bin/bash
# Migrar PDFs locales de /uploads/ a Hetzner S3
# Ejecutar como root desde el VPS: bash /root/hetzner-s3-migrate.sh

set -e

APP_DIR="/var/www/gestavly"

echo "=== Migrando PDFs a Hetzner S3 ==="

# Instalar s3cmd si no existe
if ! command -v s3cmd &>/dev/null; then
  echo "Instalando s3cmd..."
  apt install -y s3cmd
fi

# Configurar s3cmd
cat > /root/.s3cfg <<'CFG'
[default]
access_key = 4N7A23DVNBC36C5HHXR8
secret_key = hKDuINK8cHxfK4WdiOtuO4NIvcPru4terYAml3oY
host_base = hel1.your-objectstorage.com
host_bucket = %(bucket)s.hel1.your-objectstorage.com
use_https = True
CFG

BUCKET="s3://gestavly-uploads"
PUBLIC_URL="https://gestavly-uploads.hel1.your-objectstorage.com"

# Subir propuestas
PROP_DIR="$APP_DIR/uploads/propuestas"
if [ -d "$PROP_DIR" ] && [ "$(ls -A $PROP_DIR 2>/dev/null)" ]; then
  echo "=== Subiendo propuestas ==="
  s3cmd put --recursive --acl-public \
    --mime-type="application/pdf" \
    "$PROP_DIR/" "${BUCKET}/propuestas/"

  # Actualizar URLs en BD
  cd "$APP_DIR"
  node -e "
    require('dotenv').config();
    const pool = require('./backend/config/db');
    async function run() {
      const r = await pool.query(
        \"UPDATE propuestas SET pdf_url = REPLACE(pdf_url, '/uploads/propuestas/', '${PUBLIC_URL}/propuestas/') WHERE pdf_url LIKE '/uploads/propuestas/%' RETURNING id\"
      );
      console.log('Propuestas actualizadas:', r.rowCount);
      process.exit(0);
    }
    run().catch(e => { console.error(e); process.exit(1); });
  "
else
  echo "No hay propuestas locales que migrar"
fi

# Subir grabaciones
GRAB_DIR="$APP_DIR/uploads/grabaciones"
if [ -d "$GRAB_DIR" ] && [ "$(ls -A $GRAB_DIR 2>/dev/null)" ]; then
  echo "=== Subiendo grabaciones ==="
  s3cmd put --recursive --acl-public \
    --mime-type="application/pdf" \
    "$GRAB_DIR/" "${BUCKET}/grabaciones/"

  cd "$APP_DIR"
  node -e "
    require('dotenv').config();
    const pool = require('./backend/config/db');
    async function run() {
      const r = await pool.query(
        \"UPDATE deals SET grabacion_pdf_url = REPLACE(grabacion_pdf_url, '/uploads/grabaciones/', '${PUBLIC_URL}/grabaciones/') WHERE grabacion_pdf_url LIKE '/uploads/grabaciones/%' RETURNING id\"
      );
      console.log('Grabaciones actualizadas:', r.rowCount);
      process.exit(0);
    }
    run().catch(e => { console.error(e); process.exit(1); });
  "
else
  echo "No hay grabaciones locales que migrar"
fi

echo ""
echo "=== Migracion S3 completada ==="
echo ""

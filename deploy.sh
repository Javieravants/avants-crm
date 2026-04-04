#!/bin/bash
echo "Desplegando en produccion..."
ssh root@116.203.90.76 'cd /var/www/gestavly && git pull origin main && npm install --omit=dev && pm2 restart gestavly && sleep 2 && pm2 status && git log --oneline -3'
echo "Deploy completado"

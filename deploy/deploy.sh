#!/usr/bin/env bash
# ==============================================================================
# MultiMeteo - Script di Deployment Automatico per VM Ubuntu Server (NO Docker)
# Destinazione: 100.115.154.44 (Tailscale) | Porta: 8085
# ==============================================================================

set -e

# Configurazione ambiente
REMOTE_USER="${REMOTE_USER:-ubuntu}"
REMOTE_HOST="${REMOTE_HOST:-100.115.154.44}"
REMOTE_PORT="${REMOTE_PORT:-8085}"
REMOTE_DIR="${REMOTE_DIR:-/var/www/multimeteo}"

echo "=================================================="
echo "🚀 Avvio Deploy MultiMeteo PWA su $REMOTE_HOST:$REMOTE_PORT"
echo "=================================================="

# 1. Verifica dipendenze e build locale
echo "📦 [1/4] Compilazione bundle di produzione (Vite + TS)..."
npm run build

# 2. Creazione cartella remota se non esiste
echo "📂 [2/4] Verifica directory remota su $REMOTE_HOST..."
ssh -o ConnectTimeout=8 "$REMOTE_USER@$REMOTE_HOST" "sudo mkdir -p $REMOTE_DIR/dist && sudo chown -R \$USER:\$USER $REMOTE_DIR"

# 3. Sincronizzazione file compilati tramite rsync
echo "🔄 [3/4] Sincronizzazione file statici (dist/)..."
rsync -avz --delete --progress dist/ "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/dist/"

# 4. Riavvio web server (Nginx o Systemd)
echo "⚡ [4/4] Applicazione configurazione e reload web server..."
ssh "$REMOTE_USER@$REMOTE_HOST" "bash -s" << 'EOF'
    if command -v nginx >/dev/null 2>&1; then
        echo "--> Rilevato Nginx: test configurazione e reload..."
        sudo nginx -t && sudo systemctl reload nginx
    elif systemctl is-active --quiet multimeteo; then
        echo "--> Rilevato servizio systemd multimeteo: restart..."
        sudo systemctl restart multimeteo
    elif command -v caddy >/dev/null 2>&1; then
        echo "--> Rilevato Caddy: reload..."
        sudo caddy reload
    else
        echo "--> NOTA: Assicurati che Nginx o Caddy o multimeteo.service siano attivi per servire /var/www/multimeteo/dist."
    fi
EOF

echo ""
echo "=================================================="
echo "✅ Deploy completato con successo!"
echo "🌐 URL applicazione: http://$REMOTE_HOST:$REMOTE_PORT"
echo "=================================================="

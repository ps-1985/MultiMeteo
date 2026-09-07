import React, { useState } from 'react';
import { X, Server, Copy, Check, Terminal, FileCode, Cpu } from 'lucide-react';

interface DeployGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeployGuideModal: React.FC<DeployGuideModalProps> = ({
  isOpen,
  onClose
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const nginxSnippet = `# /etc/nginx/sites-available/multimeteo
server {
    listen 8085;
    server_name 100.115.154.44;

    root /var/www/multimeteo/dist;
    index index.html;

    # Compressione gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Caching asset con fingerprint
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Manifest e Service Worker
    location ~* (sw\.js|manifest\.webmanifest|registerSW\.js)$ {
        expires -1;
        add_header Cache-Control "no-store, no-cache, must-revalidate";
    }

    # Fallback SPA routing
    location / {
        try_files $uri $uri/ /index.html;
        add_header X-Frame-Options "SAMEORIGIN";
        add_header X-Content-Type-Options "nosniff";
    }
}`;

  const caddySnippet = `# Caddyfile snippet (Ubuntu)
100.115.154.44:8085 {
    root * /var/www/multimeteo/dist
    file_server
    try_files {path} /index.html
    encode gzip zstd
}`;

  const systemdSnippet = `[Unit]
Description=MultiMeteo Static SPA Server (Node)
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/multimeteo
ExecStart=/usr/bin/npx serve -s /var/www/multimeteo/dist -l 8085
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target`;

  const deployShSnippet = `#!/usr/bin/env bash
set -e

REMOTE_HOST="100.115.154.44"
TARGET_DIR="/var/www/multimeteo"

echo "==> Build di produzione MultiMeteo..."
npm run build

echo "==> Sincronizzazione file su Ubuntu Server ($REMOTE_HOST:8085)..."
rsync -avz --delete dist/ "$REMOTE_HOST:$TARGET_DIR/dist/"

echo "==> Reload Nginx su nodo remoto..."
ssh "$REMOTE_HOST" "sudo nginx -t && sudo systemctl reload nginx"

echo "✓ Deploy completato con successo su http://$REMOTE_HOST:8085"`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Guida al Deploy Nativo Ubuntu Linux (NO Docker)
              </h3>
              <p className="text-xs text-slate-400">
                Hosting su VM Ubuntu Tailscale: <span className="text-indigo-300 font-mono">100.115.154.44:8085</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 text-sm text-slate-300 max-h-[75vh] overflow-y-auto">
          {/* Summary Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 text-xs text-blue-200">
            <p className="font-semibold text-blue-300 mb-1">
              Informazioni di rete & Port allocation:
            </p>
            <p>
              Le porte 8080 e 8081 sono già occupate sulla VM. L'applicazione è configurata per essere servita sulla porta libera <b className="text-white">8085</b> senza Docker, tramite Nginx, Caddy o demone systemd nativo.
            </p>
          </div>

          {/* Option 1: Nginx (Consigliato) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-white">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span>Opzione 1: Configurazione Nginx (/etc/nginx/sites-available/multimeteo)</span>
              </div>
              <button
                onClick={() => copyToClipboard(nginxSnippet, 'nginx')}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                {copiedKey === 'nginx' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'nginx' ? 'Copiato!' : 'Copia'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto text-slate-300">
              {nginxSnippet}
            </pre>
            <div className="text-xs text-slate-400 space-y-1">
              <p>Comandi di attivazione Nginx:</p>
              <code className="block bg-slate-950 px-2 py-1 rounded border border-slate-800 font-mono text-indigo-300">
                sudo ln -s /etc/nginx/sites-available/multimeteo /etc/nginx/sites-enabled/ && sudo nginx -t && sudo systemctl reload nginx
              </code>
            </div>
          </div>

          {/* Option 2: Caddy */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Terminal className="w-4 h-4 text-blue-400" />
                <span>Opzione 2: Caddyfile snippet</span>
              </div>
              <button
                onClick={() => copyToClipboard(caddySnippet, 'caddy')}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                {copiedKey === 'caddy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'caddy' ? 'Copiato!' : 'Copia'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto text-slate-300">
              {caddySnippet}
            </pre>
          </div>

          {/* Option 3: Systemd Unit */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Cpu className="w-4 h-4 text-purple-400" />
                <span>Opzione 3: Servizio Systemd (/etc/systemd/system/multimeteo.service)</span>
              </div>
              <button
                onClick={() => copyToClipboard(systemdSnippet, 'systemd')}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                {copiedKey === 'systemd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'systemd' ? 'Copiato!' : 'Copia'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto text-slate-300">
              {systemdSnippet}
            </pre>
          </div>

          {/* Deploy Automation Script */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span>Script di Deploy One-Click (deploy/deploy.sh)</span>
              </div>
              <button
                onClick={() => copyToClipboard(deployShSnippet, 'deploy')}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
              >
                {copiedKey === 'deploy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'deploy' ? 'Copiato!' : 'Copia'}</span>
              </button>
            </div>
            <pre className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs overflow-x-auto text-slate-300">
              {deployShSnippet}
            </pre>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

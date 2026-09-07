# MultiMeteo - Guida al Deploy per Ubuntu Linux Server (NO Docker)

Questa cartella contiene le configurazioni pronte all'uso per ospitare **MultiMeteo PWA** sulla VM Ubuntu Linux raggiungibile via Tailscale all'IP `100.115.154.44` sulla porta libera **`8085`** (le porte 8080 e 8081 sono già occupate).

---

## Struttura della cartella `deploy/`

```text
deploy/
├── nginx/
│   └── multimeteo.conf     # Configurazione per Nginx (consigliata per produzione)
├── caddy/
│   └── Caddyfile           # Configurazione alternativa per Caddy Server
├── systemd/
│   └── multimeteo.service  # Unit file systemd con web server Node nativo ('serve')
├── deploy.sh               # Script bash one-click per build e sync rsync
└── README.md               # Questa guida
```

---

## Metodo 1: Nginx (Consigliato)

1. Installa Nginx (se non già presente):
   ```bash
   sudo apt update && sudo apt install -y nginx
   ```

2. Crea la directory di destinazione dei file compilati:
   ```bash
   sudo mkdir -p /var/www/multimeteo/dist
   sudo chown -R $USER:www-data /var/www/multimeteo
   ```

3. Copia il file di configurazione in `/etc/nginx/sites-available/`:
   ```bash
   sudo cp deploy/nginx/multimeteo.conf /etc/nginx/sites-available/multimeteo
   ```

4. Abilita il sito creando il link simbolico e verifica la sintassi:
   ```bash
   sudo ln -s /etc/nginx/sites-available/multimeteo /etc/nginx/sites-enabled/
   sudo nginx -t
   ```

5. Ricarica Nginx:
   ```bash
   sudo systemctl reload nginx
   ```

L'app sarà immediatamente raggiungibile su:
👉 **`http://100.115.154.44:8085`**

---

## Metodo 2: Caddy Server

Se sulla VM è già in uso Caddy, basta inserire il blocco presente in `deploy/caddy/Caddyfile` all'interno del tuo file `/etc/caddy/Caddyfile`:

```caddyfile
100.115.154.44:8085 {
    root * /var/www/multimeteo/dist
    file_server
    try_files {path} /index.html
    encode gzip zstd
}
```

E ricaricare Caddy:
```bash
sudo systemctl reload caddy
```

---

## Metodo 3: Servizio nativo Node via Systemd (`serve`)

Se non desideri configurare Nginx o Caddy e preferisci un web server statico autonomo gestito da `systemd`:

1. Installa Node.js e `serve`:
   ```bash
   sudo npm install -g serve
   ```

2. Copia l'unit file systemd:
   ```bash
   sudo cp deploy/systemd/multimeteo.service /etc/systemd/system/
   ```

3. Abilita e avvia il servizio:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable multimeteo
   sudo systemctl start multimeteo
   ```

4. Controlla lo stato del demone:
   ```bash
   sudo systemctl status multimeteo
   ```

---

## Deploy Automatico da Mac / Macchina di Sviluppo

Dalla directory principale del progetto sul tuo Mac:

```bash
# Esegui il deploy one-click
./deploy/deploy.sh
```

Oppure specificando l'utente SSH della VM (se diverso da `ubuntu`):
```bash
REMOTE_USER="paolo" ./deploy/deploy.sh
```

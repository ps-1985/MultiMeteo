# MultiMeteo 🌦️📡

> **Progressive Web App (PWA)** ad alte prestazioni per il confronto orario e multi-giornaliero di **8 modelli meteorologici numerici globali e regionali** (ECMWF, DWD ICON, NOAA GFS, Météo-France, UKMO, JMA, GEM, MeteoSwiss) tramite l'API di [Open-Meteo](https://open-meteo.com).

MultiMeteo calcola in tempo reale il **Consenso Multi-Modello (Media ponderata)** e la **Banda di Incertezza atmosferica (Spread Min-Max)**, sovrapponendo i grafici previsionali e generando tabelle di discrepanza per evidenziare convergenze e divergenze sinottiche.

---

## ⚡ Caratteristiche Principali

- **8 Modelli Meteorologici Numerici Simultanei**:
  - 🇪🇺 **ECMWF IFS 0.25°**: Riferimento europeo per sinottica e geopotenziali.
  - 🇩🇪 **DWD ICON Seamless**: Modello tedesco ad alta risoluzione.
  - 🇺🇸 **NOAA GFS Seamless**: Modello globale statunitense con aggiornamenti quadridimensionali.
  - 🇫🇷 **Météo-France Seamless**: ARPEGE / AROME blend per micro-meteorologia europea.
  - 🇬🇧 **UKMO Seamless**: Unified Model del Met Office britannico.
  - 🇯🇵 **JMA Seamless**: Modello dell'agenzia meteorologica giapponese.
  - 🇨🇦 **GEM Seamless**: Modello canadese globale.
  - 🇨🇭 **MeteoSwiss ICON-CH**: Risoluzione Ultra-HD (~1-2.8 km) su Alpi e Nord Italia (attivazione condizionale per coordinate geografiche compatibili).

- **Analisi di Consenso & Incertezza**:
  - **Linea di Consenso Medio (White Telemetry)**: calcolo aritmetico istantaneo del valore medio di tutti i modelli attivi.
  - **Banda di Spread (Min-Max Shaded Area)**: visualizzazione del cono di incertezza previsionale.
  - **Indice di Accordo**: Semafori semantici (*Accordo Elevato < 1.5°C*, *Incertezza Moderata 1.5°-3.5°C*, *Divergenza Marcata > 3.5°C*).
  - **Rilevazione Modelli Estremi**: evidenziazione automatica del modello più caldo/freddo e più secco/piovoso.

- **Variabili Meteorologiche Supportate**:
  - 🌡️ **Temperatura a 2m** (°C)
  - 🌧️ **Precipitazioni orarie** (mm/h) e rischio cumulato
  - 💨 **Velocità del vento** (km/h a 10m)
  - ⚡ **Raffiche massime** (km/h)
  - 🧭 **Pressione al suolo** (hPa)

- **Orizzonti Temporali Selezionabili**: 24h, 48h, 72h e 7 Giorni.

- **Progressive Web App (PWA)**:
  - Installabile su dispositivi iOS, Android, macOS, Windows e Linux.
  - Service Worker con runtime caching delle query meteo e geocoding.
  - **Funzionamento Offline**: visualizzazione automatica dell'ultima telemetria memorizzata in `localStorage`.

- **Geocoding & GPS**:
  - Ricerca località in tempo reale (Open-Meteo Geocoding API).
  - Geolocalizzazione istantanea con un click tramite GPS del dispositivo.
  - Scorciatoie rapide per le principali città (Milano, Roma, Firenze, Torino, Zurigo, Parigi, Londra, New York, Tokyo).

---

## 🛠️ Stack Tecnologico

- **Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) + [Vite 6](https://vite.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (Design System Dark Mode denso in stile telemetria aeronautica)
- **Data Viz**: [Chart.js](https://www.chartjs.org/) + [react-chartjs-2](https://react-chartjs-2.js.org/)
- **PWA Engine**: [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) (Workbox Service Worker, manifest, offline precaching)
- **Icone**: [Lucide React](https://lucide.dev/)

---

## 🚀 Sviluppo Locale

```bash
# 1. Clona il repository
git clone https://github.com/ps-1985/MultiMeteo.git
cd MultiMeteo

# 2. Installa le dipendenze
npm install

# 3. Avvia il server di sviluppo Vite
npm run dev

# 4. Compila per la produzione
npm run build

# 5. Visualizza l'anteprima del bundle compilato
npm run preview
```

---

## 🐧 Hosting su Linux Ubuntu Server (NO Docker)

L'applicazione è concepita per essere servita come SPA statica nativa senza Docker su server Linux Ubuntu, configurata sulla porta **`8085`** (IP nodo Tailscale: `100.115.154.44`).

Tutti i file di configurazione sono contenuti nella cartella [`deploy/`](file:///deploy/):
- **Nginx (Consigliato)**: `deploy/nginx/multimeteo.conf` (con compressione gzip, caching PWA immutabile e fallback SPA).
- **Caddy Server**: `deploy/caddy/Caddyfile`
- **Systemd Demone Node**: `deploy/systemd/multimeteo.service` (con `npx serve -s dist -l 8085`).
- **Deploy Automatico**: `./deploy/deploy.sh` (compila localmente e sincronizza via `rsync`).

Consulta la [Guida Dettagliata al Deploy](file:///deploy/README.md) per le istruzioni passo-passo.

---

## 📄 Licenza

Distribuito con licenza MIT. Dati meteorologici forniti da [Open-Meteo.com](https://open-meteo.com) sotto licenza [CC-BY 4.0](https://creativecommons.org/licenses/by/4.0/).

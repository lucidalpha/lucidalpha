---
description: Anleitung zum Deployment der Saisonalitäten-Anwendung auf einem Hetzner Server
---

# 🚀 Deployment auf Hetzner Server

## Voraussetzungen

### Auf dem Server installieren:
```bash
# Docker installieren
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Docker Compose installieren
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Git installieren (falls nicht vorhanden)
sudo apt-get install git
```

---

## Deployment Schritte

### 1. Projekt auf den Server kopieren

**Option A: Via Git (empfohlen)**
```bash
# SSH auf Server verbinden
ssh root@IHRE_SERVER_IP

# Projekt klonen
cd /opt
git clone IHR_REPOSITORY_URL seasonality-app
cd seasonality-app
```

**Option B: Via SCP (ohne Git)**
```bash
# Von Ihrem lokalen PC aus:
scp -r "X:\Saisonalitäten Auswertung\*" root@IHRE_SERVER_IP:/opt/seasonality-app/
```

---

### 2. Umgebungsvariablen konfigurieren

```bash
cd /opt/seasonality-app/backend

# .env Datei erstellen/bearbeiten
nano .env
```

Inhalt der `.env`:
```env
PERPLEXITY_API_KEY=your_api_key_here
```

---

### 3. Frontend API-URLs aktualisieren

**WICHTIG:** Vor dem Deployment müssen die API-URLs im Frontend aktualisiert werden.

Die Dateien verwenden aktuell `http://localhost:8000`. Für Production müssen Sie entweder:

**Option A:** Die API-Config nutzen (empfohlen)
- Importieren Sie `API_BASE_URL` aus `src/config/api.js` in allen Komponenten
- Im Production-Build wird automatisch `/api` verwendet

**Option B:** Manuell ersetzen (schnell, aber nicht ideal)
```bash
# Im frontend/src Ordner alle localhost:8000 durch /api ersetzen
cd /opt/seasonality-app/frontend
find src -type f -name "*.jsx" -exec sed -i 's|http://localhost:8000|/api|g' {} \;
```

---

### 4. Docker Container starten

```bash
cd /opt/seasonality-app

# Container bauen und starten
docker compose up -d --build

# Status prüfen
docker compose ps

# Logs ansehen
docker compose logs -f
```

---

### 5. Firewall konfigurieren (falls UFW aktiv)

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw reload
```

---

## 🌐 Domain & HTTPS einrichten (optional, aber empfohlen)

### 1. Domain auf Server zeigen
- A-Record in DNS: `yourdomain.com -> SERVER_IP`
- CNAME für www: `www.yourdomain.com -> yourdomain.com`

### 2. SSL-Zertifikat mit Certbot

```bash
# Certbot installieren
sudo apt-get install certbot

# Zertifikat holen (Container vorher stoppen)
docker compose down
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Zertifikate kopieren
mkdir -p /opt/seasonality-app/nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/seasonality-app/nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/seasonality-app/nginx/ssl/
```

### 3. Nginx für HTTPS konfigurieren

In `nginx/nginx.conf` die HTTPS-Sektion aktivieren und Domain eintragen.

### 4. Container neu starten
```bash
docker compose up -d --build
```

---

## 🔧 Wartung & Administration

### Container neustarten
```bash
docker compose restart
```

### Updates deployen
```bash
cd /opt/seasonality-app
git pull  # Wenn via Git
docker compose up -d --build
```

### Logs ansehen
```bash
# Alle Logs
docker compose logs -f

# Nur Backend
docker compose logs -f backend

# Nur Frontend
docker compose logs -f frontend
```

### Container stoppen
```bash
docker compose down
```

### Daten-Backup
```bash
# Wichtige Daten sichern
tar -czvf backup.tar.gz \
    backend/uploads \
    backend/reports \
    backend/daily_fx_scores.json \
    backend/seasonality_cache.json \
    backend/.env
```

---

## 🔍 Troubleshooting

### Container startet nicht
```bash
docker compose logs backend
docker compose logs frontend
```

### Port bereits belegt
```bash
sudo lsof -i :80
sudo lsof -i :8000
```

### Neustart forcieren
```bash
docker compose down --remove-orphans
docker compose up -d --build --force-recreate
```

---

## 📊 Architektur

```
Internet → Nginx (Port 80/443)
                ├→ /api/* → Backend (Port 8000)
                └→ /*     → Frontend (Port 3000)
```

Die Anwendung ist nach Deployment erreichbar unter:
- **HTTP:** `http://IHRE_SERVER_IP`
- **HTTPS:** `https://yourdomain.com` (wenn konfiguriert)

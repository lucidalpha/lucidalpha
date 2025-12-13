#!/bin/bash
set -e

echo "🚀 Starte Installation..."

# 1. System Updates & Tools
apt-get update
apt-get install -y git curl

# 2. Docker Installation (falls noch nicht da)
if ! command -v docker &> /dev/null; then
    echo "🐳 Installiere Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
else
    echo "✅ Docker ist bereits installiert."
fi

# 3. Projekt Setup
TARGET_DIR="/opt/seasonality-app"

if [ -d "$TARGET_DIR" ]; then
    echo "📂 Aktualisiere bestehendes Projekt..."
    cd "$TARGET_DIR"
    git pull
else
    echo "📂 Klone Projekt von GitHub..."
    git clone https://github.com/lucidalpha/lucidalpha.git "$TARGET_DIR"
    cd "$TARGET_DIR"
fi

# 4. Environment Setup (Dummy .env damit es nicht kracht)
if [ ! -f "backend/.env" ]; then
    echo "⚙️ Erstelle Basis-Konfiguration..."
    # Wir setzen einen Dummy-Wert, da der User keinen Key hat.
    # Die App läuft trotzdem, nur die AI-Suche geht dann halt nicht.
    echo "PERPLEXITY_API_KEY=none" > backend/.env
fi

# 5. Starten
echo "🔥 Starte Anwendung (das kann kurz dauern)..."
docker compose down --remove-orphans || true
docker compose up -d --build

echo " "
echo "✅ FERTIG!"
echo "Deine App sollte jetzt erreichbar sein unter: http://$(curl -s ifconfig.me)"

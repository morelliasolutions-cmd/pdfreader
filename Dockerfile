# Dockerfile pour le service SAR Address Extraction
# Optimisé pour EasyPanel
FROM python:3.12-slim

# Variables d'environnement
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Installation des dépendances système
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copie et installation des dépendances Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copie du code de l'application
COPY extract_sar_address.py .

# Création d'un utilisateur non-root
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Exposition du port
EXPOSE 5001

# Démarrage avec gunicorn (production-ready)
# Utilise la variable d'environnement `PORT` si fournie par EasyPanel, sinon 5001
ENV PORT=5001
CMD ["sh", "-c", "gunicorn -w 2 --timeout 300 -b 0.0.0.0:${PORT} extract_sar_address:app"]

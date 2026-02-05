# Dockerfile pour l'API d'analyse PDF
FROM python:3.11-slim

# Variables d'environnement
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=5000

# Installer les dépendances système nécessaires pour pdfplumber
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

# Créer un utilisateur non-root
RUN useradd -m -u 1000 appuser

# Répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY requirements.txt .

# Installer les dépendances Python
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copier le code de l'application
COPY app.py .

# Créer le dossier /tmp avec les bonnes permissions
RUN mkdir -p /tmp && chmod 1777 /tmp

# Changer le propriétaire des fichiers
RUN chown -R appuser:appuser /app

# Utiliser l'utilisateur non-root
USER appuser

# Exposer le port
EXPOSE 5000

# Health check (use PORT env variable)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD sh -c "python -c 'import urllib.request, os; urllib.request.urlopen(\"http://localhost:%s/health\" % os.getenv(\'PORT\', \'5000\'))' || exit 1"

# Commande de démarrage : utiliser gunicorn (2 workers) et binder à la variable d'environnement PORT
# Exécuter via sh -c pour permettre l'expansion de ${PORT}
CMD ["sh", "-c", "gunicorn -w 2 -b 0.0.0.0:${PORT} app:app"]

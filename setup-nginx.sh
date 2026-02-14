#!/bin/bash
# Configuration automatique Nginx pour Supabase

echo "🚀 Configuration Nginx pour Supabase"
echo "===================================="
echo ""

# Étape 1: Supprimer config par défaut
echo "🗑️  Suppression de la configuration Nginx par défaut..."
rm -f /etc/nginx/sites-enabled/default
echo "✅ OK"

# Étape 2: Créer la configuration Nginx
echo ""
echo "⚙️  Création de la configuration Nginx..."
cat > /etc/nginx/sites-available/supabase-api << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    
    access_log /var/log/nginx/supabase-access.log;
    error_log /var/log/nginx/supabase-error.log;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

# Étape 3: Activer la configuration
echo "🔗 Activation de la configuration..."
ln -sf /etc/nginx/sites-available/supabase-api /etc/nginx/sites-enabled/
echo "✅ OK"

# Étape 4: Tester la configuration
echo ""
echo "🧪 Test de la configuration Nginx..."
if nginx -t; then
    echo "✅ Configuration valide"
else
    echo "❌ Configuration invalide"
    exit 1
fi

# Étape 5: Redémarrer Nginx
echo ""
echo "🔄 Redémarrage de Nginx..."
systemctl reload nginx
echo "✅ OK"

# Étape 6: Afficher le statut
echo ""
echo "📊 Statut de Nginx:"
systemctl status nginx --no-pager | head -15

# Étape 7: Test de connexion
echo ""
echo "🧪 Test de connexion..."
sleep 2
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80)
echo "Code HTTP: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "404" ] || [ "$HTTP_CODE" = "301" ]; then
    echo "✅ Nginx fonctionne correctement"
else
    echo "⚠️  Code HTTP: $HTTP_CODE"
fi

# Afficher les résultats
echo ""
echo "===================================="
echo "✅ Configuration terminée !"
echo "===================================="
echo ""
echo "📋 Accès Supabase:"
echo "   http://76.13.133.147"
echo ""
echo "📝 Prochaine étape:"
echo "   Testez dans votre navigateur:"
echo "   http://76.13.133.147"
echo ""
echo "===================================="

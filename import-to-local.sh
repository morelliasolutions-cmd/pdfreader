#!/bin/bash

# Script d'import des données exportées du VPS vers Supabase local

echo "📥 Import des données VPS vers Supabase Local"
echo "=============================================="
echo ""

# Chercher les fichiers d'export
EXPORT_DIRS=("./vps-export" "./export" "./backup" "./supabase-export" ".")
MAIN_FILE=""

for dir in "${EXPORT_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        # Chercher le fichier le plus récent
        FILE=$(find "$dir" -name "*.sql*" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
        if [ -n "$FILE" ]; then
            MAIN_FILE="$FILE"
            echo "✅ Fichier trouvé: $MAIN_FILE"
            break
        fi
    fi
done

if [ -z "$MAIN_FILE" ]; then
    echo "❌ Aucun fichier d'export trouvé !"
    echo ""
    echo "Cherchez dans ces dossiers:"
    for dir in "${EXPORT_DIRS[@]}"; do
        echo "  - $dir"
    done
    exit 1
fi

# Vérifier que Supabase local est démarré
echo ""
echo "🔍 Vérification de Supabase local..."
if ! docker ps | grep -q supabase-db-local; then
    echo "⚠️  Supabase local n'est pas démarré"
    echo "Démarrage de Supabase local..."
    
    if [ -f "docker-compose.local.yml" ]; then
        if [ -f ".env.local" ]; then
            docker-compose -f docker-compose.local.yml --env-file .env.local up -d
        else
            docker-compose -f docker-compose.local.yml up -d
        fi
        sleep 10
    else
        echo "❌ docker-compose.local.yml non trouvé !"
        echo "Exécutez d'abord setup-local.sh"
        exit 1
    fi
fi

echo "✅ Supabase local est démarré"

# Demander si on veut vider la base
echo ""
read -p "Voulez-vous vider la base locale avant l'import ? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Vidage de la base locale..."
    docker exec -it supabase-db-local psql -U postgres -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
    echo "✅ Base vidée"
fi

# Importer selon le type de fichier
echo ""
echo "📦 Import du fichier: $(basename $MAIN_FILE)"
echo ""

if [[ "$MAIN_FILE" == *.gz ]]; then
    echo "📥 Décompression et import..."
    gunzip -c "$MAIN_FILE" | docker exec -i supabase-db-local psql -U postgres
else
    echo "📥 Import du fichier SQL..."
    docker exec -i supabase-db-local psql -U postgres < "$MAIN_FILE"
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Import terminé avec succès !"
    echo ""
    echo "🔍 Vérification des données:"
    docker exec -it supabase-db-local psql -U postgres -c "SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public';"
    docker exec -it supabase-db-local psql -U postgres -c "\dt"
else
    echo ""
    echo "❌ Erreur lors de l'import"
    echo "Vérifiez les logs ci-dessus"
fi

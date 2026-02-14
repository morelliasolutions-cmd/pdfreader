#!/bin/bash

###############################################################################
# Script d'export des données du VPS vers le local
# Exporte la base de données Supabase du VPS pour l'importer en local
###############################################################################

set -e

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

info() {
    echo -e "${GREEN}✅ $1${NC}"
}

warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

step() {
    echo -e "${BLUE}📦 $1${NC}"
}

# Configuration VPS
VPS_IP="76.13.133.147"
VPS_USER="root"
VPS_SSH_PORT="22"
EXPORT_DIR="./vps-export"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

echo "🚀 Export des données VPS vers Local"
echo "===================================="
echo ""

# Créer le dossier d'export
mkdir -p "$EXPORT_DIR"
info "Dossier d'export créé: $EXPORT_DIR"

# Étape 1: Exporter la structure de la base de données
step "1. Export de la structure de la base de données..."
ssh ${VPS_USER}@${VPS_IP} "docker exec supabase-db pg_dump -U postgres --schema-only --no-owner --no-acl postgres" > "$EXPORT_DIR/schema_${TIMESTAMP}.sql"
info "Structure exportée: $EXPORT_DIR/schema_${TIMESTAMP}.sql"

# Étape 2: Exporter les données
step "2. Export des données..."
ssh ${VPS_USER}@${VPS_IP} "docker exec supabase-db pg_dump -U postgres --data-only --no-owner --no-acl postgres" > "$EXPORT_DIR/data_${TIMESTAMP}.sql"
info "Données exportées: $EXPORT_DIR/data_${TIMESTAMP}.sql"

# Étape 3: Exporter toutes les tables spécifiques
step "3. Export des tables spécifiques..."

# Liste des tables importantes
TABLES=(
    "employees"
    "user_roles"
    "interventions"
    "orders"
    "appointments"
    "absences"
    "time_entries"
    "events"
)

for table in "${TABLES[@]}"; do
    step "   Export de la table: $table"
    ssh ${VPS_USER}@${VPS_IP} "docker exec supabase-db pg_dump -U postgres --table=public.$table --data-only --no-owner --no-acl postgres" > "$EXPORT_DIR/table_${table}_${TIMESTAMP}.sql" 2>/dev/null || warn "Table $table non trouvée ou vide"
done

# Étape 4: Exporter les policies RLS
step "4. Export des policies RLS..."
ssh ${VPS_USER}@${VPS_IP} "docker exec supabase-db psql -U postgres -t -c \"SELECT 'CREATE POLICY ' || quote_ident(policyname) || ' ON ' || quote_ident(schemaname) || '.' || quote_ident(tablename) || ' FOR ' || cmd || ' USING (' || qual::text || ');' FROM pg_policies WHERE schemaname = 'public';\"" > "$EXPORT_DIR/rls_policies_${TIMESTAMP}.sql"
info "Policies RLS exportées: $EXPORT_DIR/rls_policies_${TIMESTAMP}.sql"

# Étape 5: Exporter les fonctions
step "5. Export des fonctions..."
ssh ${VPS_USER}@${VPS_IP} "docker exec supabase-db pg_dump -U postgres --schema-only --no-owner --no-acl -t 'public.*' postgres | grep -A 100 'CREATE FUNCTION'" > "$EXPORT_DIR/functions_${TIMESTAMP}.sql" || warn "Aucune fonction trouvée"
info "Fonctions exportées: $EXPORT_DIR/functions_${TIMESTAMP}.sql"

# Étape 6: Créer un script d'import complet
step "6. Création du script d'import..."
cat > "$EXPORT_DIR/import_all_${TIMESTAMP}.sh" << EOF
#!/bin/bash
# Script d'import des données VPS vers Supabase local
# Généré le: $(date)

set -e

echo "📥 Import des données VPS vers Supabase local"
echo "=============================================="
echo ""

# Vérifier que Supabase local est démarré
if ! docker ps | grep -q supabase-db-local; then
    echo "❌ Supabase local n'est pas démarré"
    echo "Démarrez-le avec: docker-compose -f docker-compose.local.yml up -d"
    exit 1
fi

# Importer la structure
echo "📋 Import de la structure..."
docker exec -i supabase-db-local psql -U postgres < schema_${TIMESTAMP}.sql || echo "⚠️  Certaines tables existent déjà"

# Importer les données
echo "📊 Import des données..."
docker exec -i supabase-db-local psql -U postgres < data_${TIMESTAMP}.sql || echo "⚠️  Certaines données existent déjà"

# Importer les tables individuelles (si nécessaire)
for table_file in table_*.sql; do
    if [ -f "\$table_file" ]; then
        echo "📦 Import de \$table_file..."
        docker exec -i supabase-db-local psql -U postgres < "\$table_file" || echo "⚠️  Erreur sur \$table_file"
    fi
done

# Importer les policies RLS
if [ -f "rls_policies_${TIMESTAMP}.sql" ]; then
    echo "🔒 Import des policies RLS..."
    docker exec -i supabase-db-local psql -U postgres < rls_policies_${TIMESTAMP}.sql || echo "⚠️  Erreur sur les policies"
fi

# Importer les fonctions
if [ -f "functions_${TIMESTAMP}.sql" ]; then
    echo "⚙️  Import des fonctions..."
    docker exec -i supabase-db-local psql -U postgres < functions_${TIMESTAMP}.sql || echo "⚠️  Erreur sur les fonctions"
fi

echo ""
echo "✅ Import terminé !"
echo ""
echo "Vérifiez les données:"
echo "  docker exec -it supabase-db-local psql -U postgres -c '\\dt'"
EOF

chmod +x "$EXPORT_DIR/import_all_${TIMESTAMP}.sh"
info "Script d'import créé: $EXPORT_DIR/import_all_${TIMESTAMP}.sh"

# Résumé
echo ""
echo "===================================="
echo "✅ Export terminé !"
echo "===================================="
echo ""
echo "📁 Fichiers exportés dans: $EXPORT_DIR"
echo ""
echo "📋 Pour importer en local:"
echo "   1. Assurez-vous que Supabase local est démarré"
echo "   2. Allez dans le dossier: cd $EXPORT_DIR"
echo "   3. Exécutez: ./import_all_${TIMESTAMP}.sh"
echo ""
echo "Ou importez manuellement:"
echo "   docker exec -i supabase-db-local psql -U postgres < $EXPORT_DIR/schema_${TIMESTAMP}.sql"
echo "   docker exec -i supabase-db-local psql -U postgres < $EXPORT_DIR/data_${TIMESTAMP}.sql"
echo ""

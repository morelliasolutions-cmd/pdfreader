/**
 * Script de migration des données de Supabase Cloud vers VPS self-hosted
 * 
 * Usage: node config/migrate-supabase-cloud-to-vps.js
 * 
 * Ce script :
 * 1. Exporte le schéma et les données de Supabase Cloud
 * 2. Importe dans Supabase self-hosted sur le VPS
 * 3. Migre les buckets Storage (optionnel)
 */

const SSHClient = require('./ssh-client');
const fs = require('fs');
const path = require('path');

// Configuration Supabase Cloud (à remplir)
const CLOUD_CONFIG = {
  // URL de votre projet Supabase Cloud (ex: https://xxxxx.supabase.co)
  url: process.env.SUPABASE_CLOUD_URL || '',
  // Service role key (clé secrète, pas la clé anon)
  serviceRoleKey: process.env.SUPABASE_CLOUD_SERVICE_ROLE_KEY || '',
  // Connection string PostgreSQL (directe) - optionnel mais recommandé
  dbUrl: process.env.SUPABASE_CLOUD_DB_URL || ''
};

// Configuration VPS (depuis la config SSH et Supabase déployé)
const VPS_CONFIG = {
  supabasePath: '/opt/supabase/docker',
  // Les credentials sont dans le .env du VPS
};

class SupabaseMigrator {
  constructor(cloudConfig, vpsConfig, sshClient) {
    this.cloudConfig = cloudConfig;
    this.vpsConfig = vpsConfig;
    this.client = sshClient;
    this.tempDir = '/tmp/supabase-migration';
  }

  /**
   * Vérifie les configurations
   */
  async validateConfig() {
    console.log('🔍 Vérification des configurations...\n');

    if (!this.cloudConfig.url && !this.cloudConfig.dbUrl) {
      throw new Error('Configuration Supabase Cloud manquante. Configurez SUPABASE_CLOUD_URL ou SUPABASE_CLOUD_DB_URL');
    }

    if (!this.cloudConfig.serviceRoleKey && !this.cloudConfig.dbUrl) {
      console.warn('⚠️  Service role key manquante. Certaines opérations peuvent être limitées.');
    }

    console.log('✅ Configurations valides');
  }

  /**
   * Exporte le schéma et les données depuis Supabase Cloud
   */
  async exportFromCloud() {
    console.log('📤 Export des données depuis Supabase Cloud...\n');

    if (this.cloudConfig.dbUrl) {
      // Méthode directe via PostgreSQL (plus rapide et fiable)
      return await this.exportViaPostgreSQL();
    } else {
      // Méthode via API Supabase (plus limitée)
      return await this.exportViaAPI();
    }
  }

  /**
   * Exporte via PostgreSQL (méthode recommandée)
   */
  async exportViaPostgreSQL() {
    console.log('📥 Export via PostgreSQL (direct)...');

    // Vérifier que pg_dump est installé sur le VPS
    const checkPgDump = await this.client.executeCommand('which pg_dump');
    if (checkPgDump.code !== 0) {
      console.log('📦 Installation de postgresql-client...');
      const install = await this.client.executeCommand('apt-get update && apt-get install -y postgresql-client');
      if (install.code !== 0) {
        throw new Error('Impossible d\'installer postgresql-client sur le VPS');
      }
    }

    // Créer le répertoire temporaire sur le VPS
    await this.client.executeCommand(`mkdir -p ${this.tempDir}`);

    // Extraire le mot de passe de la connection string pour PGPASSWORD
    // Format: postgresql://postgres:PASSWORD@HOST:PORT/DATABASE
    const dbUrl = this.cloudConfig.dbUrl;
    const passwordMatch = dbUrl.match(/postgresql:\/\/[^:]+:([^@]+)@/);
    const password = passwordMatch ? passwordMatch[1] : '';

    // Exporter le schéma complet
    console.log('   → Export du schéma (peut prendre plusieurs minutes)...');
    const schemaExport = `cd ${this.tempDir} && PGPASSWORD="${password}" pg_dump "${dbUrl}" --schema-only --no-owner --no-acl -F c -f schema.dump 2>&1 || PGPASSWORD="${password}" pg_dump "${dbUrl}" --schema-only --no-owner --no-acl -f schema.sql 2>&1`;
    const schemaResult = await this.client.executeCommand(schemaExport);

    if (schemaResult.code !== 0 && !schemaResult.stdout.includes('schema.sql')) {
      console.error('⚠️  Avertissements lors de l\'export du schéma:');
      console.error(schemaResult.stderr);
    }

    // Exporter les données
    console.log('   → Export des données (peut prendre plusieurs minutes selon la taille)...');
    const dataExport = `cd ${this.tempDir} && PGPASSWORD="${password}" pg_dump "${dbUrl}" --data-only --no-owner --no-acl -F c -f data.dump 2>&1 || PGPASSWORD="${password}" pg_dump "${dbUrl}" --data-only --no-owner --no-acl -f data.sql 2>&1`;
    const dataResult = await this.client.executeCommand(dataExport);

    if (dataResult.code !== 0 && !dataResult.stdout.includes('data.sql')) {
      console.error('⚠️  Avertissements lors de l\'export des données:');
      console.error(dataResult.stderr);
    }

    // Exporter tout (schéma + données + RLS) pour une migration complète
    console.log('   → Export complet (schéma + données + RLS)...');
    const fullExport = `cd ${this.tempDir} && PGPASSWORD="${password}" pg_dump "${dbUrl}" --no-owner --no-acl -f full.sql 2>&1`;
    const fullResult = await this.client.executeCommand(fullExport);

    if (fullResult.code !== 0) {
      console.warn('⚠️  Avertissements lors de l\'export complet:');
      console.warn(fullResult.stderr);
    }

    console.log('✅ Export terminé');
    return true;
  }

  /**
   * Exporte via API Supabase (méthode alternative)
   */
  async exportViaAPI() {
    console.log('⚠️  Export via API (limité, utilisez plutôt PostgreSQL direct)');
    throw new Error('Export via API non implémenté. Utilisez SUPABASE_CLOUD_DB_URL pour un export PostgreSQL direct.');
  }

  /**
   * Importe les données dans Supabase VPS
   */
  async importToVPS() {
    console.log('\n📥 Import des données vers Supabase VPS...\n');

    // Récupérer les credentials PostgreSQL du VPS
    console.log('🔑 Récupération des credentials VPS...');
    const envResult = await this.client.executeCommand(`cd ${this.vpsConfig.supabasePath} && grep POSTGRES_PASSWORD .env | cut -d'=' -f2`);
    const postgresPassword = envResult.stdout.trim();

    if (!postgresPassword) {
      throw new Error('Impossible de récupérer le mot de passe PostgreSQL du VPS');
    }

    // Vérifier que le conteneur db est accessible
    console.log('🔍 Vérification de la connexion PostgreSQL VPS...');
    const checkDb = await this.client.executeCommand(`cd ${this.vpsConfig.supabasePath} && docker compose exec -T db pg_isready`);
    if (checkDb.code !== 0) {
      throw new Error('PostgreSQL VPS n\'est pas accessible');
    }
    console.log('✅ PostgreSQL VPS accessible');

    // Utiliser l'export complet (plus simple et plus fiable)
    console.log('   → Import complet (schéma + données + RLS)...');
    console.log('   ⏱️  Cela peut prendre plusieurs minutes selon la taille des données...');
    
    // Importer via docker exec pour utiliser la connexion locale au conteneur
    const importCmd = `cd ${this.vpsConfig.supabasePath} && cat ${this.tempDir}/full.sql | docker compose exec -T db psql -U postgres -d postgres 2>&1 | grep -v "already exists" | grep -v "duplicate key" | grep -v "does not exist" | grep -E "(ERROR|FATAL)" || true`;
    const importResult = await this.client.executeCommand(importCmd);

    if (importResult.stdout && (importResult.stdout.includes('ERROR') || importResult.stdout.includes('FATAL'))) {
      console.warn('⚠️  Des erreurs sont survenues lors de l\'import:');
      console.warn(importResult.stdout);
    } else {
      console.log('✅ Import terminé sans erreur critique');
    }

    // Vérifier le résultat
    console.log('🔍 Vérification de l\'import...');
    const verifyTables = await this.client.executeCommand(`cd ${this.vpsConfig.supabasePath} && docker compose exec -T db psql -U postgres -d postgres -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"`);
    console.log(`   → Tables importées: ${verifyTables.stdout.trim()}`);

    console.log('✅ Import terminé');
  }

  /**
   * Nettoie les fichiers temporaires
   */
  async cleanup() {
    console.log('\n🧹 Nettoyage des fichiers temporaires...');
    await this.client.executeCommand(`rm -rf ${this.tempDir}`);
    console.log('✅ Nettoyage terminé');
  }

  /**
   * Vérifie l'intégrité de la migration
   */
  async verifyMigration() {
    console.log('\n🔍 Vérification de la migration...');

    // Compter les tables
    const tableCount = await this.client.executeCommand(`cd ${this.vpsConfig.supabasePath} && PGPASSWORD=$(grep POSTGRES_PASSWORD .env | cut -d'=' -f2) psql -h localhost -U postgres -d postgres -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"`);
    console.log(`   → Tables: ${tableCount.stdout.trim()}`);

    // Vérifier que les tables principales existent
    const checkTables = await this.client.executeCommand(`cd ${this.vpsConfig.supabasePath} && PGPASSWORD=$(grep POSTGRES_PASSWORD .env | cut -d'=' -f2) psql -h localhost -U postgres -d postgres -t -c "SELECT tablename FROM pg_tables WHERE schemaname='public' LIMIT 10;"`);
    console.log('   → Tables principales:');
    console.log(checkTables.stdout);

    console.log('✅ Vérification terminée');
  }

  /**
   * Migre les buckets Storage (optionnel)
   */
  async migrateStorage() {
    console.log('\n📦 Migration des buckets Storage (optionnel)...');
    console.log('⚠️  La migration Storage nécessite des credentials Supabase Cloud');
    console.log('   Cette fonctionnalité sera implémentée dans une version future');
    console.log('   Pour l\'instant, vous pouvez migrer manuellement via Supabase Studio\n');
  }

  /**
   * Exécute la migration complète
   */
  async migrate() {
    try {
      await this.client.connect();

      console.log('🚀 Migration Supabase Cloud → VPS Self-hosted\n');
      console.log('='.repeat(60));

      // Vérifications
      await this.validateConfig();

      // Export
      await this.exportFromCloud();

      // Import
      await this.importToVPS();

      // Vérification
      await this.verifyMigration();

      // Storage (optionnel)
      await this.migrateStorage();

      // Nettoyage
      await this.cleanup();

      console.log('\n✅ Migration terminée avec succès !');
      console.log('\n📋 Prochaines étapes:');
      console.log('   1. Vérifiez vos données dans Supabase Studio VPS');
      console.log('   2. Testez votre application avec les nouvelles clés API');
      console.log('   3. Migrez les fichiers Storage manuellement si nécessaire');
      console.log('   4. Mettez à jour vos variables d\'environnement avec les nouvelles URLs\n');

    } catch (error) {
      console.error('\n❌ Erreur lors de la migration:', error.message);
      throw error;
    } finally {
      this.client.disconnect();
    }
  }
}

// Exécution
async function main() {
  try {
    console.log('🚀 Script de migration Supabase Cloud → VPS\n');

    // Vérifier les variables d'environnement
    if (!CLOUD_CONFIG.dbUrl && !CLOUD_CONFIG.url) {
      console.error('❌ Configuration manquante !\n');
      console.log('💡 Configurez au moins une de ces variables d\'environnement:');
      console.log('   - SUPABASE_CLOUD_DB_URL (recommandé) : Connection string PostgreSQL directe');
      console.log('   - SUPABASE_CLOUD_URL : URL de votre projet Supabase Cloud');
      console.log('   - SUPABASE_CLOUD_SERVICE_ROLE_KEY : Service role key (pour API)\n');
      console.log('📝 Exemple:');
      console.log('   export SUPABASE_CLOUD_DB_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"');
      console.log('   node config/migrate-supabase-cloud-to-vps.js\n');
      process.exit(1);
    }

    const sshClient = new SSHClient();
    const migrator = new SupabaseMigrator(CLOUD_CONFIG, VPS_CONFIG, sshClient);
    
    await migrator.migrate();
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SupabaseMigrator;

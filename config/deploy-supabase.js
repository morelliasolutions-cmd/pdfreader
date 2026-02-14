/**
 * Script de déploiement de Supabase self-hosted sur Easypanel
 * 
 * Usage: node config/deploy-supabase.js [options]
 * Options:
 *   --project-name <name>    Nom du projet (défaut: supabase)
 *   --service-name <name>    Nom du service (défaut: supabase)
 *   --domain <domain>        Domaine pour Supabase (optionnel)
 */

const EasypanelClient = require('./easypanel-client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Génération de secrets sécurisés
function generateSecurePassword(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Configuration par défaut de Supabase
const SUPABASE_CONFIG = {
  postgresPassword: generateSecurePassword(),
  jwtSecret: generateSecurePassword(64),
  anonKey: '', // Sera généré
  serviceRoleKey: '', // Sera généré
  databasePassword: generateSecurePassword(),
};

class SupabaseDeployer {
  constructor(client, options = {}) {
    this.client = client;
    this.projectName = options.projectName || 'supabase';
    this.serviceName = options.serviceName || 'supabase';
    this.domain = options.domain;
  }

  /**
   * Génère le schéma JSON pour déployer Supabase via Easypanel
   */
  generateSupabaseSchema() {
    // Schéma Easypanel pour Supabase (Compose Service)
    return {
      name: this.serviceName,
      project: this.projectName,
      type: 'compose',
      source: {
        type: 'git',
        repository: 'https://github.com/supabase/supabase',
        branch: 'master',
        dockerComposePath: 'docker/docker-compose.yml',
        dockerComposeEnvPath: 'docker/.env.example'
      },
      env: {
        POSTGRES_PASSWORD: SUPABASE_CONFIG.postgresPassword,
        JWT_SECRET: SUPABASE_CONFIG.jwtSecret,
        POSTGRES_DB: 'postgres',
        POSTGRES_USER: 'postgres',
        API_URL: this.domain ? `https://${this.domain}` : '',
        STUDIO_PASSWORD: SUPABASE_CONFIG.databasePassword,
        // Configuration Supabase
        GOTRUE_JWT_EXP: '3600',
        GOTRUE_JWT_DEFAULT_GROUP_NAME: 'authenticated',
        GOTRUE_JWT_ADMIN_ROLES: 'service_role',
        GOTRUE_JWT_AUD: 'authenticated',
        GOTRUE_JWT_SECRET: SUPABASE_CONFIG.jwtSecret,
        API_EXTERNAL_URL: this.domain ? `https://${this.domain}` : '',
        DB_PASSWORD: SUPABASE_CONFIG.postgresPassword,
        DB_USER: 'postgres',
        DB_HOST: 'db',
        DB_NAME: 'postgres',
        DB_PORT: '5432',
        // Storage
        STORAGE_BACKEND: 'file',
        STORAGE_FILE_SIZE_LIMIT: '52428800',
        // Auth
        GOTRUE_API_HOST: '0.0.0.0',
        GOTRUE_API_PORT: '9999',
        GOTRUE_DB_DRIVER: 'postgres',
        GOTRUE_DB_DATABASE_URL: `postgres://postgres:${SUPABASE_CONFIG.postgresPassword}@db:5432/postgres`,
        // Realtime
        REALTIME_DB_HOST: 'db',
        REALTIME_DB_PORT: '5432',
        REALTIME_DB_USER: 'postgres',
        REALTIME_DB_PASSWORD: SUPABASE_CONFIG.postgresPassword,
        REALTIME_DB_NAME: 'postgres',
        REALTIME_DB_AFTER_CONNECT_QUERY: 'SET search_path TO _realtime',
        REALTIME_DB_ENC_KEY: generateSecurePassword(),
      },
      ports: [
        {
          published: 80,
          target: 8000,
          protocol: 'tcp'
        }
      ],
      mounts: [
        {
          type: 'volume',
          name: `${this.serviceName}-db`,
          mountPath: '/var/lib/postgresql/data',
          targetPath: '/var/lib/postgresql/data'
        },
        {
          type: 'volume',
          name: `${this.serviceName}-storage`,
          mountPath: '/var/lib/storage',
          targetPath: '/var/lib/storage'
        }
      ]
    };
  }

  /**
   * Crée un projet dans Easypanel
   */
  async createProject() {
    console.log(`📦 Création du projet "${this.projectName}"...`);
    
    try {
      // Essayer de créer le projet (endpoint peut varier selon l'API)
      const result = await this.client.post('/projects', {
        name: this.projectName
      });
      
      console.log('✅ Projet créé avec succès');
      return result;
    } catch (error) {
      // Le projet existe peut-être déjà
      if (error.message.includes('409') || error.message.includes('already exists')) {
        console.log(`ℹ️  Le projet "${this.projectName}" existe déjà`);
        return null;
      }
      throw error;
    }
  }

  /**
   * Crée le service Supabase dans Easypanel
   */
  async createService(schema) {
    console.log(`🚀 Création du service Supabase "${this.serviceName}"...`);
    
    try {
      // Endpoint pour créer un service (peut varier selon l'API)
      const result = await this.client.post(`/projects/${this.projectName}/services`, schema);
      
      console.log('✅ Service créé avec succès');
      return result;
    } catch (error) {
      console.error('❌ Erreur lors de la création du service:', error.message);
      throw error;
    }
  }

  /**
   * Sauvegarde la configuration générée
   */
  saveConfiguration() {
    const configPath = path.join(__dirname, 'supabase-deployment.json');
    const config = {
      projectName: this.projectName,
      serviceName: this.serviceName,
      domain: this.domain,
      deploymentDate: new Date().toISOString(),
      secrets: SUPABASE_CONFIG
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(`💾 Configuration sauvegardée dans ${configPath}`);
    console.log('⚠️  IMPORTANT: Gardez ce fichier secret, il contient vos mots de passe !');
  }

  /**
   * Affiche les informations de connexion
   */
  displayConnectionInfo() {
    console.log('\n📋 Informations de connexion Supabase:');
    console.log('=====================================\n');
    console.log(`Projet: ${this.projectName}`);
    console.log(`Service: ${this.serviceName}`);
    if (this.domain) {
      console.log(`API URL: https://${this.domain}`);
      console.log(`Studio URL: https://${this.domain}/studio`);
    }
    console.log('\n🔑 Secrets générés:');
    console.log(`POSTGRES_PASSWORD: ${SUPABASE_CONFIG.postgresPassword}`);
    console.log(`JWT_SECRET: ${SUPABASE_CONFIG.jwtSecret.substring(0, 20)}...`);
    console.log(`STUDIO_PASSWORD: ${SUPABASE_CONFIG.databasePassword}`);
    console.log('\n💡 Ces informations sont sauvegardées dans config/supabase-deployment.json');
    console.log('\n⚠️  IMPORTANT:');
    console.log('   1. Configurez votre domaine dans Easypanel si vous en avez un');
    console.log('   2. Les clés anon et service_role seront générées au premier démarrage');
    console.log('   3. Notez vos secrets dans un gestionnaire de mots de passe sécurisé');
    console.log('   4. Attendez quelques minutes pour que tous les services démarrent\n');
  }

  /**
   * Déploie Supabase
   */
  async deploy() {
    console.log('🚀 Déploiement de Supabase self-hosted sur Easypanel\n');

    // Générer le schéma avant tout (pour pouvoir le sauvegarder même en cas d'erreur)
    const schema = this.generateSupabaseSchema();

    try {
      // Test de connexion
      console.log('🔌 Test de connexion à Easypanel...');
      const connectionTest = await this.client.testConnection();
      if (!connectionTest.success) {
        console.warn('⚠️  Connexion échouée, mais on continue...');
      } else {
        console.log('✅ Connexion réussie\n');
      }

      // Créer le projet
      await this.createProject();

      // Sauvegarder la configuration
      this.saveConfiguration();

      // Créer le service
      await this.createService(schema);

      // Afficher les informations
      this.displayConnectionInfo();

      console.log('\n✅ Déploiement initié avec succès !');
      console.log('📊 Vérifiez le statut dans votre dashboard Easypanel\n');

    } catch (error) {
      console.error('\n❌ Erreur lors du déploiement:', error.message);
      console.error('\n💡 Vérifiez:');
      console.error('   1. Que votre clé API est valide');
      console.error('   2. Que votre instance Easypanel est accessible');
      console.error('   3. Que vous avez les permissions nécessaires');
      console.error('\n🔧 Alternative:');
      console.error('   Si l\'API ne fonctionne pas, utilisez le schéma JSON généré');
      console.error('   et importez-le manuellement via "Create from Schema" dans Easypanel\n');
      
      // Sauvegarder quand même le schéma pour import manuel
      const schemaPath = path.join(__dirname, 'supabase-schema.json');
      fs.writeFileSync(schemaPath, JSON.stringify(schema, null, 2));
      console.log(`📄 Schéma JSON sauvegardé dans ${schemaPath}`);
      console.log('   Vous pouvez l\'importer manuellement dans Easypanel\n');
      
      // Sauvegarder la configuration même en cas d'erreur
      this.saveConfiguration();
      
      process.exit(1);
    }
  }
}

// Gestion des arguments en ligne de commande
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--project-name' && args[i + 1]) {
      options.projectName = args[i + 1];
      i++;
    } else if (args[i] === '--service-name' && args[i + 1]) {
      options.serviceName = args[i + 1];
      i++;
    } else if (args[i] === '--domain' && args[i + 1]) {
      options.domain = args[i + 1];
      i++;
    }
  }

  return options;
}

// Exécution
async function main() {
  try {
    const client = new EasypanelClient();
    const options = parseArgs();
    const deployer = new SupabaseDeployer(client, options);
    
    await deployer.deploy();
  } catch (error) {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SupabaseDeployer;

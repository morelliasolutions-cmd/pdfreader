/**
 * Script de déploiement Supabase via SSH sur le VPS Easypanel
 * 
 * Usage: node config/deploy-supabase-ssh.js
 */

const SSHClient = require('./ssh-client');
const fs = require('fs');
const path = require('path');

// Lire la configuration de déploiement
const deploymentConfig = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'supabase-deployment.json'), 'utf8')
);

const SUPABASE_DEPLOY_PATH = '/opt/supabase';
const SUPABASE_REPO = 'https://github.com/supabase/supabase.git';
const SUPABASE_BRANCH = 'master';

class SupabaseSSHDeployer {
  constructor(sshClient) {
    this.client = sshClient;
    this.config = deploymentConfig.secrets;
  }

  /**
   * Crée le répertoire de déploiement
   */
  async setupDirectory() {
    console.log('📁 Configuration du répertoire de déploiement...');
    
    const commands = [
      `mkdir -p ${SUPABASE_DEPLOY_PATH}`,
      `cd ${SUPABASE_DEPLOY_PATH} && rm -rf docker || true`
    ];

    for (const cmd of commands) {
      const result = await this.client.executeCommand(cmd);
      if (result.code !== 0 && !result.stdout.includes('No such file')) {
        throw new Error(`Erreur lors de la création du répertoire: ${result.stderr}`);
      }
    }

    console.log('✅ Répertoire configuré');
  }

  /**
   * Clone le repo Supabase
   */
  async cloneRepository() {
    console.log('📥 Clonage du repository Supabase...');
    
    // Vérifier si git est installé
    const gitCheck = await this.client.executeCommand('which git');
    if (gitCheck.code !== 0) {
      throw new Error('Git n\'est pas installé sur le serveur');
    }

    // Supprimer le répertoire s'il existe déjà
    await this.client.executeCommand(`rm -rf ${SUPABASE_DEPLOY_PATH}/* 2>&1 || true`);

    // Cloner le repo dans un répertoire temporaire puis déplacer
    const tempDir = `${SUPABASE_DEPLOY_PATH}/temp`;
    const cloneCmd = `cd ${SUPABASE_DEPLOY_PATH} && rm -rf temp && git clone --depth 1 --branch ${SUPABASE_BRANCH} ${SUPABASE_REPO} temp && mv temp/* temp/.* . 2>&1; rm -rf temp`;
    const result = await this.client.executeCommand(cloneCmd);
    
    if (result.code !== 0) {
      throw new Error(`Erreur lors du clonage: ${result.stderr}`);
    }

    // Vérifier que le dossier docker existe
    const dockerCheck = await this.client.executeCommand(`test -d ${SUPABASE_DEPLOY_PATH}/docker && echo "exists" || echo "missing"`);
    if (!dockerCheck.stdout.includes('exists')) {
      throw new Error('Le dossier docker n\'a pas été créé lors du clonage');
    }

    console.log('✅ Repository cloné');
  }

  /**
   * Génère un secret aléatoire hex
   */
  async generateHex(length) {
    const result = await this.client.executeCommand(`openssl rand -hex ${Math.ceil(length / 2)} | cut -c1-${length}`);
    return result.stdout.trim();
  }

  /**
   * Génère un secret aléatoire base64
   */
  async generateBase64(length) {
    const result = await this.client.executeCommand(`openssl rand -base64 ${Math.ceil(length * 3 / 4)} | cut -c1-${length}`);
    return result.stdout.trim();
  }

  /**
   * Crée le fichier .env pour Supabase en utilisant .env.example
   */
  async createEnvFile() {
    console.log('⚙️  Création du fichier .env depuis .env.example...');

    // Copier .env.example vers .env
    const copyCmd = `cd ${SUPABASE_DEPLOY_PATH}/docker && cp .env.example .env`;
    const copyResult = await this.client.executeCommand(copyCmd);
    
    if (copyResult.code !== 0) {
      throw new Error(`Erreur lors de la copie de .env.example: ${copyResult.stderr}`);
    }

    // Générer les secrets manquants
    console.log('🔑 Génération des secrets...');
    
    const SECRET_KEY_BASE = await this.generateBase64(64);
    const VAULT_ENC_KEY = await this.generateHex(32);
    const PG_META_CRYPTO_KEY = await this.generateBase64(32);
    const LOGFLARE_PUBLIC_ACCESS_TOKEN = await this.generateBase64(32);
    const LOGFLARE_PRIVATE_ACCESS_TOKEN = await this.generateBase64(32);

    // Fonction helper pour remplacer une variable dans .env
    const setEnvVar = async (key, value) => {
      // Échapper les caractères spéciaux dans la valeur
      const escapedValue = value.replace(/[\/&]/g, '\\$&');
      const cmd = `cd ${SUPABASE_DEPLOY_PATH}/docker && sed -i 's|^${key}=.*|${key}=${escapedValue}|' .env || echo "${key}=${escapedValue}" >> .env`;
      const result = await this.client.executeCommand(cmd);
      if (result.code !== 0) {
        console.warn(`⚠️  Erreur lors de la configuration de ${key}`);
      }
    };

    // Remplacer les variables essentielles
    await setEnvVar('POSTGRES_PASSWORD', this.config.postgresPassword);
    await setEnvVar('JWT_SECRET', this.config.jwtSecret);
    await setEnvVar('SECRET_KEY_BASE', SECRET_KEY_BASE);
    await setEnvVar('VAULT_ENC_KEY', VAULT_ENC_KEY);
    await setEnvVar('PG_META_CRYPTO_KEY', PG_META_CRYPTO_KEY);
    await setEnvVar('LOGFLARE_PUBLIC_ACCESS_TOKEN', LOGFLARE_PUBLIC_ACCESS_TOKEN);
    await setEnvVar('LOGFLARE_PRIVATE_ACCESS_TOKEN', LOGFLARE_PRIVATE_ACCESS_TOKEN);
    
    // URLs (vide pour le moment, peut être configuré plus tard)
    await setEnvVar('API_EXTERNAL_URL', 'http://localhost:8000');
    await setEnvVar('SUPABASE_PUBLIC_URL', 'http://localhost:8000');
    await setEnvVar('SITE_URL', 'http://localhost:3000');

    // Dashboard
    await setEnvVar('DASHBOARD_USERNAME', 'admin');
    await setEnvVar('DASHBOARD_PASSWORD', this.config.databasePassword);

    // Note : ANON_KEY et SERVICE_ROLE_KEY seront générées automatiquement par Supabase au démarrage
    
    console.log('✅ Fichier .env créé et configuré');
  }

  /**
   * Vérifie que Docker et Docker Compose sont disponibles
   */
  async checkDocker() {
    console.log('🐳 Vérification de Docker...');
    
    const dockerCheck = await this.client.checkDocker();
    if (!dockerCheck.installed) {
      throw new Error('Docker n\'est pas installé sur le serveur');
    }

    // Vérifier docker-compose
    const composeCheck = await this.client.executeCommand('docker compose version');
    if (composeCheck.code !== 0) {
      throw new Error('Docker Compose n\'est pas disponible');
    }

    console.log('✅ Docker et Docker Compose sont disponibles');
  }

  /**
   * Lance Supabase avec docker-compose
   */
  async deploySupabase() {
    console.log('🚀 Déploiement de Supabase...');
    
    // Arrêter les services existants s'ils existent
    console.log('⏹️  Arrêt des services existants (s\'il y en a)...');
    await this.client.executeCommand(`cd ${SUPABASE_DEPLOY_PATH}/docker && docker compose down 2>&1 || true`);

    // Démarrer Supabase
    console.log('▶️  Démarrage des services Supabase...');
    const deployCmd = `cd ${SUPABASE_DEPLOY_PATH}/docker && docker compose up -d`;
    const result = await this.client.executeCommand(deployCmd);
    
    if (result.code !== 0) {
      console.error('❌ Erreur lors du déploiement:');
      console.error(result.stderr);
      throw new Error(`Déploiement échoué: ${result.stderr}`);
    }

    console.log('✅ Supabase déployé avec succès');
  }

  /**
   * Vérifie l'état des services
   */
  async checkServices() {
    console.log('🔍 Vérification des services Supabase...');
    
    const result = await this.client.executeCommand(`cd ${SUPABASE_DEPLOY_PATH}/docker && docker compose ps`);
    
    if (result.code === 0) {
      console.log('\n📊 État des services:');
      console.log(result.stdout);
    } else {
      console.log('⚠️  Impossible de vérifier l\'état des services');
    }
  }

  /**
   * Affiche les informations de connexion
   */
  displayConnectionInfo() {
    console.log('\n📋 Informations de connexion Supabase:');
    console.log('=====================================\n');
    console.log(`Répertoire de déploiement: ${SUPABASE_DEPLOY_PATH}/docker`);
    console.log('\n🔑 Secrets configurés:');
    console.log(`POSTGRES_PASSWORD: ${this.config.postgresPassword}`);
    console.log(`JWT_SECRET: ${this.config.jwtSecret.substring(0, 20)}...`);
    console.log(`STUDIO_PASSWORD: ${this.config.databasePassword}`);
    console.log('\n💡 Les clés ANON_KEY et SERVICE_ROLE_KEY seront générées automatiquement');
    console.log('   Vous pourrez les récupérer depuis Supabase Studio une fois démarré');
    console.log('\n⚠️  IMPORTANT:');
    console.log('   1. Les services peuvent prendre 5-10 minutes pour démarrer complètement');
    console.log('   2. Accédez à Supabase Studio via le port configuré (généralement 3000)');
    console.log('   3. Configurez votre domaine dans Easypanel/Traefik si nécessaire');
    console.log('   4. Récupérez les clés API depuis Supabase Studio → Settings → API\n');
  }

  /**
   * Déploie Supabase
   */
  async deploy() {
    try {
      await this.client.connect();

      console.log('🚀 Déploiement de Supabase self-hosted via SSH\n');

      // Vérifications préalables
      await this.checkDocker();

      // Configuration
      await this.setupDirectory();
      await this.cloneRepository();
      await this.createEnvFile();

      // Déploiement
      await this.deploySupabase();

      // Vérification
      await this.checkServices();

      // Informations
      this.displayConnectionInfo();

      console.log('\n✅ Déploiement terminé avec succès !');
      console.log('📊 Vérifiez l\'état des services avec:');
      console.log(`   ssh root@78.47.97.137 "cd ${SUPABASE_DEPLOY_PATH}/docker && docker compose ps"`);
      console.log('\n📝 Logs:');
      console.log(`   ssh root@78.47.97.137 "cd ${SUPABASE_DEPLOY_PATH}/docker && docker compose logs -f"\n`);

    } catch (error) {
      console.error('\n❌ Erreur lors du déploiement:', error.message);
      throw error;
    } finally {
      this.client.disconnect();
    }
  }
}

// Exécution
async function main() {
  try {
    console.log('🚀 Démarrage du déploiement Supabase via SSH...\n');
    
    const sshClient = new SSHClient();
    const deployer = new SupabaseSSHDeployer(sshClient);
    
    await deployer.deploy();
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = SupabaseSSHDeployer;

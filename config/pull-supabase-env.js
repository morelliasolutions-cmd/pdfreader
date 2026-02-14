/**
 * Script pour récupérer le .env Supabase depuis le VPS
 * Le sauvegarde localement pour modification
 * 
 * Usage: node config/pull-supabase-env.js
 */

const SSHClient = require('./ssh-client');
const fs = require('fs');
const path = require('path');

const SUPABASE_DEPLOY_PATH = '/opt/supabase/docker';
const ENV_FILE = `${SUPABASE_DEPLOY_PATH}/.env`;
const LOCAL_ENV_FILE = path.join(__dirname, 'supabase.env.local');

async function pullEnv() {
  console.log('📥 Récupération du .env Supabase depuis le VPS...\n');

  const client = new SSHClient();

  try {
    await client.connect();

    // Vérifier si le fichier existe sur le serveur
    const checkFile = await client.executeCommand(`test -f ${ENV_FILE} && echo "exists" || echo "notfound"`);
    
    if (checkFile.stdout.trim() === 'notfound') {
      console.error(`❌ Le fichier ${ENV_FILE} n'existe pas sur le serveur`);
      return;
    }

    // Récupérer le contenu
    console.log('📋 Téléchargement du fichier .env...');
    const envContent = await client.executeCommand(`cat ${ENV_FILE}`);
    
    // Sauvegarder localement
    fs.writeFileSync(LOCAL_ENV_FILE, envContent.stdout);
    
    console.log(`✅ Fichier sauvegardé localement: ${LOCAL_ENV_FILE}`);
    console.log('\n💡 Modifiez ce fichier, puis exécutez:');
    console.log('   node config/push-supabase-env.js\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    throw error;
  } finally {
    client.disconnect();
  }
}

// Exécution
async function main() {
  try {
    await pullEnv();
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { pullEnv };

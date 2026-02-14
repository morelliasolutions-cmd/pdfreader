/**
 * Script pour voir/éditer le .env Supabase sur le VPS
 * 
 * Usage: node config/view-supabase-env.js
 */

const SSHClient = require('./ssh-client');

const SUPABASE_DEPLOY_PATH = '/opt/supabase/docker';
const ENV_FILE = `${SUPABASE_DEPLOY_PATH}/.env`;

async function viewEnv() {
  console.log('📋 Récupération du fichier .env Supabase...\n');

  const client = new SSHClient();

  try {
    await client.connect();

    // Vérifier si le fichier existe
    const checkFile = await client.executeCommand(`test -f ${ENV_FILE} && echo "exists" || echo "notfound"`);
    
    if (checkFile.stdout.trim() === 'notfound') {
      console.error(`❌ Le fichier ${ENV_FILE} n'existe pas`);
      return;
    }

    // Lire le fichier .env
    console.log('📄 Contenu du fichier .env:\n');
    console.log('='.repeat(60));
    const envContent = await client.executeCommand(`cat ${ENV_FILE}`);
    console.log(envContent.stdout);
    console.log('='.repeat(60));

    console.log('\n💡 Pour éditer, utilisez:');
    console.log(`   ssh root@78.47.97.137 "nano ${ENV_FILE}"`);
    console.log(`   ssh root@78.47.97.137 "vim ${ENV_FILE}"`);
    console.log(`\n   OU via le script: node config/edit-supabase-env.js\n`);

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
    await viewEnv();
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { viewEnv };

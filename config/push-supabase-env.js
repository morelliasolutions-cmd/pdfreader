/**
 * Script pour envoyer le .env Supabase modifié vers le VPS
 * 
 * Usage: node config/push-supabase-env.js
 */

const SSHClient = require('./ssh-client');
const fs = require('fs');
const path = require('path');

const SUPABASE_DEPLOY_PATH = '/opt/supabase/docker';
const ENV_FILE = `${SUPABASE_DEPLOY_PATH}/.env`;
const LOCAL_ENV_FILE = path.join(__dirname, 'supabase.env.local');

async function pushEnv() {
  console.log('📤 Envoi du .env modifié vers le VPS...\n');

  // Vérifier que le fichier local existe
  if (!fs.existsSync(LOCAL_ENV_FILE)) {
    console.error(`❌ Le fichier ${LOCAL_ENV_FILE} n'existe pas`);
    console.error('💡 Exécutez d\'abord: node config/pull-supabase-env.js\n');
    process.exit(1);
  }

  const client = new SSHClient();

  try {
    await client.connect();

    // Lire le fichier local
    const envContent = fs.readFileSync(LOCAL_ENV_FILE, 'utf8');
    
    // Créer un backup sur le serveur
    console.log('💾 Création d\'un backup sur le serveur...');
    const backupDate = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    await client.executeCommand(`cd ${SUPABASE_DEPLOY_PATH} && cp .env .env.backup.${backupDate}`);

    // Écrire le nouveau .env
    console.log('📝 Écriture du nouveau .env sur le serveur...');
    
    // Utiliser une méthode qui gère bien les caractères spéciaux
    // Échapper les caractères spéciaux pour la commande echo
    const escapedContent = envContent
      .replace(/\\/g, '\\\\')
      .replace(/\$/g, '\\$')
      .replace(/`/g, '\\`')
      .replace(/"/g, '\\"')
      .replace(/'/g, "'\\''");
    
    // Écrire via un heredoc pour éviter les problèmes d'échappement
    const writeCommand = `cat > ${ENV_FILE} << 'ENVEOF'
${envContent}ENVEOF`;
    
    await client.executeCommand(writeCommand);

    // Vérifier que le fichier a été écrit
    const verify = await client.executeCommand(`test -f ${ENV_FILE} && wc -l ${ENV_FILE} | cut -d' ' -f1 || echo "0"`);
    const lineCount = verify.stdout.trim();
    
    console.log(`✅ Fichier envoyé (${lineCount} lignes)`);
    console.log(`✅ Backup créé: .env.backup.${backupDate}`);

    console.log('\n⚠️  Pour appliquer les changements, redémarrez les services:');
    console.log(`   ssh root@78.47.97.137 "cd ${SUPABASE_DEPLOY_PATH} && docker compose restart"`);
    console.log(`   OU via script: node config/restart-supabase.js\n`);

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
    await pushEnv();
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { pushEnv };

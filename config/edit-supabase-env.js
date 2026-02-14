/**
 * Script pour modifier une variable dans le .env Supabase sur le VPS
 * 
 * Usage: 
 *   node config/edit-supabase-env.js POSTGRES_PASSWORD "nouveau_password"
 *   node config/edit-supabase-env.js JWT_SECRET "nouveau_secret"
 */

const SSHClient = require('./ssh-client');

const SUPABASE_DEPLOY_PATH = '/opt/supabase/docker';
const ENV_FILE = `${SUPABASE_DEPLOY_PATH}/.env`;

async function editEnv(key, value) {
  if (!key || !value) {
    console.error('❌ Usage: node config/edit-supabase-env.js <KEY> <VALUE>');
    console.error('   Exemple: node config/edit-supabase-env.js POSTGRES_PASSWORD "mon_nouveau_password"');
    process.exit(1);
  }

  console.log(`🔧 Modification de ${key} dans le .env...\n`);

  const client = new SSHClient();

  try {
    await client.connect();

    // Vérifier si la clé existe déjà
    const checkKey = await client.executeCommand(`cd ${SUPABASE_DEPLOY_PATH} && grep -E "^${key}=" .env || echo "notfound"`);
    
    if (checkKey.stdout.includes('notfound')) {
      // Ajouter la nouvelle variable
      console.log(`➕ Ajout de ${key}...`);
      await client.executeCommand(`cd ${SUPABASE_DEPLOY_PATH} && echo "${key}=${value}" >> .env`);
    } else {
      // Modifier la variable existante
      console.log(`✏️  Modification de ${key}...`);
      // Échapper les caractères spéciaux pour sed
      const escapedValue = value.replace(/'/g, "'\\''");
      await client.executeCommand(`cd ${SUPABASE_DEPLOY_PATH} && sed -i 's|^${key}=.*|${key}=${escapedValue}|' .env`);
    }

    // Vérifier la modification
    const verify = await client.executeCommand(`cd ${SUPABASE_DEPLOY_PATH} && grep "^${key}=" .env`);
    console.log(`\n✅ ${key} mis à jour:`);
    console.log(`   ${verify.stdout.trim()}`);

    console.log('\n⚠️  Après modification, redémarrez les services:');
    console.log(`   ssh root@78.47.97.137 "cd ${SUPABASE_DEPLOY_PATH} && docker compose restart"\n`);

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
    const key = process.argv[2];
    const value = process.argv[3];
    await editEnv(key, value);
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { editEnv };

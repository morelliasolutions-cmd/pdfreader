/**
 * Script pour redémarrer Supabase après modification du .env
 * 
 * Usage: node config/restart-supabase.js
 */

const SSHClient = require('./ssh-client');

const SUPABASE_DEPLOY_PATH = '/opt/supabase/docker';

async function restartSupabase() {
  console.log('🔄 Redémarrage de Supabase...\n');

  const client = new SSHClient();

  try {
    await client.connect();

    console.log('📋 Redémarrage des services...');
    const restartResult = await client.executeCommand(`cd ${SUPABASE_DEPLOY_PATH} && docker compose restart`);
    
    if (restartResult.code === 0) {
      console.log('✅ Services redémarrés');
    } else {
      console.warn('⚠️  Certaines erreurs lors du redémarrage:');
      console.warn(restartResult.stderr);
    }

    // Vérifier l'état des services
    console.log('\n📊 État des services:');
    const statusResult = await client.executeCommand(`cd ${SUPABASE_DEPLOY_PATH} && docker compose ps`);
    console.log(statusResult.stdout);

    console.log('\n✅ Redémarrage terminé\n');

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
    await restartSupabase();
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { restartSupabase };

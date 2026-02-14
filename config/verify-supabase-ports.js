/**
 * Script pour vérifier et corriger les ports Supabase
 * 
 * Usage: node config/verify-supabase-ports.js
 */

const SSHClient = require('./ssh-client');

const SUPABASE_DEPLOY_PATH = '/opt/supabase/docker';
const NEW_STUDIO_PORT = 3001;

async function verifyAndFixPorts() {
  console.log('🔍 Vérification des ports Supabase...\n');
  console.log(`Port à utiliser pour Studio: ${NEW_STUDIO_PORT} (Easypanel utilise 3000)\n`);

  const client = new SSHClient();

  try {
    console.log('🔌 Connexion SSH...');
    await client.connect();
    console.log('✅ Connecté\n');

    // Vérifier la configuration actuelle du port Studio dans docker-compose.yml
    console.log('📋 Vérification de la configuration actuelle...');
    const checkStudio = await client.executeCommand(`cd ${SUPABASE_DEPLOY_PATH} && grep -A 15 "studio:" docker-compose.yml | grep -E "(ports:|3000)" || echo "notfound"`);
    console.log('Configuration Studio actuelle:');
    console.log(checkStudio.stdout);

    // Vérifier si le port est déjà exposé
    const checkPortMapping = await client.executeCommand(`cd ${SUPABASE_DEPLOY_PATH} && grep -A 20 "studio:" docker-compose.yml | grep -E '"3000:3000"|"3001:3000"' || echo "notfound"`);
    console.log('\nMapping de port actuel:');
    console.log(checkPortMapping.stdout);

    // Modifier docker-compose.yml pour exposer le port Studio correctement
    console.log('\n🔧 Correction du mapping de port...');
    
    // Chercher la section studio et modifier les ports
    // Format dans docker-compose: ports: - "3000:3000"
    const fixPorts = `cd ${SUPABASE_DEPLOY_PATH} && sed -i '/studio:/,/volumes:/ s/- "3000:3000"/- "${NEW_STUDIO_PORT}:3000"/g' docker-compose.yml`;
    const result1 = await client.executeCommand(fixPorts);
    
    // Essayer aussi avec le format avec /tcp
    const fixPorts2 = `cd ${SUPABASE_DEPLOY_PATH} && sed -i '/studio:/,/volumes:/ s/- "3000:3000\\/tcp"/- "${NEW_STUDIO_PORT}:3000\\/tcp"/g' docker-compose.yml`;
    await client.executeCommand(fixPorts2);

    // Vérifier après modification
    const verify = await client.executeCommand(`cd ${SUPABASE_DEPLOY_PATH} && grep -A 20 "studio:" docker-compose.yml | grep -E "(ports:|${NEW_STUDIO_PORT}:3000)" || echo "notfound"`);
    console.log('✅ Configuration après modification:');
    console.log(verify.stdout);

    // Redémarrer le service Studio uniquement
    console.log('\n🔄 Redémarrage du service Studio...');
    const restartStudio = await client.executeCommand(`cd ${SUPABASE_DEPLOY_PATH} && docker compose stop studio && docker compose rm -f studio && docker compose up -d studio`);
    
    if (restartStudio.code === 0) {
      console.log('✅ Service Studio redémarré');
    } else {
      console.warn('⚠️  Erreur lors du redémarrage du service Studio');
      console.warn(restartStudio.stderr);
    }

    // Vérifier le port finalement exposé
    console.log('\n📊 Vérification du port finalement exposé...');
    const finalCheck = await client.executeCommand(`docker ps --filter "name=supabase-studio" --format "table {{.Names}}\t{{.Ports}}"`);
    console.log('Ports exposés:');
    console.log(finalCheck.stdout);

    console.log('\n✅ Ports configurés:');
    console.log('=====================================');
    console.log(`✅ Supabase Studio: http://78.47.97.137:${NEW_STUDIO_PORT}`);
    console.log(`✅ Kong API: http://78.47.97.137:8000`);
    console.log(`✅ Easypanel (inchangé): http://78.47.97.137:3000`);
    console.log('\n');

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
    await verifyAndFixPorts();
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

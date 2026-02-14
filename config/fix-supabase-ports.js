/**
 * Script pour corriger les ports Supabase en conflit avec Easypanel
 * 
 * Usage: node config/fix-supabase-ports.js
 */

const SSHClient = require('./ssh-client');

const SUPABASE_DEPLOY_PATH = '/opt/supabase/docker';

// Ports à utiliser (en évitant les conflits)
const PORTS = {
  studio: 3001,  // Studio au lieu de 3000 (Easypanel)
  kongHttp: 8000,  // Kong HTTP (ok)
  kongHttps: 8443,  // Kong HTTPS (ok)
  analytics: 4000,  // Analytics (ok)
  pooler: 5432,  // Pooler (peut entrer en conflit, voir)
  poolerTransaction: 6543  // Pooler transaction (ok)
};

async function fixPorts() {
  console.log('🔧 Correction des ports Supabase pour éviter les conflits...\n');
  console.log(`Port actuellement utilisé par Easypanel: 3000\n`);
  console.log(`Nouveau port pour Supabase Studio: ${PORTS.studio}\n`);

  const client = new SSHClient();

  try {
    await client.connect();

    // Vérifier l'état actuel
    console.log('📊 Vérification de l\'état actuel...');
    const checkPorts = await client.executeCommand(`cd ${SUPABASE_DEPLOY_PATH} && docker compose ps --format json | grep -E '"ports"' || echo "check"`);
    console.log('✅ État vérifié\n');

    // Modifier docker-compose.yml pour changer le port Studio
    console.log('📝 Modification du docker-compose.yml...');
    
    // Trouver et remplacer le port Studio dans docker-compose.yml
    // Il faut trouver la section studio et modifier le mapping de ports
    const fixStudioPort = `cd ${SUPABASE_DEPLOY_PATH} && sed -i 's|- "3000:3000"|- "${PORTS.studio}:3000"|g' docker-compose.yml && sed -i 's|- "3000:3000/tcp"|- "${PORTS.studio}:3000/tcp"|g' docker-compose.yml`;
    const result1 = await client.executeCommand(fixStudioPort);
    
    if (result1.code === 0) {
      console.log('✅ Port Studio modifié dans docker-compose.yml');
    }

    // Vérifier que la modification a été appliquée
    const verify = await client.executeCommand(`cd ${SUPABASE_DEPLOY_PATH} && grep -E "studio:" -A 10 docker-compose.yml | grep -E "ports:" -A 2 || echo "notfound"`);
    console.log('📋 Configuration du port Studio:', verify.stdout.substring(0, 200));

    // Modifier le .env pour les URLs
    console.log('\n📝 Mise à jour des URLs dans .env...');
    const envCommands = [
      `cd ${SUPABASE_DEPLOY_PATH} && sed -i 's|^SITE_URL=.*|SITE_URL=http://localhost:${PORTS.studio}|' .env`,
      `cd ${SUPABASE_DEPLOY_PATH} && sed -i 's|^API_EXTERNAL_URL=.*|API_EXTERNAL_URL=http://localhost:${PORTS.kongHttp}|' .env`,
      `cd ${SUPABASE_DEPLOY_PATH} && sed -i 's|^SUPABASE_PUBLIC_URL=.*|SUPABASE_PUBLIC_URL=http://localhost:${PORTS.kongHttp}|' .env`
    ];

    for (const cmd of envCommands) {
      await client.executeCommand(cmd);
    }
    console.log('✅ URLs mises à jour dans .env');

    // Redémarrer les services
    console.log('\n🔄 Redémarrage des services avec les nouveaux ports...');
    const restartCmd = `cd ${SUPABASE_DEPLOY_PATH} && docker compose down && docker compose up -d`;
    const restartResult = await client.executeCommand(restartCmd);

    if (restartResult.code === 0) {
      console.log('✅ Services redémarrés avec les nouveaux ports');
    } else {
      console.error('❌ Erreur lors du redémarrage:');
      console.error(restartResult.stderr);
      throw new Error('Échec du redémarrage');
    }

    // Vérifier l'état final
    console.log('\n📊 Vérification de l\'état final...');
    const finalCheck = await client.executeCommand(`cd ${SUPABASE_DEPLOY_PATH} && docker compose ps | grep studio || echo "check"`);
    console.log('📋 État Studio:', finalCheck.stdout);

    console.log('\n📋 Nouveaux ports configurés:');
    console.log('=====================================');
    console.log(`✅ Studio: http://78.47.97.137:${PORTS.studio}`);
    console.log(`✅ Kong API: http://78.47.97.137:${PORTS.kongHttp}`);
    console.log(`✅ Kong HTTPS: https://78.47.97.137:${PORTS.kongHttps}`);
    console.log(`✅ Analytics: http://78.47.97.137:${PORTS.analytics}`);
    console.log('\n⚠️  N\'oubliez pas de mettre à jour les URLs dans le .env si vous changez de domaine !\n');

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
    await fixPorts();
  } catch (error) {
    console.error('\n❌ Erreur fatale:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixPorts };

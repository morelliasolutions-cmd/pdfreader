/**
 * Script pour résoudre les conflits de réseaux Docker avec Easypanel
 * Erreur: "demande de pool invalide : Le pool chevauche un autre sur cet espace d'adressage"
 */

const SSHClient = require('./ssh-client');

async function fixEasypanelNetwork() {
  console.log('🔧 Résolution des conflits de réseaux Docker/Easypanel...\n');

  const client = new SSHClient();

  try {
    await client.connect();

    // 1. Lister tous les réseaux
    console.log('📋 Réseaux Docker existants:');
    const listNetworks = await client.executeCommand('docker network ls');
    console.log(listNetworks.stdout || listNetworks.stderr);

    // 2. Lister les conteneurs Easypanel
    console.log('\n🎯 Conteneurs Easypanel:');
    const easypanelContainers = await client.executeCommand('docker ps -a | grep -i easypanel || echo "Aucun conteneur Easypanel trouvé"');
    console.log(easypanelContainers.stdout || easypanelContainers.stderr);

    // 3. Nettoyer les réseaux orphelins
    console.log('\n🧹 Nettoyage des réseaux orphelins...');
    const pruneNetworks = await client.executeCommand('docker network prune -f');
    console.log(pruneNetworks.stdout || pruneNetworks.stderr);

    // 4. Vérifier les réseaux Easypanel spécifiques
    console.log('\n🔍 Recherche de réseaux Easypanel...');
    const easypanelNetworks = await client.executeCommand('docker network ls | grep -i easypanel || echo "Aucun réseau Easypanel trouvé"');
    console.log(easypanelNetworks.stdout || easypanelNetworks.stderr);

    // 5. Solution: Redémarrer Docker
    console.log('\n💡 Solution recommandée:');
    console.log('   Pour résoudre définitivement le problème:');
    console.log('   1. Arrêter Docker: systemctl stop docker');
    console.log('   2. Nettoyer les fichiers de réseau: rm -f /var/lib/docker/network/files/local-kv.db');
    console.log('   3. Redémarrer Docker: systemctl start docker');
    console.log('   4. Redémarrer Easypanel\n');

    console.log('⚠️  Voulez-vous que je redémarre Docker maintenant? (non-exécuté pour sécurité)');
    console.log('   Pour l\'exécuter manuellement via SSH:');
    console.log('   ssh root@78.47.97.137 "systemctl restart docker"\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  } finally {
    client.disconnect();
  }
}

fixEasypanelNetwork().catch(console.error);

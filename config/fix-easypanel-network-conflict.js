/**
 * Script pour résoudre les conflits de réseaux Easypanel
 * Redémarre Docker proprement pour résoudre les conflits de pools IP
 */

const SSHClient = require('./ssh-client');

async function fixEasypanelNetworkConflict() {
  console.log('🔧 Résolution du conflit de réseaux Easypanel...\n');
  console.log('⚠️  ATTENTION: Cela va redémarrer Docker (tous les conteneurs seront temporairement arrêtés)\n');

  const client = new SSHClient();

  try {
    await client.connect();

    // 1. Arrêter Docker Swarm pour libérer les réseaux overlay
    console.log('📋 Vérification de Docker Swarm...');
    const swarmCheck = await client.executeCommand('docker info --format "{{.Swarm.LocalNodeState}}" 2>&1');
    const swarmState = swarmCheck.stdout.trim();
    
    if (swarmState && swarmState !== 'inactive') {
      console.log(`   État Swarm: ${swarmState}`);
      console.log('   ⚠️  Docker Swarm est actif - les réseaux overlay seront nettoyés lors du redémarrage');
    } else {
      console.log('   Swarm inactif');
    }

    // 2. Sauvegarder la liste des conteneurs en cours d'exécution
    console.log('\n📦 Liste des conteneurs en cours d\'exécution:');
    const runningContainers = await client.executeCommand('docker ps --format "{{.Names}}"');
    console.log(runningContainers.stdout || 'Aucun conteneur en cours d\'exécution');

    // 3. Nettoyer les réseaux orphelins avant redémarrage
    console.log('\n🧹 Nettoyage des réseaux orphelins...');
    const pruneNetworks = await client.executeCommand('docker network prune -f');
    if (pruneNetworks.stdout.trim()) {
      console.log(pruneNetworks.stdout);
    }

    // 4. Redémarrer Docker
    console.log('\n🔄 Redémarrage de Docker...');
    console.log('   Arrêt de Docker...');
    const stopDocker = await client.executeCommand('systemctl stop docker 2>&1');
    
    if (stopDocker.stderr && !stopDocker.stderr.includes('success')) {
      console.log('   ⚠️  Erreurs possibles lors de l\'arrêt:', stopDocker.stderr);
    }
    
    // Attendre un peu
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Nettoyer le fichier de base de données réseau (optionnel mais recommandé)
    console.log('   Nettoyage des fichiers réseau...');
    const cleanNetwork = await client.executeCommand(
      'rm -f /var/lib/docker/network/files/local-kv.db 2>&1 || echo "Fichier non trouvé ou déjà supprimé"'
    );
    if (cleanNetwork.stdout.trim()) {
      console.log(`   ${cleanNetwork.stdout.trim()}`);
    }
    
    console.log('   Démarrage de Docker...');
    const startDocker = await client.executeCommand('systemctl start docker 2>&1');
    
    if (startDocker.stderr && !startDocker.stderr.includes('success')) {
      console.log('   ⚠️  Erreurs possibles lors du démarrage:', startDocker.stderr);
    }
    
    // Attendre que Docker soit prêt
    console.log('   Attente du démarrage complet de Docker...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Vérifier que Docker est bien démarré
    const dockerStatus = await client.executeCommand('systemctl is-active docker 2>&1');
    if (dockerStatus.stdout.trim() === 'active') {
      console.log('   ✅ Docker est actif\n');
    } else {
      console.log(`   ⚠️  État de Docker: ${dockerStatus.stdout.trim()}\n`);
    }

    // 5. Vérifier l'état des réseaux
    console.log('✅ Vérification des réseaux après redémarrage:');
    const finalNetworks = await client.executeCommand('docker network ls --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}"');
    console.log(finalNetworks.stdout || finalNetworks.stderr);

    // 6. Redémarrer Easypanel si nécessaire
    console.log('\n🎯 Vérification d\'Easypanel...');
    const easypanelStatus = await client.executeCommand('docker ps --filter "name=easypanel" --format "{{.Names}}\t{{.Status}}" || echo "Easypanel non trouvé"');
    console.log(easypanelStatus.stdout || easypanelStatus.stderr);

    console.log('\n✅ Redémarrage de Docker terminé !');
    console.log('💡 Si Easypanel n\'est pas démarré, redémarrez-le manuellement\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    console.error(error.stack);
    
    // Essayer de redémarrer Docker en cas d'erreur
    try {
      console.log('\n🔄 Tentative de redémarrage de Docker en cas d\'erreur...');
      await client.executeCommand('systemctl start docker 2>&1');
    } catch (e) {
      console.error('❌ Impossible de redémarrer Docker:', e.message);
    }
  } finally {
    client.disconnect();
  }
}

// Exécution
async function main() {
  try {
    await fixEasypanelNetworkConflict();
  } catch (error) {
    console.error('\n❌ Échec:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixEasypanelNetworkConflict };

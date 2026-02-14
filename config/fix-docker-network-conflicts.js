/**
 * Script pour diagnostiquer et résoudre les conflits de réseaux Docker
 * Erreur: "demande de pool invalide : Le pool chevauche un autre sur cet espace d'adressage"
 * 
 * Usage: node config/fix-docker-network-conflicts.js
 */

const SSHClient = require('./ssh-client');

async function fixDockerNetworkConflicts() {
  console.log('🔍 Diagnostic des conflits de réseaux Docker...\n');

  const client = new SSHClient();

  try {
    await client.connect();

    // ============================================
    // 1. LISTER TOUS LES RÉSEAUX DOCKER
    // ============================================
    console.log('📋 Liste des réseaux Docker:');
    const listNetworks = await client.executeCommand(
      'docker network ls --format "table {{.ID}}\t{{.Name}}\t{{.Driver}}\t{{.Scope}}"'
    );
    console.log(listNetworks.stdout);

    // ============================================
    // 2. INSPECTER LES RÉSEAUX POUR VOIR LES POOLS IP
    // ============================================
    console.log('\n🔍 Analyse des pools IP des réseaux...');
    const inspectNetworks = await client.executeCommand(
      'docker network ls -q | xargs -I {} sh -c "echo \"=== Network: $(docker network inspect --format \\\"{{.Name}}\\\" {})\" && docker network inspect {} --format \\\"{{range .IPAM.Config}}{{.Subnet}} ({{.IPRange}}){{end}}\\\""'
    );
    
    if (inspectNetworks.stdout.trim()) {
      console.log(inspectNetworks.stdout);
    }

    // ============================================
    // 3. VÉRIFIER LES RÉSEAUX EASYPANEL
    // ============================================
    console.log('\n🎯 Recherche des réseaux Easypanel...');
    const easypanelNetworks = await client.executeCommand(
      'docker network ls --filter "name=easypanel" --format "{{.Name}}"'
    );
    
    if (easypanelNetworks.stdout.trim()) {
      const networks = easypanelNetworks.stdout.trim().split('\n').filter(n => n);
      console.log(`   ${networks.length} réseau(x) Easypanel trouvé(s):`);
      networks.forEach(net => console.log(`     - ${net}`));
    } else {
      console.log('   ℹ️  Aucun réseau Easypanel trouvé');
    }

    // ============================================
    // 4. SUPPRIMER LES RÉSEAUX ORPHELINS/INUTILISÉS
    // ============================================
    console.log('\n🧹 Nettoyage des réseaux non utilisés...');
    
    // Lister les réseaux non utilisés (sauf bridge, host, none)
    const unusedNetworks = await client.executeCommand(
      'docker network ls --filter "type=custom" --format "{{.Name}}" | grep -v -E "^(bridge|host|none)$"'
    );
    
    if (unusedNetworks.stdout.trim()) {
      const networks = unusedNetworks.stdout.trim().split('\n').filter(n => n);
      console.log(`   ${networks.length} réseau(x) personnalisé(s) trouvé(s)`);
      
      // Pour chaque réseau, vérifier s'il est utilisé
      for (const networkName of networks) {
        const checkUsage = await client.executeCommand(
          `docker ps -a --filter "network=${networkName}" --format "{{.Names}}" | wc -l`
        );
        
        const containerCount = parseInt(checkUsage.stdout.trim()) || 0;
        
        if (containerCount === 0) {
          console.log(`   🗑️  Suppression du réseau non utilisé: ${networkName}`);
          await client.executeCommand(
            `docker network rm ${networkName} 2>&1`
          );
        } else {
          console.log(`   ✅ Réseau utilisé (${containerCount} conteneur(s)): ${networkName}`);
        }
      }
    }

    // ============================================
    // 5. SUPPRIMER LE RÉSEAU PAR DÉFAUT DOCKER SI PROBLÉMATIQUE
    // ============================================
    console.log('\n🔄 Vérification du réseau bridge par défaut...');
    
    // Inspecter le réseau bridge
    const bridgeInfo = await client.executeCommand(
      'docker network inspect bridge --format "{{range .IPAM.Config}}{{.Subnet}}{{end}}" 2>&1'
    );
    
    if (bridgeInfo.stdout.trim()) {
      console.log(`   Réseau bridge: ${bridgeInfo.stdout.trim()}`);
    }

    // ============================================
    // 6. NETTOYER LES RÉSEAUX ORPHELINS
    // ============================================
    console.log('\n🧹 Nettoyage automatique des réseaux orphelins...');
    const pruneResult = await client.executeCommand('docker network prune -f 2>&1');
    
    if (pruneResult.stdout.trim()) {
      const lines = pruneResult.stdout.trim().split('\n');
      const deleted = lines.find(line => line.includes('Deleted'));
      if (deleted) {
        console.log(`   ✅ ${deleted}`);
      }
    }

    // ============================================
    // 7. VÉRIFIER LES CONTENEURS EASYPANEL
    // ============================================
    console.log('\n🎯 Vérification des conteneurs Easypanel...');
    const easypanelContainers = await client.executeCommand(
      'docker ps -a --filter "name=easypanel" --format "table {{.Names}}\t{{.Status}}\t{{.Networks}}"'
    );
    
    if (easypanelContainers.stdout.trim() && easypanelContainers.stdout.includes('NAMES')) {
      console.log(easypanelContainers.stdout);
    } else {
      console.log('   ℹ️  Aucun conteneur Easypanel trouvé');
    }

    // ============================================
    // 8. INFORMATIONS SUR LE DAEMON DOCKER
    // ============================================
    console.log('\n🐳 Informations sur Docker daemon...');
    const dockerInfo = await client.executeCommand(
      'docker info --format "{{.OperatingSystem}}\n{{.DockerRootDir}}\nDefault Address Pool: {{.DefaultAddressPools}}" 2>&1'
    );
    
    if (dockerInfo.stdout.trim()) {
      console.log(dockerInfo.stdout);
    }

    // ============================================
    // 9. RECOMMANDATIONS
    // ============================================
    console.log('\n💡 Recommandations pour résoudre le problème:\n');
    console.log('   1. Si Easypanel est installé via Docker Compose:');
    console.log('      - Arrêtez tous les conteneurs Easypanel');
    console.log('      - Supprimez les réseaux Easypanel manuellement');
    console.log('      - Redémarrez les services Easypanel\n');
    
    console.log('   2. Si le problème persiste:');
    console.log('      - Redémarrez le service Docker: systemctl restart docker');
    console.log('      - Vérifiez la configuration daemon.json: /etc/docker/daemon.json\n');
    
    console.log('   3. Pour recréer le réseau bridge:');
    console.log('      - Arrêtez Docker: systemctl stop docker');
    console.log('      - Supprimez: rm /var/lib/docker/network/files/local-kv.db');
    console.log('      - Redémarrez Docker: systemctl start docker\n');

    // ============================================
    // 10. VÉRIFICATION FINALE
    // ============================================
    console.log('✅ Vérification finale des réseaux:\n');
    const finalCheck = await client.executeCommand(
      'docker network ls --format "table {{.Name}}\t{{.Driver}}\t{{.Scope}}"'
    );
    console.log(finalCheck.stdout);

  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    throw error;
  } finally {
    client.disconnect();
  }
}

// Exécution
async function main() {
  try {
    await fixDockerNetworkConflicts();
  } catch (error) {
    console.error('\n❌ Échec:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixDockerNetworkConflicts };
